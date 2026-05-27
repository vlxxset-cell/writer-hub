document.addEventListener('DOMContentLoaded', () => {
  const entryDate = document.getElementById('entryDate');
  const entryWords = document.getElementById('entryWords');
  const entryMinutes = document.getElementById('entryMinutes');
  const entryIntensity = document.getElementById('entryIntensity');
  const saveEntryBtn = document.getElementById('saveEntryBtn');
  const clearCalendarBtn = document.getElementById('clearCalendarBtn');
  const activityHeatmap = document.getElementById('activityHeatmap');
  const monthLabel = document.getElementById('monthLabel');
  const lastSession = document.getElementById('lastSession');
  const currentStreak = document.getElementById('currentStreak');
  const bestWeek = document.getElementById('bestWeek');
  const activeMonth = document.getElementById('activeMonth');
  const monthEntries = document.getElementById('monthEntries');
  const monthWords = document.getElementById('monthWords');
  const avgIntensity = document.getElementById('avgIntensity');
  const bestDay = document.getElementById('bestDay');
  const bestWordsDay = document.getElementById('bestWordsDay');
  const bestMinutesDay = document.getElementById('bestMinutesDay');

  const STORAGE_KEY = 'writingCalendarEntries';
  const undoToast = document.getElementById('calendarUndoToast');
  const undoBtn = document.getElementById('undoBtn');
  const undoProgressBar = document.getElementById('undoProgressBar');
  const deleteEntryBtn = document.getElementById('deleteEntryBtn');

  let pendingUndo = null; // { timerId, restoreFn }
  // View state for heatmap (0-based month)
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  // Normalize various date inputs to local YYYY-MM-DD
  function normalizeDate(date) {
    if (!date) return '';
    if (typeof date === 'string') {
      // If full ISO timestamp, extract date portion
      if (date.indexOf('T') !== -1) return date.slice(0, 10);
      // If already YYYY-MM-DD, return as-is
      return date;
    }
    // Date object -> local date components (avoid toISOString timezone shifts)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function getToday() {
    return normalizeDate(new Date());
  }

  function ensureDateValue() {
    if (!entryDate.value) {
      entryDate.value = getToday();
    }
  }

  function parseEntries(entries) {
    return entries.map((entry) => ({
      date: normalizeDate(entry.date),
      words: Number(entry.words) || 0,
      minutes: Number(entry.minutes) || 0,
      intensity: Number(entry.intensity) || 0,
      savedAt: entry.savedAt || ''
    }));
  }

  function buildHeatmap(entries, year, month) {
    activityHeatmap.innerHTML = '';

    const currentYear = typeof year === 'number' ? year : viewYear;
    const currentMonth = typeof month === 'number' ? month : viewMonth;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const firstWeekday = monthStart.getDay();
    const offset = (firstWeekday + 6) % 7;

    const monthEntries = entries.filter((entry) => {
      const [y, m] = entry.date.split('-').map(Number);
      return y === currentYear && m === currentMonth + 1;
    });

    const entryMap = monthEntries.reduce((map, entry) => {
      map[entry.date] = entry;
      return map;
    }, {});

    for (let i = 0; i < offset; i += 1) {
      const placeholder = document.createElement('div');
      placeholder.className = 'heatmap-cell placeholder';
      activityHeatmap.appendChild(placeholder);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateValue = normalizeDate(new Date(currentYear, currentMonth, day));
      const entry = entryMap[dateValue];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'heatmap-cell';
      cell.textContent = day;
      cell.dataset.date = dateValue;
      const intensity = entry ? entry.intensity : 0;
      cell.dataset.intensity = intensity;
      if (intensity > 0) {
        cell.classList.add(`heat-level-${Math.min(4, intensity)}`);
      }
      if (entry) {
        cell.title = `${entry.words} слов · ${entry.minutes} мин · ${['—', 'Легко', 'Средне', 'Серьёзно', 'Прорыв'][entry.intensity]}`;
        cell.addEventListener('click', () => {
          entryDate.value = dateValue;
          entryWords.value = entry.words;
          entryMinutes.value = entry.minutes;
          entryIntensity.value = entry.intensity;
        });
      }
      activityHeatmap.appendChild(cell);
    }
  }

  // Undo toast helpers
  function showUndo(message, restoreFn, duration = 6000) {
    if (!undoToast) return;
    if (pendingUndo && pendingUndo.timerId) {
      clearTimeout(pendingUndo.timerId);
      pendingUndo = null;
    }
    undoBtn.textContent = 'Отменить';
    document.getElementById('undoMessage').textContent = message;
    undoToast.classList.add('show');
    let start = Date.now();
    undoProgressBar.style.width = '100%';
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      undoProgressBar.style.width = pct + '%';
      if (pct > 0) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    const timerId = setTimeout(() => {
      // finalize (cannot undo)
      undoToast.classList.remove('show');
      pendingUndo = null;
      if (typeof restoreFn === 'function' && restoreFn.__commit) restoreFn.__commit();
    }, duration);

    pendingUndo = { timerId, restoreFn };

    undoBtn.onclick = () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timerId);
      // call restore
      try { pendingUndo.restoreFn(); } catch (e) { /* ignore */ }
      undoToast.classList.remove('show');
      pendingUndo = null;
    };
  }

  function getSummary(entries, year = viewYear, month = viewMonth) {
    const parsed = parseEntries(entries);
    const sorted = [...parsed].sort((a, b) => a.date.localeCompare(b.date));
    const today = getToday();
    const days = sorted.map((entry) => entry.date);

    const last = sorted[sorted.length - 1];
    lastSession.textContent = last ? `${last.date} · ${last.words} слов` : 'Нет записей';

    const streak = computeStreak(sorted, today);
    currentStreak.textContent = streak;

    const monthStats = computeMonthStats(parsed, year, month);
    monthEntries.textContent = monthStats.entries;
    monthWords.textContent = monthStats.words;
    avgIntensity.textContent = monthStats.avgIntensity.toFixed(1);
    bestDay.textContent = monthStats.bestDay || '—';
    bestWordsDay.textContent = monthStats.bestWordsDay || '—';
    bestMinutesDay.textContent = monthStats.bestMinutesDay || '—';
    activeMonth.textContent = monthStats.activeMonth || '—';
    bestWeek.textContent = `${monthStats.bestWeekEntries} дня`;
    monthLabel.textContent = `${monthStats.monthName} ${monthStats.year}`;
  }

  function computeStreak(sortedEntries, today) {
    const entryDates = new Set(sortedEntries.map((entry) => entry.date));
    let streak = 0;
    let cursor = new Date(today);
    while (true) {
      const dateKey = normalizeDate(cursor);
      if (!entryDates.has(dateKey)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function computeMonthStats(entries) {
    const now = new Date();
    const year = arguments.length >= 2 && typeof arguments[1] === 'number' ? arguments[1] : now.getFullYear();
    const month = arguments.length >= 3 && typeof arguments[2] === 'number' ? arguments[2] + 1 : now.getMonth() + 1;
    const monthName = new Date(year, month - 1, 1).toLocaleString('ru', { month: 'long' });

    const monthEntries = entries.filter((entry) => {
      const [y, m] = entry.date.split('-').map(Number);
      return y === year && m === month;
    });

    const words = monthEntries.reduce((sum, entry) => sum + entry.words, 0);
    const minutes = monthEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const avgIntensity = monthEntries.length ? monthEntries.reduce((sum, entry) => sum + entry.intensity, 0) / monthEntries.length : 0;
    const bestDayEntry = monthEntries.reduce((best, entry) => (!best || entry.words > best.words ? entry : best), null);
    const bestMinutesEntry = monthEntries.reduce((best, entry) => (!best || entry.minutes > best.minutes ? entry : best), null);
    const byWeek = {};
    monthEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const week = `${date.getFullYear()}-${Math.ceil((date.getDate() + ((date.getDay() + 6) % 7)) / 7)}`;
      byWeek[week] = (byWeek[week] || 0) + 1;
    });

    const bestWeekEntries = Math.max(0, ...Object.values(byWeek));

    return {
      entries: monthEntries.length,
      words,
      avgIntensity,
      bestDay: bestDayEntry ? `${bestDayEntry.date} (${bestDayEntry.words})` : '',
      bestWordsDay: bestDayEntry ? `${bestDayEntry.date}` : '',
      bestMinutesDay: bestMinutesEntry ? `${bestMinutesEntry.date}` : '',
      monthName,
      year,
      activeMonth: monthEntries.length ? `${monthName}` : '',
      bestWeekEntries
    };
  }

  function syncForm(entries) {
    ensureDateValue();
    const dateKey = entryDate.value;
    const existing = entries.find((entry) => entry.date === dateKey);
    if (existing) {
      entryWords.value = existing.words;
      entryMinutes.value = existing.minutes;
      entryIntensity.value = existing.intensity;
    } else {
      entryWords.value = '';
      entryMinutes.value = '';
      entryIntensity.value = '0';
    }
  }

  function handleSave() {
    const date = normalizeDate(entryDate.value);
    if (!date) return alert('Выберите дату');

    const entries = parseEntries(loadEntries());
    const existingIndex = entries.findIndex((entry) => entry.date === date);
    const payload = {
      date,
      words: Number(entryWords.value) || 0,
      minutes: Number(entryMinutes.value) || 0,
      intensity: Number(entryIntensity.value) || 0,
      savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = payload;
    } else {
      entries.push(payload);
    }

    saveEntries(entries);
    rebuild();
    // Сохранение выполняется автоматически без блокирующих окон
  }

  function handleDeleteDay() {
    const date = normalizeDate(entryDate.value);
    if (!date) return alert('Выберите дату');
    const entries = parseEntries(loadEntries());
    const idx = entries.findIndex((e) => e.date === date);
    if (idx === -1) return alert('Запись за выбранную дату не найдена');
    const removed = entries.splice(idx, 1)[0];
    saveEntries(entries);
    rebuild();

    // prepare restore function
    const restoreFn = () => {
      const nowEntries = parseEntries(loadEntries());
      nowEntries.push(removed);
      saveEntries(nowEntries);
      rebuild();
    };
    // mark commit: when timeout fires, nothing to do (already removed)
    restoreFn.__commit = true;
    showUndo('День удалён', restoreFn);
  }

  function handleClear() {
    if (!confirm('Очистить весь календарь записи?')) return;
    const prev = parseEntries(loadEntries());
    // clear
    localStorage.removeItem(STORAGE_KEY);
    rebuild();

    const restoreFn = () => {
      saveEntries(prev);
      rebuild();
    };
    restoreFn.__commit = true;
    showUndo('Календарь очищен', restoreFn, 8000);
  }

  function rebuild() {
    const entries = parseEntries(loadEntries());
    buildHeatmap(entries, viewYear, viewMonth);
    getSummary(entries, viewYear, viewMonth);
    syncForm(entries);
  }

  entryDate.addEventListener('change', () => {
    const entries = parseEntries(loadEntries());
    syncForm(entries);
  });

  // month navigation
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    rebuild();
  }
  if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

  saveEntryBtn.addEventListener('click', handleSave);
  deleteEntryBtn.addEventListener('click', handleDeleteDay);
  clearCalendarBtn.addEventListener('click', handleClear);

  ensureDateValue();
  rebuild();
});
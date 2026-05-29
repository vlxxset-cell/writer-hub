document.addEventListener('DOMContentLoaded', () => {
  const achievementPanel = document.getElementById('achievementPanel');

  function pad(n) { return String(n).padStart(2, '0'); }
  function normalizeDate(date) {
    if (!date) return '';
    if (typeof date === 'string') {
      if (date.indexOf('T') !== -1) return date.slice(0, 10);
      return date;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function loadCalendarEntries() {
    try {
      return JSON.parse(localStorage.getItem('writingCalendarEntries') || '[]');
    } catch {
      return [];
    }
  }

  function parseCalendarEntries(entries) {
    return (entries || []).map((entry) => ({
      date: normalizeDate(entry.date),
      words: Number(entry.words) || 0,
      minutes: Number(entry.minutes) || 0,
      intensity: Number(entry.intensity) || 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  function computeStreak(entries, today) {
    const entryDates = new Set(entries.map((entry) => entry.date));
    let streak = 0;
    let cursor = new Date(today);
    while (true) {
      const key = normalizeDate(cursor);
      if (!entryDates.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function clampPercent(value) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }

  function computeAchievements(entries) {
    const parsed = parseCalendarEntries(entries);
    const uniqueDays = [...new Set(parsed.map((entry) => entry.date))];
    const today = normalizeDate(new Date());
    const currentStreak = computeStreak(parsed, today);
    const bestWords = parsed.reduce((max, entry) => Math.max(max, entry.words), 0);
    const bestMinutes = parsed.reduce((max, entry) => Math.max(max, entry.minutes), 0);
    const daysWithGoal = parsed.filter((entry) => entry.words >= 100).length;
    let hadBreak = false;
    let foundBurst = false;
    let prevDate = null;

    parsed.forEach((entry) => {
      if (prevDate) {
        const diff = (new Date(entry.date) - new Date(prevDate)) / (1000 * 60 * 60 * 24);
        if (diff > 1) {
          hadBreak = true;
          if (entry.minutes >= 120 && entry.words >= 1000) {
            foundBurst = true;
          }
        }
      }
      prevDate = entry.date;
    });

    const books = JSON.parse(localStorage.getItem('books') || '[]');
    const bookStarted = books.length > 0 ? 100 : 0;
    const bookCompleted = books.some((book) => book && (book.completed || book.progress >= 100)) ? 100 : 0;
    const chapterCompleted = books.some((book) => book?.chapters?.some((chapter) => chapter?.completed)) ? 100 : 0;

    return [
      { icon: '🔥', name: 'Базовые серии', progress: clampPercent(uniqueDays / 7 * 100), desc: 'Накопи дни записи в календаре.' },
      { icon: '🔥', name: '3 дня непрерывного', progress: clampPercent(currentStreak / 3 * 100), desc: 'Текущая серия записей подряд.' },
      { icon: '🔥', name: '7 дней дисциплины', progress: clampPercent(currentStreak / 7 * 100), desc: 'Собери неделю без пропусков.' },
      { icon: '🔥', name: '14 дней стабильности', progress: clampPercent(currentStreak / 14 * 100), desc: 'Две недели постоянного письма.' },
      { icon: '🔥', name: '30 дней режима писателя', progress: clampPercent(currentStreak / 30 * 100), desc: 'Месяц с ежедневными записями.' },
      { icon: '⏱️', name: '1 час за сессию', progress: clampPercent(bestMinutes / 60 * 100), desc: 'Лучший сеанс по времени.' },
      { icon: '⏳', name: '3 часа в день', progress: clampPercent(bestMinutes / 180 * 100), desc: 'День с самой длинной записью.' },
      { icon: '🕰️', name: 'Самая длинная сессия', progress: clampPercent(bestMinutes / 240 * 100), desc: 'Прогресс к очень длинному сеансу.' },
      { icon: '📖', name: '1 000 слов за день', progress: clampPercent(bestWords / 1000 * 100), desc: 'Максимальный дневной объём.' },
      { icon: '✍️', name: '5 000 слов за день', progress: clampPercent(bestWords / 5000 * 100), desc: 'Прогресс к крупному дню слов.' },
      { icon: '📚', name: '10 000 слов за день', progress: clampPercent(bestWords / 10000 * 100), desc: 'Редкое достижение по объёму.' },
      { icon: '🧾', name: 'Первая завершённая глава', progress: chapterCompleted, desc: 'Проверка завершённых глав в проекте.' },
      { icon: '📖', name: 'Первая начатая книга', progress: bookStarted, desc: 'Начни работу хотя бы с одной книги.' },
      { icon: '🏁', name: 'Первая завершённая книга', progress: bookCompleted, desc: 'Отметь впервые завершённый проект.' },
      { icon: '🧠', name: '5 дней без пропусков', progress: clampPercent(currentStreak / 5 * 100), desc: 'Набери короткий непрерывный отрезок.' },
      { icon: '📍', name: 'Ежедневный вход в планер', progress: clampPercent(uniqueDays / 30 * 100), desc: 'Сколько дней ты был в календаре.' },
      { icon: '🔁', name: 'Возвращение после перерыва', progress: hadBreak ? 100 : clampPercent(uniqueDays / 10 * 100), desc: 'Вернись к письму после перерыва.' },
      { icon: '🎯', name: 'Выполнение дневной цели', progress: clampPercent(daysWithGoal / 30 * 100), desc: 'Дни с 100+ словами.' },
      { icon: '🎲', name: 'Внезапный всплеск', progress: foundBurst ? 100 : clampPercent(bestMinutes / 120 * 100), desc: 'Длинная продуктивная сессия после перерыва.' }
    ];
  }

  function renderAchievements() {
    if (!achievementPanel) return;
    const user = localStorage.getItem('writer_user');
    if (!user) {
      achievementPanel.innerHTML = '<p class="subtitle">Войдите, чтобы увидеть достижения.</p>';
      return;
    }

    const entries = loadCalendarEntries();
    const achievements = computeAchievements(entries);
    const nodes = achievements.map((item) => `
      <div class="achievement-badge${item.progress === 100 ? ' unlocked' : ''}">
        <div class="achievement-title">
          <span>${item.icon}</span>
          <span>${item.name}</span>
          <span class="achievement-percent">${item.progress}%</span>
          <span class="achievement-check">${item.progress === 100 ? '✓' : ''}</span>
        </div>
        <div class="achievement-desc">${item.desc}</div>
        <div class="achievement-bar"><div style="width: ${item.progress}%"></div></div>
      </div>
    `).join('');

    achievementPanel.innerHTML = `<h3>Достижения</h3><div class="achievement-grid">${nodes}</div>`;
  }

  renderAchievements();
  window.addEventListener('storage', (e) => {
    if (e.key === 'writingCalendarEntries' || e.key === 'writer_user' || e.key === 'books') {
      renderAchievements();
    }
  });
});

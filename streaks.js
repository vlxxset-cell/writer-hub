document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'writingCalendarEntries';
  const streakEl = document.getElementById('writingStreak');
  if (!streakEl) return;

  function pad(n){return String(n).padStart(2,'0');}
  function normalizeDate(d){
    if (!d) return '';
    if (typeof d === 'string') {
      if (d.indexOf('T') !== -1) return d.slice(0,10);
      return d;
    }
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function loadEntries(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }
  function saveEntries(e){ localStorage.setItem(STORAGE_KEY, JSON.stringify(e)); }

  const today = normalizeDate(new Date());
  let entries = loadEntries().map(en => ({ date: normalizeDate(en.date), words: Number(en.words)||0, minutes: Number(en.minutes)||0 }));

  // First visit: ensure there's at least one entry for today
  let firstInit = false;
  if (!entries.length) {
    entries.push({ date: today, words: 0, minutes: 0, intensity: 0, savedAt: new Date().toISOString() });
    saveEntries(entries);
    firstInit = true;
  }

  // Build set of 'good' dates: words >= 100; also count firstInit today as a start
  const goodDates = new Set();
  entries.forEach(e => {
    if (e.words >= 100) goodDates.add(e.date);
  });
  if (firstInit) goodDates.add(today);

  function computeCurrentStreak() {
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const key = normalizeDate(cursor);
      if (!goodDates.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function computeLongestStreak() {
    const arr = Array.from(goodDates).sort();
    let longest = 0, cur = 0, prev = null;
    arr.forEach(d => {
      if (prev === null) { cur = 1; }
      else {
        const pd = new Date(prev); const cd = new Date(d);
        const diff = Math.round((cd - pd) / (1000*60*60*24));
        if (diff === 1) cur += 1; else cur = 1;
      }
      longest = Math.max(longest, cur);
      prev = d;
    });
    return longest;
  }

  function render() {
    const days = computeCurrentStreak();
    const longest = computeLongestStreak();
    const daysEl = document.getElementById('streakDays');
    const longEl = document.getElementById('streakLongest');
    if (daysEl) daysEl.textContent = days;
    if (longEl) longEl.textContent = longest;
    streakEl.title = `Текущая серия: ${days} дней. Максимум: ${longest} дней.`;
  }

  streakEl.addEventListener('click', () => { window.location.href = 'writing-calendar.html'; });
  render();
  // keep widget updated when calendar changes in other tabs
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) { entries = loadEntries(); render(); } });
});

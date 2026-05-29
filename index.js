document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const welcome = document.getElementById('welcomeUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const authButtons = document.getElementById('authButtons');
  const loginToggleBtn = document.getElementById('loginToggleBtn');
  const regToggleBtn = document.getElementById('regToggleBtn');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const achievementPanel = document.getElementById('achievementPanel');

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem('users') || '{}'); } catch { return {}; }
  }

  function saveUsers(u) { localStorage.setItem('users', JSON.stringify(u)); }

  async function hashPassword(user, pass) {
    const enc = new TextEncoder().encode(user + ':' + pass);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showWelcome() {
    const user = localStorage.getItem('writer_user');
    if (user) {
      welcome.textContent = `Вы вошли как ${user}`;
      welcome.style.display = 'block';
      logoutBtn.style.display = 'inline-block';
      authButtons.style.display = 'none';
      loginForm.style.display = 'none';
      registerForm.style.display = 'none';
      if (syncAccountBtn) syncAccountBtn.style.display = 'block';
    } else {
      welcome.style.display = 'none';
      logoutBtn.style.display = 'none';
      authButtons.style.display = 'flex';
      loginForm.style.display = 'none';
      registerForm.style.display = 'none';
      if (syncAccountBtn) syncAccountBtn.style.display = 'none';
    }
  }

  function notifyUserChanged() {
    window.dispatchEvent(new Event('writer-user-changed'));
  }

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
    const daysWith100Words = parsed.filter((entry) => entry.words >= 100).length;
    const daysWithGoal = daysWith100Words;
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
      { icon: '🔁', name: 'Возвращение после перерыва', progress: hadBreak ? 100 : clampPercent(uniqueDays / 10 * 100), desc: 'Вернись к письму после короткого перерыва.' },
      { icon: '🎯', name: 'Выполнение дневной цели', progress: clampPercent(daysWithGoal / 30 * 100), desc: 'Дни с 100+ словами.' },
      { icon: '🎲', name: 'Внезапный всплеск', progress: foundBurst ? 100 : clampPercent(bestMinutes / 120 * 100), desc: 'Длинная продуктивная сессия после перерыва.' }
    ];
  }

  function renderAchievements() {
    if (!achievementPanel) return;
    const user = localStorage.getItem('writer_user');
    if (!user) {
      achievementPanel.style.display = 'none';
      return;
    }

    const entries = loadCalendarEntries();
    const achievements = computeAchievements(entries);
    const nodes = achievements.map((item) => `
      <div class="achievement-badge${item.progress === 100 ? ' unlocked' : ''}">
        <div class="achievement-title"><span>${item.icon}</span><span>${item.name}</span><span>${item.progress}%</span></div>
        <div class="achievement-desc">${item.desc}</div>
        <div class="achievement-bar"><div style="width: ${item.progress}%"></div></div>
      </div>
    `).join('');

    achievementPanel.innerHTML = `<h3>Достижения</h3><div class="achievement-grid">${nodes}</div>`;
    achievementPanel.style.display = 'block';
  }

  window.addEventListener('writer-user-changed', renderAchievements);
  window.addEventListener('storage', (e) => {
    if (e.key === 'writingCalendarEntries' || e.key === 'writer_user' || e.key === 'books') {
      renderAchievements();
    }
  });

  renderAchievements();

  loginToggleBtn.addEventListener('click', () => {
    authButtons.style.display = 'none';
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  });

  regToggleBtn.addEventListener('click', () => {
    authButtons.style.display = 'none';
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  });

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    if (!user) return alert('Введите имя пользователя');
    const users = loadUsers();
    const hash = await hashPassword(user, pass);
    if (!users[user] || users[user] !== hash) return alert('Неверный пользователь или пароль');
    localStorage.setItem('writer_user', user);
    showWelcome();
    notifyUserChanged();
    alert('Успешный вход');
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;
    if (!user) return alert('Введите имя пользователя');
    const users = loadUsers();
    if (users[user]) return alert('Пользователь уже существует');
    const hash = await hashPassword(user, pass);
    users[user] = hash;
    saveUsers(users);
    localStorage.setItem('writer_user', user);
    showWelcome();
    notifyUserChanged();
    alert('Пользователь создан и вы вошли');
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('writer_user');
    showWelcome();
    notifyUserChanged();
    alert('Вы вышли');
  });

  // Export / Import per-user data (main page buttons may be absent)
  const syncAccountBtn = document.getElementById('syncAccountBtn');
  const importAccountBtn = document.getElementById('importAccountBtn');
  const importFile = document.getElementById('importFile');

  if (syncAccountBtn && importAccountBtn && importFile) {
    syncAccountBtn.addEventListener('click', () => {
      const user = localStorage.getItem('writer_user');
      if (!user) return alert('Войдите, чтобы экспортировать данные аккаунта');
      const data = {
        users: loadUsers(),
        user: user,
        books: JSON.parse(localStorage.getItem('books') || '[]'),
        currentBook: localStorage.getItem('currentBook') || null,
        notes: JSON.parse(localStorage.getItem('notes') || '[]'),
        writingCalendarEntries: JSON.parse(localStorage.getItem('writingCalendarEntries') || '[]'),
        visual: JSON.parse(localStorage.getItem('visual') || '{}'),
        effectDraft: JSON.parse(localStorage.getItem('effectDraft') || '{}')
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user}-writer-account.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    importAccountBtn.addEventListener('click', () => importFile.click());

    importFile.addEventListener('change', (e) => {
    const user = localStorage.getItem('writer_user');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        // merge global users if present
        if (obj.users) {
          const existing = loadUsers();
          const merged = Object.assign({}, existing, obj.users);
          saveUsers(merged);
        }
        // per-user data import (requires logged-in user)
        if (user) {
          if (obj.books) {
            localStorage.setItem('books', JSON.stringify(obj.books));
          }
          if (obj.currentBook !== undefined && obj.currentBook !== null) {
            localStorage.setItem('currentBook', String(obj.currentBook));
          }
          if (obj.notes) {
            localStorage.setItem('notes', JSON.stringify(obj.notes));
          }
          if (obj.writingCalendarEntries) {
            localStorage.setItem('writingCalendarEntries', JSON.stringify(obj.writingCalendarEntries));
          }
          if (obj.visual) {
            localStorage.setItem('visual', JSON.stringify(obj.visual));
          }
          if (obj.effectDraft) {
            localStorage.setItem('effectDraft', JSON.stringify(obj.effectDraft));
          }
        } else if (!obj.users) {
          // if not logged in and no users in file, nothing to import
          return alert('Войдите, чтобы импортировать личные данные, или загрузите файл с учетными записями');
        }
        alert('Данные успешно импортированы');
      } catch (err) {
        alert('Ошибка импорта: неверный файл');
      }
    };
    reader.readAsText(file);
  });
  }

  showWelcome();
});

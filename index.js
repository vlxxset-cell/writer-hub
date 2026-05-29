document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const welcome = document.getElementById('welcomeUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const authButtons = document.getElementById('authButtons');
  const loginToggleBtn = document.getElementById('loginToggleBtn');
  const regToggleBtn = document.getElementById('regToggleBtn');
  const showRegisterBtn = document.getElementById('showRegisterBtn');

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

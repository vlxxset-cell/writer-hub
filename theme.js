document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  const themeKey = 'writer_theme';

  function applyTheme() {
    const isDark = localStorage.getItem(themeKey) === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    if (toggle) toggle.textContent = isDark ? '☀️' : '🌙';
  }

  function switchTheme() {
    const useDark = !document.body.classList.contains('dark-theme');
    localStorage.setItem(themeKey, useDark ? 'dark' : 'light');
    applyTheme();
  }

  if (toggle) {
    toggle.addEventListener('click', switchTheme);
  }

  applyTheme();
});

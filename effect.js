document.addEventListener('DOMContentLoaded', () => {
  const focusText = document.getElementById('focusText');
  const timerDisplay = document.getElementById('timerDisplay');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const sessionCount = document.getElementById('sessionCount');
  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const resetBtn = document.getElementById('resetTimerBtn');
  const formatToolbar = document.getElementById('formatToolbar');

  let timerSeconds = 0;
  let timerInterval = null;
  let sessionCountValue = 0;

  const savedDraft = JSON.parse(localStorage.getItem('effectDraft') || '{}');
  if (savedDraft.html) {
    focusText.innerHTML = savedDraft.html;
  } else if (savedDraft.text) {
    focusText.innerText = savedDraft.text;
  }

  function saveDraft() {
    localStorage.setItem('effectDraft', JSON.stringify({ html: focusText.innerHTML }));
  }

  function updateMetrics() {
    const text = focusText.innerText.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    wordCount.textContent = words;
    charCount.textContent = focusText.innerText.length;
    saveDraft();
  }

  const idleNotification = document.getElementById('idleNotification');
  let idleWarningTimer = null;
  let idleDeleteTimer = null;
  let idleCheckerInterval = null;
  let lastActivity = Date.now();
  let warningActive = false;

  function hideIdleNotification() {
    if (!idleNotification) return;
    idleNotification.textContent = '';
    idleNotification.classList.remove('visible');
  }

  function showIdleWarning() {
    if (!idleNotification) return;
    idleNotification.textContent = 'Если вы не напишете что-то в течение минуты, текст будет удалён.';
    idleNotification.classList.add('visible');
  }

  function performIdleDeletionIfNeeded() {
    const textPresent = (focusText.innerText || '').trim().length > 0;
    const htmlStr = (focusText.innerHTML || '').replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').replace(/\s+/g, '');
    const htmlPresent = htmlStr.length > 0;
    if (textPresent || htmlPresent) {
      focusText.innerHTML = '';
      updateMetrics();
    }
    hideIdleNotification();
    warningActive = false;
  }

  function startIdleChecker() {
    if (idleCheckerInterval) return;
    idleCheckerInterval = setInterval(() => {
      const delta = Date.now() - (lastActivity || 0);
      if (!warningActive && delta >= 120_000) {
        showIdleWarning();
        warningActive = true;
      }
      if (warningActive && delta >= 180_000) {
        performIdleDeletionIfNeeded();
      }
    }, 3000);
  }

  function stopIdleChecker() {
    if (idleCheckerInterval) { clearInterval(idleCheckerInterval); idleCheckerInterval = null; }
    warningActive = false;
  }

  function resetIdleTimers() {
    hideIdleNotification();
    lastActivity = Date.now();
    warningActive = false;
    if (idleCheckerInterval) { clearInterval(idleCheckerInterval); idleCheckerInterval = null; }
    startIdleChecker();
  }

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  function refreshTimer() {
    timerDisplay.textContent = formatTime(timerSeconds);
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      timerSeconds += 1;
      refreshTimer();
    }, 1000);
    sessionCountValue += 1;
    sessionCount.textContent = sessionCountValue;
    // Запускаем детектор простоя при старте сессии
    lastActivity = Date.now();
    startIdleChecker();
  }

  function pauseTimer() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    refreshTimer();
  }

  function applyFormat(command, value = null) {
    document.execCommand(command, false, value);
    focusText.focus();
  }

  function initToolbar() {
    if (!formatToolbar) return;
    formatToolbar.querySelectorAll('.format-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const command = button.dataset.command;
        const value = button.dataset.value || null;
        applyFormat(command, value);
      });
    });
  }

  // catch many input-related events to update last activity reliably on mobile/desktop
  ['input','keydown','keyup','paste','cut','compositionend'].forEach(evt => {
    focusText.addEventListener(evt, (e) => {
      lastActivity = Date.now();
      if (evt === 'input' || evt === 'paste' || evt === 'cut' || evt === 'compositionend') updateMetrics();
      resetIdleTimers();
    });
  });
  // pointer interactions (tap/click) should also count as activity even if not typing
  ['pointerdown','touchstart','mousedown','click'].forEach(evt => {
    focusText.addEventListener(evt, () => { lastActivity = Date.now(); });
  });
  focusText.addEventListener('focus', () => {
    focusText.classList.add('focus-active');
    lastActivity = Date.now();
    startIdleChecker();
  });
  focusText.addEventListener('blur', () => focusText.classList.remove('focus-active'));

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  initToolbar();
  updateMetrics();
  refreshTimer();
  // Начать отслеживание простоя сразу после загрузки страницы
  lastActivity = Date.now();
  startIdleChecker();
  window.addEventListener('beforeunload', () => { if (idleCheckerInterval) clearInterval(idleCheckerInterval); });
});

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

  function clearIdleTimers() {
    clearTimeout(idleWarningTimer);
    clearTimeout(idleDeleteTimer);
    idleWarningTimer = null;
    idleDeleteTimer = null;
  }

  function scheduleIdleTimers() {
    clearIdleTimers();
    idleWarningTimer = setTimeout(() => {
      showIdleWarning();
      idleDeleteTimer = setTimeout(() => {
        if (focusText.innerText.trim().length > 0) {
          focusText.innerHTML = '';
          updateMetrics();
          hideIdleNotification();
        }
      }, 60_000);
    }, 120_000);
  }

  function resetIdleTimers() {
    hideIdleNotification();
    clearIdleTimers();
    if (focusText.innerText.trim().length > 0) {
      scheduleIdleTimers();
    }
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

  focusText.addEventListener('input', () => {
    updateMetrics();
    resetIdleTimers();
  });
  focusText.addEventListener('keydown', resetIdleTimers);
  focusText.addEventListener('focus', () => {
    focusText.classList.add('focus-active');
    if (focusText.innerText.trim().length > 0) {
      scheduleIdleTimers();
    }
  });
  focusText.addEventListener('blur', () => focusText.classList.remove('focus-active'));

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  initToolbar();
  updateMetrics();
  refreshTimer();
});

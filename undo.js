// Унифицированный менеджер undo/toast
(function(){
  let active = null;

  function createToast() {
    let toast = document.getElementById('undoToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'undoToast';
      toast.className = 'undo-toast';
      document.body.appendChild(toast);
    }
    return toast;
  }

  async function register(message, onUndo, duration = 5000) {
    // cancel previous
    if (active && active.cancel) active.cancel();

    const toast = createToast();
    toast.innerHTML = `
      <div class="undo-label">
        <span class="undo-toast__text">${message}</span>
        <span class="undo-timer">${Math.ceil(duration/1000)} сек</span>
      </div>
      <button class="undo-action">отменить</button>
      <div class="undo-progress"><div class="undo-progress__bar"></div></div>
    `;
    toast.classList.add('show');
    toast.style.display = 'flex';

    const progressBar = toast.querySelector('.undo-progress__bar');
    const timerText = toast.querySelector('.undo-timer');
    const btn = toast.querySelector('.undo-action');

    const start = Date.now();
    let interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.max(0, 100 - (elapsed / duration) * 100);
      progressBar.style.width = percent + '%';
      timerText.innerText = Math.max(0, Math.ceil((duration - elapsed)/1000)) + ' сек';
    }, 100);

    let timeout = setTimeout(() => {
      cleanup();
    }, duration);

    function cleanup() {
      clearInterval(interval);
      clearTimeout(timeout);
      toast.classList.remove('show');
      toast.style.display = 'none';
      active = null;
    }

    btn.addEventListener('click', () => {
      try { onUndo && onUndo(); } catch (e) { console.error(e); }
      cleanup();
    });

    active = { cancel: cleanup };
    return {
      cancel: cleanup
    };
  }

  window.undoManager = { register };
})();

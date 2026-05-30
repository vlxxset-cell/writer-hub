document.addEventListener('DOMContentLoaded', () => {
  const coinsBalance = document.getElementById('coinsBalance');
  const spinNote = document.getElementById('spinNote');
  const spinButton = document.getElementById('spinButton');
  const spinAgainButton = document.getElementById('spinAgainButton');
  const lastSpinDateEl = document.getElementById('lastSpinDate');
  const spinsTodayEl = document.getElementById('spinsToday');
  const taskRarity = document.getElementById('taskRarity');
  const taskCoins = document.getElementById('taskCoins');
  const taskMessage = document.getElementById('taskMessage');
  const taskActions = document.getElementById('taskActions');
  const riskChoice = document.getElementById('riskChoice');
  const safeMode = document.getElementById('safeMode');
  const riskyMode = document.getElementById('riskyMode');
  const storeGrid = document.getElementById('storeGrid');
  const fortuneWheel = document.getElementById('fortuneWheel');
  const spinHint = document.getElementById('spinHint');

  const categories = [
    {
      id: 'common',
      label: 'Обычное',
      color: 'common',
      chance: 69,
      tasks: [
        { id: '100-words', name: 'Написать 100 слов', coins: 5, desc: 'Небольшой писательский отрезок, чтобы включить процесс.', rarity: 'Обычное' },
        { id: '300-words', name: 'Написать 300 слов', coins: 10, desc: 'Двигайтесь дальше и наберитесь энергии текста.', rarity: 'Обычное' },
        { id: '10-minutes', name: 'Писать 10 минут без остановки', coins: 8, desc: 'Проверьте свою концентрацию и скорость.', rarity: 'Обычное' },
        { id: '20-minutes-no-tabs', name: 'Писать 20 минут без переключения вкладок', coins: 12, desc: 'Фокус с минимальными отвлечениями.', rarity: 'Обычное' },
        { id: 'finish-fragment', name: 'Дописать начатый фрагмент', coins: 15, desc: 'Завершите начатый кусок текста для ощущения прогресса.', rarity: 'Обычное' }
      ]
    },
    {
      id: 'uncommon',
      label: 'Необычное',
      color: 'uncommon',
      chance: 23,
      tasks: [
        { id: 'more-than-last', name: 'Написать больше, чем в последнюю сессию', coins: 18, desc: 'Пробейте прошлый результат и добавьте энергию.', rarity: 'Необычное' },
        { id: 'keep-streak', name: 'Сохранить серию ещё на один день', coins: 20, desc: 'Продлите свою писательскую привычку ещё на один день.', rarity: 'Необычное' },
        { id: 'finish-scene', name: 'Завершить одну сцену', coins: 25, desc: 'Постройте содержание и завершите целый кусок сюжета.', rarity: 'Необычное' },
        { id: 'beat-yesterday', name: 'Побить вчерашний результат', coins: 30, desc: 'Перепишите собственный вчерашний рекорд.', rarity: 'Необычное' }
      ]
    },
    {
      id: 'rare',
      label: 'Редкое',
      color: 'rare',
      chance: 7,
      tasks: [
        { id: 'beat-week', name: 'Побить лучший результат недели', coins: 40, desc: 'Установите новый недельный рекорд по письму.', rarity: 'Редкое' },
        { id: 'new-time-record', name: 'Установить новый рекорд по времени сессии', coins: 50, desc: 'Превзойдите свой самый длинный сеанс письма.', rarity: 'Редкое' },
        { id: 'new-word-record', name: 'Установить новый рекорд по словам', coins: 60, desc: 'Прокачайте свой максимум по словам в одной сессии.', rarity: 'Редкое' }
      ]
    },
    {
      id: 'legendary',
      label: 'Легендарное',
      color: 'legendary',
      chance: 1,
      tasks: [
        { id: 'finish-chapter', name: 'Завершить одну главу', coins: 75, desc: 'Большое достижение — закончите целую главу.', rarity: 'Легендарное' },
        { id: 'extra-spin', name: 'Получить ещё одно вращение колеса', coins: 0, desc: 'Дополнительная возможность крутить колесо сегодня.', rarity: 'Легендарное' }
      ]
    }
  ];

  const storeItems = [
    { id: 'candy', icon: '🍫', title: 'Конфета', cost: 20, desc: 'Маленькая сладкая мотивация.' },
    { id: 'coffee', icon: '☕', title: 'Любимый кофе', cost: 50, desc: 'Бодрит пишущего автора.' },
    { id: 'dessert', icon: '🍰', title: 'Десерт', cost: 80, desc: 'Награда за упорный текстовый марафон.' },
    { id: 'book', icon: '📖', title: 'Новая книга', cost: 250, desc: 'Большой подарок для творческой души.' },
    { id: 'game', icon: '🎮', title: 'Игра или крупная покупка', cost: 500, desc: 'Реальная награда за серьёзный прогресс.' },
    { id: 'trinket', icon: '⚔️', title: 'Ещё одна фишка', cost: 350, desc: 'Особый бонус для авторского настроения.' }
  ];

  const state = {
    coins: Number(localStorage.getItem('fortuneCoins')) || 0,
    lastSpin: localStorage.getItem('fortuneLastSpin') || null,
    extraSpin: JSON.parse(localStorage.getItem('fortuneExtraSpin') || 'false'),
    currentTask: JSON.parse(localStorage.getItem('fortuneCurrentTask') || 'null'),
    purchases: JSON.parse(localStorage.getItem('fortunePurchases') || '[]'),
    spinInProgress: false
  };

  function formatDate(dateValue) {
    if (!dateValue) return '—';
    const date = new Date(dateValue);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function isSameDay(dateA, dateB) {
    if (!dateA || !dateB) return false;
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  function saveState() {
    localStorage.setItem('fortuneCoins', String(state.coins));
    localStorage.setItem('fortuneLastSpin', state.lastSpin || '');
    localStorage.setItem('fortuneExtraSpin', JSON.stringify(state.extraSpin));
    localStorage.setItem('fortuneCurrentTask', JSON.stringify(state.currentTask));
    localStorage.setItem('fortunePurchases', JSON.stringify(state.purchases));
  }

  function chooseOutcome() {
    let roll = Math.random() * 100;
    for (const category of categories) {
      if (roll < category.chance) {
        const task = category.tasks[Math.floor(Math.random() * category.tasks.length)];
        return { ...task, category: category.id };
      }
      roll -= category.chance;
    }
    const fallbackCategory = categories[categories.length - 1];
    return { ...fallbackCategory.tasks[0], category: fallbackCategory.id };
  }

  function updateSpinNote() {
    const today = getTodayKey();
    const spunToday = isSameDay(state.lastSpin, today);
    const extraAvailable = state.extraSpin && !spunToday;
    const extraAfterSpin = state.extraSpin && spunToday;
    if (!state.lastSpin || !spunToday) {
      spinNote.textContent = 'Вращение доступно. Тратиться только 1 раз в день.';
      spinButton.disabled = false;
      spinAgainButton.style.display = 'none';
    } else if (extraAvailable || extraAfterSpin) {
      spinNote.textContent = 'Дополнительное вращение доступно после получения бонуса.';
      spinButton.disabled = true;
      spinAgainButton.style.display = 'inline-flex';
    } else {
      spinNote.textContent = 'Вращение уже выполнено сегодня. Возвращайтесь завтра.';
      spinButton.disabled = true;
      spinAgainButton.style.display = 'none';
    }
    if (state.spinInProgress) {
      spinNote.textContent = 'Колесо вращается... Ждите результата.';
      spinButton.disabled = true;
      spinAgainButton.disabled = true;
    }

    lastSpinDateEl.textContent = formatDate(state.lastSpin);
    spinsTodayEl.textContent = (spunToday ? (state.extraSpin && !extraAfterSpin ? '1 + доп.' : '1') : '0');
  }

  function getRarityClass(rarity) {
    if (!rarity) return ''; return rarity.toLowerCase();
  }

  function renderTask() {
    if (!state.currentTask) {
      taskRarity.textContent = 'Поверните колесо, чтобы получить первое задание.';
      taskCoins.textContent = '—';
      taskMessage.textContent = 'Здесь появится выбранное задание. Его можно будет выполнить и получить монеты прямо на странице.';
      taskActions.innerHTML = '';
      riskChoice.hidden = true;
      return;
    }

    taskRarity.textContent = `${state.currentTask.rarity} задание`;
    taskRarity.className = `subtitle ${getRarityClass(state.currentTask.category)}`;
    taskCoins.textContent = state.currentTask.coins > 0 ? `+${state.currentTask.coins} 🪙` : '🎁 Доп. вращение';
    taskMessage.textContent = state.currentTask.desc || 'Выполните задание и нажмите кнопку ниже.';
    taskActions.innerHTML = '';

    if (state.currentTask.completed) {
      taskActions.innerHTML = '<div class="task-completed">Задание выполнено.</div>';
      riskChoice.hidden = true;
      return;
    }

    const completeButton = document.createElement('button');
    completeButton.className = 'open-btn';
    completeButton.type = 'button';
    completeButton.textContent = state.currentTask.id === 'extra-spin' ? 'Активировать доп. вращение' : 'Отметить как выполнено';
    completeButton.addEventListener('click', () => completeTask());
    taskActions.appendChild(completeButton);

    if (['uncommon', 'rare', 'legendary'].includes(state.currentTask.category) && state.currentTask.id !== 'extra-spin') {
      riskChoice.hidden = false;
      state.currentTask.mode = state.currentTask.mode || 'safe';
      safeMode.classList.toggle('active', state.currentTask.mode === 'safe');
      riskyMode.classList.toggle('active', state.currentTask.mode === 'risky');
    } else {
      riskChoice.hidden = true;
    }
  }

  function renderStore() {
    storeGrid.innerHTML = storeItems.map((item) => {
      const purchased = state.purchases.includes(item.id);
      const affordable = state.coins >= item.cost;
      return `
        <article class="store-card ${purchased ? 'purchased' : ''}">
          <div class="store-icon">${item.icon}</div>
          <div class="store-info">
            <strong>${item.title}</strong>
            <p>${item.desc}</p>
          </div>
          <div class="store-action">
            <span class="store-cost">${item.cost} 🪙</span>
            <button data-id="${item.id}" ${purchased ? 'disabled' : affordable ? '' : 'disabled'} class="${purchased ? 'edit-btn' : 'open-btn'}">${purchased ? 'Куплено' : affordable ? 'Купить' : 'Недостаточно'}</button>
          </div>
        </article>
      `;
    }).join('');

    storeGrid.querySelectorAll('button[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.id;
        purchaseItem(itemId);
      });
    });
  }

  function updateUI() {
    coinsBalance.textContent = `${state.coins} 🪙`;
    updateSpinNote();
    renderTask();
    renderStore();
    spinButton.disabled = state.spinInProgress || (!canSpin() && !state.extraSpin);
    spinAgainButton.disabled = state.spinInProgress;
  }

  function canSpin() {
    const today = getTodayKey();
    return !state.lastSpin || !isSameDay(state.lastSpin, today) || state.extraSpin;
  }

  function recordSpin() {
    const today = getTodayKey();
    if (!state.lastSpin || !isSameDay(state.lastSpin, today)) {
      state.lastSpin = new Date().toISOString();
    } else if (state.extraSpin) {
      state.extraSpin = false;
    }
    saveState();
  }

  function setOutcome(outcome) {
    state.currentTask = {
      ...outcome,
      completed: false,
      mode: 'safe',
      assignedAt: new Date().toISOString()
    };
    if (outcome.id === 'extra-spin') {
      state.currentTask.desc = 'У вас есть шанс получить доп. вращение. Нажмите, чтобы активировать его.';
    }
    saveState();
    renderTask();
  }

  function spinWheel() {
    if (state.spinInProgress || !canSpin()) return;
    state.spinInProgress = true;
    updateUI();
    const outcome = chooseOutcome();
    const rotation = 360 * 6 + Math.random() * 360;
    fortuneWheel.style.transition = 'transform 3.5s cubic-bezier(0.33, 1, 0.68, 1)';
    fortuneWheel.style.transform = `rotate(${rotation}deg)`;
    setTimeout(() => {
      state.spinInProgress = false;
      recordSpin();
      setOutcome(outcome);
      fortuneWheel.style.transition = 'none';
      fortuneWheel.style.transform = `rotate(${rotation % 360}deg)`;
      updateUI();
    }, 3600);
  }

  function completeTask() {
    if (!state.currentTask || state.currentTask.completed) return;
    let reward = state.currentTask.coins || 0;
    let message = 'Задание отмечено как выполненное.';
    if (state.currentTask.id === 'extra-spin') {
      state.extraSpin = true;
      message = 'Дополнительное вращение активировано. Теперь можно крутить колесо ещё раз сегодня.';
    }
    if (reward > 0) {
      reward = state.currentTask.mode === 'risky' ? reward * 2 : reward;
      state.coins += reward;
      message = `Вы заработали ${reward} монет.`;
    }
    state.currentTask.completed = true;
    state.currentTask.completedAt = new Date().toISOString();
    saveState();
    taskMessage.textContent = message;
    renderTask();
    renderStore();
    updateUI();
  }

  function purchaseItem(itemId) {
    if (state.purchases.includes(itemId)) return;
    const item = storeItems.find((entry) => entry.id === itemId);
    if (!item || state.coins < item.cost) return;
    state.coins -= item.cost;
    state.purchases.push(itemId);
    saveState();
    updateUI();
  }

  safeMode.addEventListener('click', () => {
    if (!state.currentTask || state.currentTask.completed) return;
    state.currentTask.mode = 'safe';
    saveState();
    renderTask();
  });

  riskyMode.addEventListener('click', () => {
    if (!state.currentTask || state.currentTask.completed) return;
    state.currentTask.mode = 'risky';
    saveState();
    renderTask();
  });

  spinButton.addEventListener('click', spinWheel);
  spinAgainButton.addEventListener('click', spinWheel);

  updateUI();
});

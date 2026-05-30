function initFortuneWheel() {
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
  const storeCoinsBalance = document.getElementById('storeCoinsBalance');
  const fortuneWheel = document.getElementById('fortuneWheel');
  let wheelResult = document.getElementById('wheelResult');
  const spinHint = document.getElementById('spinHint');
  const fortuneAdminPanel = document.getElementById('fortuneAdminPanel');
  const resetFortuneButton = document.getElementById('resetFortuneButton');
  const simulateTenButton = document.getElementById('simulateTenButton');
  const dailySpinLimit = 10;

  function autoResetAllFortune() {
    const users = getAllFortuneUsers();
    const currentUser = localStorage.getItem('writer_user');
    const todayKey = getTodayKey();

    users.forEach((user) => {
      setCurrentUser(user);
      localStorage.setItem('fortuneCoins', '0');
      localStorage.setItem('fortuneLastSpin', '');
      localStorage.setItem('fortuneExtraSpin', 'false');
      localStorage.setItem('fortuneCurrentTask', 'null');
      localStorage.setItem('fortunePurchases', JSON.stringify({}));
      localStorage.setItem('fortuneHistory', JSON.stringify([]));
      localStorage.setItem('fortuneSpinDay', todayKey);
      localStorage.setItem('fortuneSpinsToday', '0');
    });

    if (currentUser) {
      setCurrentUser(currentUser);
    } else {
      logoutCurrentUser();
    }
  }

  const categories = [
    {
      id: 'common',
      label: 'Обычное',
      color: 'common',
      chance: 45,
      tasks: [
        { id: '150-words', name: 'Написать 150 слов', coins: 12, desc: 'Небольшой писательский рывок, чтобы включиться.', rarity: 'Обычное' },
        { id: '400-words', name: 'Написать 400 слов', coins: 25, desc: 'Поймайте поток и пропишите важный отрывок.', rarity: 'Обычное' },
        { id: '15-minutes', name: 'Писать 15 минут без остановки', coins: 20, desc: 'Проверьте свою концентрацию и скорость.', rarity: 'Обычное' },
        { id: '25-minutes-no-tabs', name: 'Писать 25 минут без переключения вкладок', coins: 30, desc: 'Фокус с минимальными отвлечениями.', rarity: 'Обычное' },
        { id: 'finish-fragment', name: 'Дописать начатый фрагмент (без редактирования)', coins: 40, desc: 'Завершите начатый кусок текста без правок.', rarity: 'Обычное' }
      ]
    },
    {
      id: 'uncommon',
      label: 'Необычное',
      color: 'uncommon',
      chance: 30,
      tasks: [
        { id: '20-percent-more', name: 'Написать на 20% больше, чем в последнюю сессию', coins: 50, desc: 'Побейте свой предыдущий результат на 20%.', rarity: 'Необычное' },
        { id: 'keep-streak-and-goal', name: 'Сохранить серию + выполнить цель дня', coins: 60, desc: 'Продлите серию и закройте дневную цель.', rarity: 'Необычное' },
        { id: 'finish-scene-one-go', name: 'Завершить сцену за один заход', coins: 75, desc: 'Создайте завершённую сцену без остановок.', rarity: 'Необычное' }
      ]
    },
    {
      id: 'rare',
      label: 'Редкое',
      color: 'rare',
      chance: 20,
      tasks: [
        { id: 'beat-yesterday-1-2', name: 'Побить вчерашний результат ×1.2', coins: 90, desc: 'Увеличьте вчерашний результат минимум на 20%.', rarity: 'Редкое' },
        { id: 'beat-week', name: 'Побить лучший результат недели', coins: 120, desc: 'Установите новый недельный рекорд по письму.', rarity: 'Редкое' },
        { id: 'new-time-record-plus', name: 'Новый рекорд по времени сессии + минимум сцена', coins: 150, desc: 'Превзойдите рекорд по времени и напишите сцену.', rarity: 'Редкое' },
        { id: 'new-word-record-plus', name: 'Новый рекорд по словам + без пауз', coins: 180, desc: 'Поставьте новый рекорд по словам без пауз.', rarity: 'Редкое' }
      ]
    },
    {
      id: 'legendary',
      label: 'Легендарное',
      color: 'legendary',
      chance: 5,
      tasks: [
        { id: 'finish-chapter-day', name: 'Завершить главу за один день', coins: 220, desc: 'Сделайте большой скачок и завершите главу.', rarity: 'Легендарное' },
        { id: 'extra-spin', name: 'Получить ещё одно вращение колеса (только за ×2 цель)', coins: 0, desc: 'Дополнительная возможность при выполнении рискованной цели.', rarity: 'Легендарное' }
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

  autoResetAllFortune();

  const state = {
    coins: Number(localStorage.getItem('fortuneCoins')) || 0,
    lastSpin: localStorage.getItem('fortuneLastSpin') || null,
    extraSpin: JSON.parse(localStorage.getItem('fortuneExtraSpin') || 'false'),
    currentTask: JSON.parse(localStorage.getItem('fortuneCurrentTask') || 'null'),
    purchases: JSON.parse(localStorage.getItem('fortunePurchases') || '{}'),
    history: JSON.parse(localStorage.getItem('fortuneHistory') || '[]'),
    spinDay: localStorage.getItem('fortuneSpinDay') || null,
    spinsToday: Number(localStorage.getItem('fortuneSpinsToday') || 0),
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
    localStorage.setItem('fortuneHistory', JSON.stringify(state.history));
    localStorage.setItem('fortuneSpinDay', state.spinDay || '');
    localStorage.setItem('fortuneSpinsToday', String(state.spinsToday));
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
    const sameDay = isSameDay(state.spinDay, today);
    if (!sameDay) {
      state.spinDay = today;
      state.spinsToday = 0;
      saveState();
    }

    const remaining = Math.max(0, dailySpinLimit - state.spinsToday);
    const hasBonus = state.extraSpin;
    if (state.spinInProgress) {
      spinNote.textContent = 'Колесо вращается... Ждите результата.';
      spinButton.disabled = true;
      spinAgainButton.disabled = true;
      spinAgainButton.style.display = 'none';
    } else if (remaining > 0) {
      spinNote.textContent = `Доступно ${remaining} из ${dailySpinLimit} круток сегодня.`;
      spinButton.disabled = false;
      spinAgainButton.style.display = 'none';
    } else if (hasBonus) {
      spinNote.textContent = `Все ${dailySpinLimit} круток выполнены, но есть бонусное вращение.`;
      spinButton.disabled = true;
      spinAgainButton.style.display = 'inline-flex';
    } else {
      spinNote.textContent = `Все ${dailySpinLimit} круток сегодня использованы.`;
      spinButton.disabled = true;
      spinAgainButton.style.display = 'none';
    }

    lastSpinDateEl.textContent = formatDate(state.lastSpin);
    spinsTodayEl.textContent = `${state.spinsToday}/${dailySpinLimit}${hasBonus ? ' + бонус' : ''}`;
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
    taskMessage.innerHTML = `<strong>${state.currentTask.name}</strong>${state.currentTask.desc ? `<div class="task-desc">${state.currentTask.desc}</div>` : ''}${state.currentTask.mode === 'risky' ? '<div class="task-desc">Риск выбран: ×2</div>' : ''}`;
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

    if (state.currentTask.coins > 0 && state.currentTask.id !== 'extra-spin') {
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
      const count = Number(state.purchases[item.id] || 0);
      const affordable = state.coins >= item.cost;
      return `
        <article class="store-card">
          <div class="store-icon">${item.icon}</div>
          <div class="store-info">
            <strong>${item.title}</strong>
            <p>${item.desc}</p>
          </div>
          <div class="store-action">
            <span class="store-cost">${item.cost} 🪙</span>
            <button data-id="${item.id}" ${affordable ? '' : 'disabled'} class="open-btn">Купить${count ? ` (${count})` : ''}</button>
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

  function updateWheelLabel() {
    if (state.currentTask) {
      wheelResult.textContent = state.currentTask.name;
    } else {
      wheelResult.textContent = 'Поверните колесо';
    }
  }

  function updateUI() {
    coinsBalance.textContent = `${state.coins} 🪙`;
    if (storeCoinsBalance) {
      storeCoinsBalance.textContent = `Баланс: ${state.coins} 🪙`;
    }
    updateSpinNote();
    renderTask();
    renderStore();
    updateWheelLabel();
    spinButton.disabled = state.spinInProgress || (!canSpin() && !state.extraSpin);
    spinAgainButton.disabled = state.spinInProgress;
  }

  function getAllFortuneUsers() {
    const users = new Set();
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      if (storedUsers && typeof storedUsers === 'object') {
        Object.keys(storedUsers).forEach((user) => users.add(user));
      }
    } catch (error) {
      // ignore invalid users list
    }

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const match = key.match(/^(.+)::fortune(Coins|LastSpin|ExtraSpin|CurrentTask|Purchases|History|SpinDay|SpinsToday)$/);
      if (match) {
        users.add(match[1]);
      }
    }

    const currentUser = localStorage.getItem('writer_user');
    if (currentUser) users.add(currentUser);
    return Array.from(users);
  }

  function resetFortuneData() {
    const users = getAllFortuneUsers();
    const currentUser = localStorage.getItem('writer_user');
    const todayKey = getTodayKey();

    users.forEach((user) => {
      setCurrentUser(user);
      localStorage.setItem('fortuneCoins', '0');
      localStorage.setItem('fortuneLastSpin', '');
      localStorage.setItem('fortuneExtraSpin', 'false');
      localStorage.setItem('fortuneCurrentTask', 'null');
      localStorage.setItem('fortunePurchases', JSON.stringify({}));
      localStorage.setItem('fortuneHistory', JSON.stringify([]));
      localStorage.setItem('fortuneSpinDay', todayKey);
      localStorage.setItem('fortuneSpinsToday', '0');
    });

    if (currentUser) {
      setCurrentUser(currentUser);
    } else {
      logoutCurrentUser();
    }

    state.coins = 0;
    state.lastSpin = null;
    state.extraSpin = false;
    state.currentTask = null;
    state.purchases = {};
    state.history = [];
    state.spinDay = todayKey;
    state.spinsToday = 0;
    saveState();
    updateUI();
    alert('У всех пользователей теперь 0 монет и 10 доступных круток.');
  }

  function simulateSpins(count) {
    const todayKey = getTodayKey();
    const results = [];
    let lastOutcome = null;
    for (let i = 0; i < count; i += 1) {
      const outcome = chooseOutcome();
      lastOutcome = outcome;
      state.history.push({ when: new Date().toISOString(), result: outcome.name, rarity: outcome.rarity, coins: outcome.coins });
      results.push(outcome.name);
    }
    state.currentTask = {
      ...lastOutcome,
      completed: false,
      mode: 'safe',
      assignedAt: new Date().toISOString()
    };
    state.coins = 0;
    state.lastSpin = null;
    state.extraSpin = false;
    state.spinDay = todayKey;
    state.spinsToday = 0;
    saveState();
    wheelResult.textContent = `Симуляция ${count} круток`;
    taskMessage.textContent = `Симулировано ${count} круток. Последнее задание: ${state.currentTask.name}`;
    updateUI();
    alert(`Симулировано ${count} круток:\n${results.join('\n')}`);
  }

  function canSpin() {
    const today = getTodayKey();
    const sameDay = isSameDay(state.spinDay, today);
    const remaining = sameDay ? Math.max(0, dailySpinLimit - state.spinsToday) : dailySpinLimit;
    return remaining > 0 || state.extraSpin;
  }

  function recordSpin(usedExtra = false) {
    const today = getTodayKey();
    if (!isSameDay(state.spinDay, today)) {
      state.spinDay = today;
      state.spinsToday = 0;
    }
    if (usedExtra) {
      state.extraSpin = false;
    } else {
      state.spinsToday += 1;
    }
    state.lastSpin = new Date().toISOString();
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
    wheelResult.textContent = `${outcome.name}`;
    saveState();
    renderTask();
  }

  function spinWheel() {
    if (state.spinInProgress || !canSpin()) return;
    state.spinInProgress = true;
    updateUI();
    const outcome = chooseOutcome();
    const today = getTodayKey();
    const sameDay = isSameDay(state.spinDay, today);
    const remaining = sameDay ? Math.max(0, dailySpinLimit - state.spinsToday) : dailySpinLimit;
    const useExtra = remaining <= 0 && state.extraSpin;
    const rotation = 360 * 6 + Math.random() * 360;
    fortuneWheel.style.transition = 'transform 3.5s cubic-bezier(0.33, 1, 0.68, 1)';
    fortuneWheel.style.transform = `rotate(${rotation}deg)`;
    setTimeout(() => {
      state.spinInProgress = false;
      recordSpin(useExtra);
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
      const multiplier = state.currentTask.mode === 'risky' ? 2 : 1;
      reward = reward * multiplier;
      state.coins += reward;
      message = `Вы заработали ${reward} монет.${multiplier === 2 ? ' (Рискованный режим)' : ''}`;
    }
    state.currentTask.completed = true;
    state.currentTask.completedAt = new Date().toISOString();
    saveState();
    taskMessage.innerHTML = `<strong>${state.currentTask.name}</strong><div class="task-desc">${message}</div>`;
    renderTask();
    renderStore();
    updateUI();
  }

  function purchaseItem(itemId) {
    const item = storeItems.find((entry) => entry.id === itemId);
    if (!item || state.coins < item.cost) return;
    state.coins -= item.cost;
    state.purchases[itemId] = Number(state.purchases[itemId] || 0) + 1;
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

  spinButton.addEventListener('click', () => spinWheel(false));
  spinAgainButton.addEventListener('click', () => spinWheel(false));

  if (fortuneAdminPanel) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
      fortuneAdminPanel.hidden = false;
      resetFortuneButton.addEventListener('click', resetFortuneData);
      simulateTenButton.addEventListener('click', () => simulateSpins(10));
    }
  }

  updateUI();
}

function safeInit() {
  try {
    initFortuneWheel();
  } catch (error) {
    console.error('Ошибка инициализации колеса фортуны:', error);
    alert('Ошибка загрузки страницы колеса фортуны. Откройте консоль для подробностей.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}

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
  const riskyModeToggle = document.getElementById('riskyModeToggle');
  const storeGrid = document.getElementById('storeGrid');
  const storeCoinsBalance = document.getElementById('storeCoinsBalance');
  const fortuneWheel = document.getElementById('fortuneWheel');
  let wheelResult = document.getElementById('wheelResult');
  const spinHint = document.getElementById('spinHint');
  const fortuneAdminPanel = document.getElementById('fortuneAdminPanel');
  const resetFortuneButton = document.getElementById('resetFortuneButton');
  const simulateTenButton = document.getElementById('simulateTenButton');
  const dailySpinLimit = 2;

  const requiredElements = {
    coinsBalance,
    spinNote,
    spinButton,
    spinAgainButton,
    lastSpinDateEl,
    spinsTodayEl,
    taskRarity,
    taskCoins,
    taskMessage,
    taskActions,
    fortuneWheel,
    wheelResult,
    spinHint
  };

  const missingElements = Object.entries(requiredElements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error('wheel.js: missing required DOM elements:', missingElements.join(', '));
    return;
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

  const riskyTasks = [
    { id: '150-words-risky', name: 'Написать 150 слов', coins: 12, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: '150-words' },
    { id: '400-words-risky', name: 'Написать 400 слов', coins: 25, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: '400-words' },
    { id: '15-minutes-risky', name: 'Писать 15 минут без остановки', coins: 20, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: '15-minutes' },
    { id: '25-minutes-no-tabs-risky', name: 'Писать 25 минут без переключения вкладок', coins: 30, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: '25-minutes-no-tabs' },
    { id: 'finish-fragment-risky', name: 'Дописать начатый фрагмент (без редактирования)', coins: 40, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'finish-fragment' },
    { id: '20-percent-more-risky', name: 'Написать на 20% больше, чем в последнюю сессию', coins: 50, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: '20-percent-more' },
    { id: 'keep-streak-and-goal-risky', name: 'Сохранить серию + выполнить цель дня', coins: 60, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'keep-streak-and-goal' },
    { id: 'finish-scene-one-go-risky', name: 'Завершить сцену за один заход', coins: 75, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'finish-scene-one-go' },
    { id: 'beat-yesterday-1-2-risky', name: 'Побить вчерашний результат ×1.2', coins: 90, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'beat-yesterday-1-2' },
    { id: 'beat-week-risky', name: 'Побить лучший результат недели', coins: 120, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'beat-week' },
    { id: 'new-time-record-plus-risky', name: 'Новый рекорд по времени сессии + минимум сцена', coins: 150, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'new-time-record-plus' },
    { id: 'new-word-record-plus-risky', name: 'Новый рекорд по словам + без пауз', coins: 180, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'new-word-record-plus' },
    { id: 'finish-chapter-day-risky', name: 'Завершить главу за один день', coins: 220, desc: 'Рискованная версия: награда будет удвоена если вы выполните задание идеально.', rarity: 'Рискованное', baseId: 'finish-chapter-day' },
    { id: 'extra-spin-risky', name: 'Получить ещё одно вращение колеса (только за ×2 цель)', coins: 0, desc: 'Дополнительная возможность при выполнении рискованной цели.', rarity: 'Рискованное', baseId: 'extra-spin' }
  ];

  const storeItems = [
    // Маленькие награды 5–30
    { id: 'eat-candy', icon: '🍬', title: 'Съесть конфету', cost: 20, desc: 'Небольшая сладкая награда за прогресс.' },
    { id: 'chewing-gum', icon: '🍭', title: 'Жвачка / сладость', cost: 10, desc: 'Быстрая маленькая радость.' },
    { id: 'fav-drink-home', icon: '🥤', title: 'Пить любимый напиток', cost: 15, desc: 'Маленький перерыв с любимым напитком.' },
    { id: 'buy-bar', icon: '🍫', title: 'Купить батончик', cost: 25, desc: 'Небольшой снэк в магазине.' },
    { id: 'make-tea-coffee', icon: '☕', title: 'Сделать чай/кофе дома', cost: 10, desc: 'Приятный горячий напиток своими руками.' },
    { id: 'eat-sweet', icon: '🍰', title: 'Съесть что-то сладкое', cost: 25, desc: 'Большая сладкая награда.' },
    { id: 'chew-snacks', icon: '🍿', title: 'Пожевать снеки', cost: 20, desc: 'Лёгкий перекус во время работы.' },
    { id: 'salty-snack', icon: '🥨', title: 'Перекусить чем-то солёным', cost: 20, desc: 'Солёный маленький бонус.' },
    { id: 'drink-juice', icon: '🧃', title: 'Выпить сок', cost: 15, desc: 'Освежающий сок как награда.' },

    // Обычные награды 30–80
    { id: 'store-coffee', icon: '☕', title: 'Кофе/энергетик в магазине', cost: 50, desc: 'Кофе для энергии вне дома.' },
    { id: 'eat-dessert', icon: '🍮', title: 'Съесть десерт', cost: 80, desc: 'Серьёзная сладкая награда.' },
    { id: 'go-buy-tasty', icon: '🛍️', title: 'Выйти в магазин за вкусным', cost: 60, desc: 'Короткая вылазка за лакомством.' },
    { id: 'walk-15-30', icon: '🚶', title: 'Прогулка 15–30 минут', cost: 60, desc: 'Свежий воздух и заряд энергии.' },
    { id: 'read-time', icon: '📚', title: 'Почитать', cost: 70, desc: 'Тихое чтение как награда.' },
    { id: 'small-shop-buy', icon: '🛒', title: 'Купить что-то маленькое', cost: 80, desc: 'Маленькая покупка в магазине.' },

    // Средние награды 90–200
    { id: 'order-delivery', icon: '🍱', title: 'Заказать доставку еды', cost: 200, desc: 'Большая еда через доставку.' },
    { id: 'visit-cafe', icon: '☕', title: 'Сходить в кафе', cost: 150, desc: 'Маленький выход в кафе.' },
    { id: 'buy-dessert-cafe', icon: '🧁', title: 'Купить десерт в кафе', cost: 130, desc: 'Десерт в уютном месте.' },
    { id: 'movie-night', icon: '🎬', title: 'Кино вечер', cost: 120, desc: 'Кино дома или в кинотеатре.' },
    { id: 'mall-trip', icon: '🏬', title: 'Сходить в торговый центр', cost: 140, desc: 'Гулять и выбирать мелочи.' },
    { id: 'buy-book', icon: '📖', title: 'Купить книгу', cost: 200, desc: 'Новая книга для вдохновения.' },
    { id: 'order-drink-food', icon: '🍔', title: 'Заказать напиток + еду', cost: 180, desc: 'Комбо на выходной.' },
    { id: 'play-game', icon: '🎮', title: 'Поиграть', cost: 140, desc: 'Игровой вечер как награда.' },
    { id: 'visit-new-spot', icon: '📍', title: 'Сходить в новую точку', cost: 150, desc: 'Исследовать новое кафе или точку.' },

    // Крупные награды 200–500
    { id: 'hobby-purchase', icon: '🛍️', title: 'Крупная покупка для хобби', cost: 300, desc: 'Серьёзная покупка для хобби.' },
    { id: 'long-wanted-gift', icon: '🎁', title: 'Подарок себе “давно хотел(а)”', cost: 350, desc: 'Особенный подарок.' },
    { id: 'cafe-movie-walk', icon: '☕🎬🚶', title: 'Кафе + кино + прогулка', cost: 250, desc: 'Большой развлекательный день.' },
    { id: 'go-to-cinema', icon: '🍿', title: 'Сходить в кино', cost: 220, desc: 'Поход в кинотеатр.' },

    // Редкие крупные 500+
    { id: 'big-gift', icon: '🎉', title: 'Большой подарок себе', cost: 550, desc: 'Праздничный масштаб для себя.' },
    { id: 'creative-large-purchase', icon: '🖌️', title: 'Крупная покупка для творчества', cost: 650, desc: 'Инструменты и материалы для творчества.' },
    { id: 'dream-big-purchase', icon: '🏆', title: 'Большая покупка мечты', cost: 1000, desc: 'Крупная цель-накопление.' },

    // Добавки
    { id: 'notebook', icon: '📓', title: 'Купить новый блокнот', cost: 60, desc: 'Новый блокнот для заметок и идей.' },
    { id: 'pen', icon: '🖊️', title: 'Купить ручку/маркер', cost: 40, desc: 'Инструменты для ведения записей.' },
    { id: 'stickers', icon: '🏷️', title: 'Купить стикеры', cost: 50, desc: 'Весёлые стикеры для мотивации.' },
    { id: 'try-new-drink', icon: '🧋', title: 'Попробовать новый напиток', cost: 80, desc: 'Новый необычный напиток.' },
    { id: 'mood-sweet', icon: '🍫', title: 'Купить сладость “по настроению”', cost: 25, desc: 'Небольшой подарок себе.' }
  ];

  const state = {
    coins: Number(localStorage.getItem('fortuneCoins')) || 0,
    lastSpin: localStorage.getItem('fortuneLastSpin') || null,
    extraSpin: JSON.parse(localStorage.getItem('fortuneExtraSpin') || 'false'),
    currentTask: JSON.parse(localStorage.getItem('fortuneCurrentTask') || 'null'),
    purchases: JSON.parse(localStorage.getItem('fortunePurchases') || '{}'),
    history: JSON.parse(localStorage.getItem('fortuneHistory') || '[]'),
    spinDay: localStorage.getItem('fortuneSpinDay') || null,
    spinsToday: Number(localStorage.getItem('fortuneSpinsToday') || 0),
    riskyModeActive: JSON.parse(localStorage.getItem('fortuneRiskyMode') || 'false'),
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
    localStorage.setItem('fortuneRiskyMode', JSON.stringify(state.riskyModeActive));
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
      return;
    }

    taskRarity.textContent = `${state.currentTask.rarity} задание`;
    taskRarity.className = `subtitle ${getRarityClass(state.currentTask.category)}`;
    taskCoins.textContent = state.currentTask.coins > 0 ? `+${state.currentTask.coins} 🪙` : '🎁 Доп. вращение';
    taskMessage.innerHTML = `<strong>${state.currentTask.name}</strong>${state.currentTask.desc ? `<div class="task-desc">${state.currentTask.desc}</div>` : ''}${state.currentTask.mode === 'risky' ? '<div class="task-desc">Риск выбран: ×2</div>' : ''}`;
    taskActions.innerHTML = '';

    if (state.currentTask.completed) {
      taskActions.innerHTML = '<div class="task-completed">Задание выполнено.</div>';
      return;
    }

    const completeButton = document.createElement('button');
    completeButton.className = 'open-btn';
    completeButton.type = 'button';
    completeButton.textContent = state.currentTask.id === 'extra-spin' ? 'Активировать доп. вращение' : 'Отметить как выполнено';
    completeButton.addEventListener('click', () => completeTask());
    taskActions.appendChild(completeButton);

    if (state.currentTask.coins > 0 && state.currentTask.id !== 'extra-spin') {
      state.currentTask.mode = state.currentTask.mode || 'safe';
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
    if (riskyModeToggle) riskyModeToggle.classList.toggle('active', state.riskyModeActive);
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

    // Установим у всех пользователей 0 монет и 2 доступные крутки.
    // Для dailySpinLimit=10 это означает, что spinsToday = 8 (использовано), остаётся 2.
    const usedSpins = Math.max(0, dailySpinLimit - 2);
    users.forEach((user) => {
      setCurrentUser(user);
      localStorage.setItem('fortuneCoins', '0');
      localStorage.setItem('fortuneLastSpin', '');
      localStorage.setItem('fortuneExtraSpin', 'false');
      localStorage.setItem('fortuneCurrentTask', 'null');
      localStorage.setItem('fortunePurchases', JSON.stringify({}));
      localStorage.setItem('fortuneHistory', JSON.stringify([]));
      localStorage.setItem('fortuneSpinDay', todayKey);
      localStorage.setItem('fortuneSpinsToday', String(usedSpins));
      localStorage.setItem('fortuneRiskyMode', JSON.stringify(false));
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
    state.spinsToday = Math.max(0, dailySpinLimit - 2);
    state.riskyModeActive = false;
    saveState();
    updateUI();
    alert('У всех пользователей теперь 0 монет и 2 доступных крутки.');
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
      mode: state.riskyModeActive ? 'risky' : 'safe',
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

  // Тумблер для включения глобального рискованного режима перед круткой
  if (riskyModeToggle) {
    riskyModeToggle.classList.toggle('active', state.riskyModeActive);
    riskyModeToggle.addEventListener('click', () => {
      state.riskyModeActive = !state.riskyModeActive;
      riskyModeToggle.classList.toggle('active', state.riskyModeActive);
      saveState();
    });
  }

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
    try {
      const shortStack = (error && error.stack) ? error.stack.split('\n').slice(0,4).join('\n') : String(error);
      alert(`Ошибка загрузки страницы колеса фортуны:\n${error.message || error}\n\nСтек (первые строки):\n${shortStack}`);
    } catch (e) {
      alert('Ошибка загрузки страницы колеса фортуны. Откройте консоль для подробностей.');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}

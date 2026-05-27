const analysisResults = [];
let hasAnalyzed = false;

const storyInput = document.getElementById('storyInput');
const runCheckBtn = document.getElementById('runCheckBtn');
const conflictGrid = document.getElementById('conflictGrid');
const conflictSearch = document.getElementById('conflictSearch');
const filterButtons = document.querySelectorAll('.severity-filters button');
const noResults = document.getElementById('noResults');
const countTotal = document.getElementById('countTotal');
const countCritical = document.getElementById('countCritical');
const countWarning = document.getElementById('countWarning');

const state = {
  query: '',
  severity: 'all'
};

function normalize(text) {
  return text.toLowerCase();
}

function getWordCounts(text) {
  return text
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
}

function collectIssues(text) {
  const lower = normalize(text);
  const issues = [];
  const wordCounts = getWordCounts(text);
  const repeatedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count >= 4 && word.length > 3)
    .map(([word]) => word);

  if (repeatedWords.length) {
    issues.push({
      id: 'repeat',
      title: 'Повторение ключевых слов',
      category: 'Стиль',
      severity: 'note',
      description: `Слова ${repeatedWords.slice(0, 3).map((w) => `«${w}»`).join(', ')} часто повторяются.`,
      details: 'Попробуйте разнообразить лексику, чтобы текст не выглядел слишком монотонным.'
    });
  }

  const weakWritingWords = ['очень', 'слишком', 'чрезвычайно', 'немного', 'как будто', 'словно', 'кажется', 'весьма'];
  const weakWritingFound = weakWritingWords.filter((word) => lower.includes(word));
  if (weakWritingFound.length >= 3) {
    issues.push({
      id: 'weak-writing',
      title: 'Слабое литературное выражение',
      category: 'Качество',
      severity: 'note',
      description: `Текст содержит часто встречающиеся слабые слова: ${[...new Set(weakWritingFound)].join(', ')}.`,
      details: 'Избегайте избыточных наречий и клишированных конструкций, чтобы повысить выразительность.'
    });
  }

  if (/разрушено|разрушен|разрушена/.test(lower) && /спокойн|тихо|безопасн/.test(lower)) {
    issues.push({
      id: 'contradiction-1',
      title: 'Потенциальная логическая несостыковка',
      category: 'Факты',
      severity: 'warning',
      description: 'Текст содержит описание разрушения и спокойствия одновременно.',
      details: 'Уточните, происходит ли действие в разных местах, либо добавьте пояснение о времени или настроении.'
    });
  }

  if (/(сразу же|моментально|немедленно|через мгновение)/.test(lower) && /(на следующий день|после этого|спустя|затем)/.test(lower)) {
    issues.push({
      id: 'time-1',
      title: 'Неоднозначный переход во времени',
      category: 'Сюжет',
      severity: 'warning',
      description: 'В отрывке встречаются противоречивые временные маркеры.',
      details: 'Проверьте последовательность событий и замедлите слишком резкие переходы в тексте.'
    });
  }

  if (/(он|она|герой|героиня|персонаж).{0,120}(теперь|сейчас|впоследствии|но теперь)/.test(lower) && /(раньше|до этого|сначала|сначала он|он сначала)/.test(lower)) {
    issues.push({
      id: 'motivation-1',
      title: 'Изменение мотивации без объяснения',
      category: 'Персонажи',
      severity: 'critical',
      description: 'Судя по тексту, персонаж резко меняет цели или ощущения без мотивации.',
      details: 'Добавьте эмоциональный или сюжетный мост, чтобы изменение выглядело логичным.'
    });
  }

  if (/(получил|нашёл|найден|потерял).{0,120}(ключ|документ|предмет)/.test(lower) && /без объяснения|внезапно|как-то/.test(lower)) {
    issues.push({
      id: 'object-1',
      title: 'Неясное появление или исчезновение предмета',
      category: 'Сюжет',
      severity: 'note',
      description: 'Предметы или артефакты появляются или исчезают без мотивации.',
      details: 'Подумайте, как можно логично связать появление вещи с предыдущими событиями.'
    });
  }

  if (/(он|она|они) (думал|думала|думали|чувствовал|чувствовала|чувствовали|осознавал|осознавала|понимал|понимала)/.test(lower)) {
    issues.push({
      id: 'psychology-1',
      title: 'Психологические формулировки',
      category: 'Психология',
      severity: 'warning',
      description: 'Текст часто показывает внутренние переживания персонажей без точного мотивационного основания.',
      details: 'Добавьте конкретизацию эмоций, мотивов и реакций, чтобы психологический слой выглядел более правдоподобным.'
    });
  }

  if (/обычно|как правило/.test(lower) && /вдруг|внезапно|невозмутимо|неожиданно/.test(lower) && /(но|однако|тем не менее)/.test(lower)) {
    issues.push({
      id: 'behavior-1',
      title: 'Несостыковка в поведении героя',
      category: 'Поведение',
      severity: 'warning',
      description: 'Персонаж ведёт себя резко иначе, чем обычно, без объяснения причины.',
      details: 'Укажите, почему герой изменил своё поведение: внутренний конфликт, внешнее давление или изменение обстоятельств.'
    });
  }

  if (/(не мог|не могла|не могли|нельзя было|не удалось).{0,120}(с лёгкостью|без труда|легко|мгновенно|в один миг)/.test(lower)) {
    issues.push({
      id: 'behavior-2',
      title: 'Противоречивая динамика способностей',
      category: 'Поведение',
      severity: 'warning',
      description: 'Герой сначала не способен что-то сделать, а потом делает это легко без объяснения роста навыков.',
      details: 'Поясните, как изменились способности героя или почему ситуация стала проще.'
    });
  }

  if (/(он|она|они) .* (решил|решила|решили|поклялся|пообещал|намеревался)/.test(lower) && /(через минуту|уже через|после секунды|в тот же миг)/.test(lower)) {
    issues.push({
      id: 'behavior-3',
      title: 'Быстрый отказ от решения',
      category: 'Поведение',
      severity: 'note',
      description: 'Решение героя отменяется слишком быстро, без проработки внутренней мотивации.',
      details: 'Раскройте внутренний конфликт или обстоятельства, из-за которых герой меняет решение.'
    });
  }

  if (/(магия|эльф|дракон|рыцарь|колдун|чародей|тёмный мир|фэнтези)/.test(lower) && /(кибер|робот|компьютер|лазер|планета|космос|вселенная|звёздный)/.test(lower)) {
    issues.push({
      id: 'lore-1',
      title: 'Смешение лорных элементов',
      category: 'Лор',
      severity: 'warning',
      description: 'В тексте сочетаются фантастические и технологические мотивы, что может нарушать внутренний мир.',
      details: 'Проверьте, что правила мира согласованы: фантазийные и научные элементы должны сочетаться органично.'
    });
  }

  if (/(империя|королевство|клан|гильдия|секта|круг)/.test(lower) && /(без боя|без сопротивления|с лёгкостью|всего за|за одну ночь)/.test(lower) && /(захватила|освободила|победила|уничтожила)/.test(lower)) {
    issues.push({
      id: 'lore-3',
      title: 'Нереалистичное развитие лора',
      category: 'Лор',
      severity: 'warning',
      description: 'Сложный мир решается слишком легко или быстро, что подрывает его правила.',
      details: 'Добавьте объяснение баланса сил, ресурсов или магических/технологических ограничений.'
    });
  }

  if (/по преданию|по легенде|легенда гласит|как гласит легенда/.test(lower) && /никто не знает|неизвестно|тайна/.test(lower)) {
    issues.push({
      id: 'lore-2',
      title: 'Неясный лор',
      category: 'Лор',
      severity: 'note',
      description: 'Лор представляется слишком абстрактным или незавершённым.',
      details: 'Уточните правила мира и историю, чтобы читателю было проще понять контекст.'
    });
  }

  if (/планеты|вселенной|машины времени|киберпанк|софин/.test(lower) && /жизнь|сущность|город/.test(lower)) {
    issues.push({
      id: 'genre-1',
      title: 'Возможный факточекинг жанра',
      category: 'Атмосфера',
      severity: 'note',
      description: 'Текст смешивает элементы, которые требуют дополнительной логики мира.',
      details: 'Подумайте, как связать фантастические детали с реальными ограничениями внутри истории.'
    });
  }

  if (issues.length === 0) {
    issues.push({
      id: 'clean',
      title: 'Фактчекинг завершён',
      category: 'Результат',
      severity: 'note',
      description: 'Явных логических несостыковок не обнаружено.',
      details: 'Тем не менее, перечитайте текст с точки зрения мотивации персонажей и последовательности событий.'
    });
  }

  return issues;
}

function filterConflicts() {
  return analysisResults.filter((item) => {
    const query = normalize(state.query);
    const matchesQuery = query === '' || [item.title, item.category, item.description, item.details]
      .some((value) => normalize(value).includes(query));

    const matchesSeverity = state.severity === 'all' || item.severity === state.severity;
    return matchesQuery && matchesSeverity;
  });
}

function updateSummary(filtered) {
  countTotal.textContent = filtered.length;
  countCritical.textContent = filtered.filter((item) => item.severity === 'critical').length;
  countWarning.textContent = filtered.filter((item) => item.severity === 'warning').length;
}

function createConflictCard(item) {
  const card = document.createElement('div');
  card.className = 'conflict-card';
  card.tabIndex = 0;
  card.innerHTML = `
    <div class="category">
      <span class="severity-pill severity-${item.severity}">${item.severity === 'critical' ? 'Критично' : item.severity === 'warning' ? 'Предупреждение' : 'Совет'}</span>
      <span>${item.category}</span>
    </div>
    <h3>${item.title}</h3>
    <p class="conflict-description">${item.description}</p>
    <div class="conflict-details">${item.details}</div>
  `;

  function toggleOpen() {
    card.classList.toggle('open');
  }

  card.addEventListener('click', toggleOpen);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOpen();
    }
  });

  return card;
}

function renderConflicts() {
  const filtered = filterConflicts();
  conflictGrid.innerHTML = '';

  if (!hasAnalyzed) {
    noResults.textContent = 'Введите текст и нажмите «Проверка», чтобы получить результаты.';
    noResults.style.display = 'block';
    updateSummary([]);
    return;
  }

  if (filtered.length === 0) {
    noResults.textContent = 'Конфликты не найдены — текст выглядит логично.';
    noResults.style.display = 'block';
  } else {
    noResults.style.display = 'none';
    filtered.forEach((item) => conflictGrid.appendChild(createConflictCard(item)));
  }

  updateSummary(filtered);
}

function setActiveFilter(button) {
  filterButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
}

function runAnalysis() {
  const text = storyInput.value.trim();
  if (!text) return;

  const results = collectIssues(text);
  analysisResults.length = 0;
  analysisResults.push(...results.map((item, index) => ({ ...item, id: `${item.id}-${index}` })));
  hasAnalyzed = true;
  state.query = '';
  conflictSearch.value = '';
  state.severity = 'all';
  filterButtons.forEach((btn) => btn.classList.remove('active'));
  if (filterButtons[0]) {
    filterButtons[0].classList.add('active');
  }
  renderConflicts();
}

storyInput.addEventListener('input', () => {
  runCheckBtn.disabled = storyInput.value.trim().length === 0;
});

conflictSearch.addEventListener('input', () => {
  state.query = conflictSearch.value.trim();
  renderConflicts();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.severity = button.dataset.severity || 'all';
    setActiveFilter(button);
    renderConflicts();
  });
});

runCheckBtn.addEventListener('click', runAnalysis);

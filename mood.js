const sceneInput = document.getElementById('sceneInput');
const analyzeBtn = document.getElementById('analyzeMoodBtn');
const moodAdvice = document.getElementById('moodAdvice');

const lexicon = {
  joy: ['рад', 'радость', 'счаст', 'улыб', 'восхищен', 'смеялся', 'смеялась', 'светл', 'весел'],
  sadness: ['грусть', 'плачет', 'плакал', 'печаль', 'тоска', 'одинок', 'потерял', 'скорб'],
  anger: ['зл', 'гнев', 'ревн', 'бросил', 'ударил', 'крич', 'ярость', 'ненавист'],
  fear: ['страх', 'боится', 'паник', 'дрож', 'опасн', 'тревог', 'ужас'],
  surprise: ['удив', 'внезап', 'ошелом', 'шок', 'неожидан']
};

let chart = null;

function analyzeText(text) {
  const lower = text.toLowerCase();
  const counts = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 };
  let totalHits = 0;

  // count lexicon hits with simple weighting
  for (const [emotion, words] of Object.entries(lexicon)) {
    for (const w of words) {
      const re = new RegExp(w, 'g');
      const m = lower.match(re);
      if (m) {
        counts[emotion] += m.length;
        totalHits += m.length;
      }
    }
  }

  // sentence-level heuristics: look for intensifiers or negations
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  sentences.forEach(s => {
    const neg = /не\s+\w+/.test(s);
    const intens = /(очень|совсем|крайне|сильно|безумно|ужасно)/.test(s);
    // if sentence contains emotion word and intensifier — boost
    for (const [emotion, words] of Object.entries(lexicon)) {
      for (const w of words) {
        if (new RegExp(w).test(s)) {
          if (intens) counts[emotion] += 1;
          if (neg) counts[emotion] = Math.max(0, counts[emotion]-1);
        }
      }
    }
  });

  // normalize small texts
  const norm = Object.fromEntries(Object.entries(counts).map(([k,v]) => [k, v]));
  return { counts: norm, totalHits };
}

function renderChart(result) {
  const ctx = document.getElementById('moodChart').getContext('2d');
  const counts = result.counts;
  const data = [counts.joy, counts.sadness, counts.anger, counts.fear, counts.surprise];

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Радость', 'Грусть', 'Злость', 'Страх', 'Удивление'],
      datasets: [{
        label: 'Эмоции',
        data,
        backgroundColor: ['#60a5fa', '#64748b', '#ef4444', '#f59e0b', '#f472b6']
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

sceneInput.addEventListener('input', () => {
  analyzeBtn.disabled = sceneInput.value.trim().length === 0;
});

analyzeBtn.addEventListener('click', () => {
  const text = sceneInput.value.trim();
  if (!text) return;
  const result = analyzeText(text);
  renderChart(result);

  // compute dominant emotion and basic advice
  const sorted = Object.entries(result.counts).sort((a,b)=>b[1]-a[1]);
  const top = sorted[0];
  let advice = '';
  if (top[1] === 0) {
    advice = 'Явных эмоциональных маркеров мало — добавьте детали и прямую речь.';
  } else {
    const [emo, val] = top;
    const percent = Math.round((val / Math.max(1, result.totalHits)) * 100);
    if (emo === 'joy') advice = `Преобладает радость (${percent}%) — усилите нюансы, чтобы избежать плоской позитивности.`;
    if (emo === 'sadness') advice = `Преобладает грусть (${percent}%) — уточните причины и последствия потери.`;
    if (emo === 'anger') advice = `Преобладает гнев (${percent}%) — проверьте мотивацию и допустимость реакции.`;
    if (emo === 'fear') advice = `Преобладает страх (${percent}%) — добавьте сенсорные детали и последствия.`;
    if (emo === 'surprise') advice = `Преобладает удивление (${percent}%) — проверьте правдоподобность поворота.`;
  }

  moodAdvice.textContent = advice;
});

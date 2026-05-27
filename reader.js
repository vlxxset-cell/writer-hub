document.addEventListener('DOMContentLoaded', () => {
  const reviewTitle = document.getElementById('reviewTitle');
  const reviewAuthor = document.getElementById('reviewAuthor');
  const reviewEmotions = document.getElementById('reviewEmotions');
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  const ratingGroups = Array.from(document.querySelectorAll('.rating-stars'));
  const saveButton = document.getElementById('saveReviewBtn');
  const savedReviews = document.getElementById('savedReviews');
  const undoToast = document.getElementById('undoToast');
  const undoMessage = document.getElementById('undoMessage');
  const undoCancelBtn = document.getElementById('undoCancelBtn');
  const undoProgressBar = document.getElementById('undoProgressBar');

  const reviewStorageKey = 'readerReviews';
  let coverData = null;
  const ratings = {
    emotions: 0,
    plot: 0,
    characters: 0,
    language: 0
  };
  let pendingDelete = null;
  let undoTimeoutId = null;
  let undoIntervalId = null;
  const undoDuration = 5000;

  function loadReviews() {
    return JSON.parse(localStorage.getItem(reviewStorageKey) || '[]');
  }

  function saveReviews(reviews) {
    localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
  }

  function setCategoryRating(category, value) {
    ratings[category] = value;
    const group = document.querySelector(`.rating-stars[data-category="${category}"]`);
    if (!group) return;
    Array.from(group.querySelectorAll('.star-btn')).forEach((btn) => {
      const btnValue = Number(btn.dataset.value);
      btn.classList.toggle('active', btnValue <= value);
    });
    // set group class to reflect numeric rating for coloring
    Array.from(group.classList).forEach((c) => { if (c.startsWith('stars-')) group.classList.remove(c); });
    if (value > 0) group.classList.add(`stars-${value}`);
  }

  function renderSavedReviews() {
    const reviews = loadReviews();
    savedReviews.innerHTML = '';

    if (!reviews.length) {
      savedReviews.innerHTML = '<div class="no-results">Здесь будут отображены сохранённые отзывы.</div>';
      return;
    }

    reviews.slice().reverse().forEach((review) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <div class="note-header">
          <div>
            <strong class="note-title">${escapeHtml(review.title)}</strong>
            <div class="subtitle">${escapeHtml(review.author || 'Автор не указан')}</div>
          </div>
          <button type="button" class="delete-review-btn" data-id="${review.id}">Удалить</button>
        </div>
        ${review.cover ? `<div class="review-card-cover" style="background-image:url('${review.cover}')"></div>` : ''}
        <div class="note-content">${escapeHtml(review.emotionsText || 'Без текста')}</div>
        <div class="review-card-ratings">
          ${renderRatingLine('Эмоции', review.ratings?.emotions)}
          ${renderRatingLine('Сюжет', review.ratings?.plot)}
          ${renderRatingLine('Персонажи', review.ratings?.characters)}
          ${renderRatingLine('Авторский язык', review.ratings?.language)}
        </div>
      `;
      savedReviews.appendChild(card);
    });

    Array.from(savedReviews.querySelectorAll('.delete-review-btn')).forEach((button) => {
      button.addEventListener('click', () => requestDeleteReview(button.dataset.id));
    });
  }

  function renderRatingLine(label, value) {
    const v = Number(value || 0);
    const stars = Array.from({ length: 5 }, (_, index) => index < v ? '<span class="star">★</span>' : '<span class="star">☆</span>').join('');
    return `<div class="review-card-rating-row"><span>${label}</span><strong class="review-stars stars-${v}">${stars}</strong></div>`;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  ratingGroups.forEach((group) => {
    const category = group.dataset.category;
    Array.from(group.querySelectorAll('.star-btn')).forEach((button) => {
      button.addEventListener('click', () => {
        const value = Number(button.dataset.value);
        setCategoryRating(category, value);
      });
    });
  });

  coverInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      coverData = null;
      coverPreview.style.backgroundImage = 'none';
      coverPreview.textContent = 'Здесь будет обложка';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Выберите изображение для обложки');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      coverData = reader.result;
      coverPreview.style.backgroundImage = `url('${coverData}')`;
      coverPreview.textContent = '';
    };
    reader.readAsDataURL(file);
  });

  saveButton.addEventListener('click', () => {
    const title = reviewTitle.value.trim();
    if (!title) {
      return alert('Введите название книги');
    }

    try {
      const reviews = loadReviews();
      reviews.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        author: reviewAuthor.value.trim() || 'Не указан',
        emotionsText: reviewEmotions.value.trim(),
        cover: coverData,
        ratings: { ...ratings },
        createdAt: new Date().toISOString()
      });

      saveReviews(reviews);
      reviewTitle.value = '';
      reviewAuthor.value = '';
      reviewEmotions.value = '';
      coverInput.value = '';
      coverData = null;
      coverPreview.style.backgroundImage = 'none';
      coverPreview.textContent = 'Здесь будет обложка';
      Object.keys(ratings).forEach((category) => setCategoryRating(category, 0));
      renderSavedReviews();
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        alert('Хранилище переполнено. Попробуйте удалить некоторые отзывы.');
      } else {
        alert('Ошибка при сохранении отзыва: ' + (err.message || err));
      }
    }
  });

  undoCancelBtn.addEventListener('click', cancelDelete);

  function requestDeleteReview(reviewId) {
    if (pendingDelete) return;
    const reviews = loadReviews();
    const review = reviews.find((item) => item.id === reviewId);
    if (!review) return;
    pendingDelete = review;
    showUndoToast();
  }

  function showUndoToast() {
    if (!pendingDelete) return;
    undoToast.classList.add('show');
    undoMessage.textContent = `Отзыв "${pendingDelete.title}" будет удалён через 5 сек.`;
    let start = Date.now();
    updateProgress(0);
    undoTimeoutId = setTimeout(confirmDelete, undoDuration);
    undoIntervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      updateProgress(elapsed);
      if (elapsed >= undoDuration) {
        clearInterval(undoIntervalId);
      }
    }, 50);
  }

  function updateProgress(elapsed) {
    const progress = Math.min(100, (elapsed / undoDuration) * 100);
    undoProgressBar.style.width = `${100 - progress}%`;
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const reviews = loadReviews().filter((item) => item.id !== pendingDelete.id);
    saveReviews(reviews);
    pendingDelete = null;
    hideUndoToast();
    renderSavedReviews();
  }

  function cancelDelete() {
    pendingDelete = null;
    hideUndoToast();
  }

  function hideUndoToast() {
    undoToast.classList.remove('show');
    undoProgressBar.style.width = '100%';
    clearTimeout(undoTimeoutId);
    clearInterval(undoIntervalId);
    undoTimeoutId = null;
    undoIntervalId = null;
  }

  Object.keys(ratings).forEach((category) => setCategoryRating(category, 0));
  renderSavedReviews();
});

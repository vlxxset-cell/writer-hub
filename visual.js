document.addEventListener('DOMContentLoaded', () => {
  const mediaType = document.getElementById('mediaType');
  const mediaFileInput = document.getElementById('mediaFileInput');
  const mediaFileLabelText = document.getElementById('mediaFileLabelText');
  const mediaTitle = document.getElementById('mediaTitle');
  const addMediaBtn = document.getElementById('addMediaBtn');
  const visualBoard = document.getElementById('visualBoard');

  function loadState() {
    try {
      const stored = localStorage.getItem('visual');
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && Array.isArray(parsed.mediaItems)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Проблема с localStorage visual:', error);
    }
    return { mediaItems: [] };
  }

  const state = loadState();

  function save() {
    localStorage.setItem('visual', JSON.stringify(state));
  }

  function updateFileInput(fileName = '') {
    const type = mediaType.value;
    let label = 'Выберите файл';
    let accept = 'image/*';

    if (type === 'music') {
      label = 'Выберите аудио';
      accept = 'audio/*';
    } else if (type === 'video') {
      label = 'Выберите видео';
      accept = 'video/*';
    }

    mediaFileLabelText.textContent = fileName ? `${fileName}` : label;
    mediaFileInput.accept = accept;
  }

  function addMediaItem() {
    const file = mediaFileInput.files[0];
    const type = mediaType.value;
    const title = mediaTitle.value.trim();

    if (!file) {
      alert('Выберите файл для загрузки.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.mediaItems.unshift({
          id: Date.now(),
          title: title || file.name,
          src: reader.result,
          type
        });
        save();
        mediaTitle.value = '';
        mediaFileInput.value = null;
        updateFileInput();
        renderBoard();
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          alert('Хранилище переполнено. Попробуйте удалить некоторые файлы.');
        } else {
          alert('Ошибка при сохранении медиа: ' + (err.message || err));
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function createMediaElement(item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'visual-card media-card';
    wrapper.innerHTML = `
      <div class="media-header">
        <div>
          <strong>${item.title}</strong>
          <div class="media-type">${item.type === 'photo' ? 'Фото' : item.type === 'music' ? 'Музыка' : 'Видео'}</div>
        </div>
        <button class="delete-btn" data-id="${item.id}">✕</button>
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'media-content';

    if (item.type === 'photo') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.loading = 'lazy';
      content.appendChild(img);
    } else if (item.type === 'music') {
      const audio = document.createElement('audio');
      audio.src = item.src;
      audio.controls = true;
      audio.preload = 'none';
      content.appendChild(audio);
    } else if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.preload = 'none';
      content.appendChild(video);
    }

    wrapper.appendChild(content);
    return wrapper;
  }

  function renderBoard() {
    visualBoard.innerHTML = '';
    if (!state.mediaItems.length) {
      visualBoard.innerHTML = `<div class="visual-empty">Добавьте фото, музыку или видео для создания вдохновляющей доски.</div>`;
      return;
    }

    state.mediaItems.forEach((item) => {
      visualBoard.appendChild(createMediaElement(item));
    });
  }

  function deleteMediaItem(id) {
    state.mediaItems = state.mediaItems.filter((item) => item.id !== Number(id));
    save();
    renderBoard();
  }

  mediaType.addEventListener('change', () => {
    updateFileInput();
    mediaFileInput.value = null;
  });

  mediaFileInput.addEventListener('change', () => {
    updateFileInput(mediaFileInput.files[0]?.name || 'Выберите файл');
  });

  addMediaBtn.addEventListener('click', addMediaItem);
  visualBoard.addEventListener('click', (event) => {
    if (event.target.matches('.delete-btn')) {
      deleteMediaItem(event.target.dataset.id);
    }
  });

  updateFileInput();
  renderBoard();
});

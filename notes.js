document.addEventListener('DOMContentLoaded', () => {
  const board = document.getElementById('notesBoard');
  const noteTitleInput = document.getElementById('noteTitleInput');
  const noteTextInput = document.getElementById('noteTextInput');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const randomIdeaBtn = document.getElementById('randomIdeaBtn');

  const palette = ['#fde2f3', '#fff1d6', '#dff3fe', '#d9f7e0', '#f4dcff'];
  const ideas = [
    'Место, где герой встречает секретный знак.',
    'Новая деталь о мире, которая меняет всё.',
    'Короткая фраза, которая станет девизом истории.',
    'Спонтанное письмо из будущего.',
    'Нечто тихое, но важное, что герой не слышит.'
  ];

  const notes = JSON.parse(localStorage.getItem('notes') || '[]');

  function save() {
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  function render() {
    board.innerHTML = '';

    if (!notes.length) {
      board.innerHTML = '<p class="empty-list">Пока нет заметок — добавьте первую идею.</p>';
      return;
    }

    notes.forEach((note, index) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.style.backgroundColor = note.color || palette[index % palette.length];
      card.style.transform = `rotate(${(Math.random() * 6 - 3).toFixed(2)}deg)`;

      card.innerHTML = `
        <input class="note-title" value="${note.title || 'Новая заметка'}" />
        <textarea class="note-text" rows="6">${note.text || ''}</textarea>
        <div class="note-actions">
          <button class="note-color-btn" title="Сменить цвет"></button>
          <div>
            <button class="delete-btn" data-action="delete">Удалить</button>
          </div>
        </div>
      `;

      const titleInput = card.querySelector('.note-title');
      const textArea = card.querySelector('.note-text');
      const colorBtn = card.querySelector('.note-color-btn');
      const deleteBtn = card.querySelector('[data-action="delete"]');

      titleInput.addEventListener('input', () => {
        notes[index].title = titleInput.value;
        save();
      });

      textArea.addEventListener('input', () => {
        notes[index].text = textArea.value;
        save();
      });

      colorBtn.style.backgroundColor = note.color;
      colorBtn.addEventListener('click', () => {
        const currentIndex = palette.indexOf(note.color);
        const nextIndex = (currentIndex + 1) % palette.length;
        notes[index].color = palette[nextIndex];
        save();
        render();
      });

      deleteBtn.addEventListener('click', () => {
        notes.splice(index, 1);
        save();
        render();
      });

      board.appendChild(card);
    });
  }

  function addNote() {
    const title = noteTitleInput.value.trim() || 'Новая заметка';
    const text = noteTextInput.value.trim() || '';
    notes.unshift({
      title,
      text,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
    noteTitleInput.value = '';
    noteTextInput.value = '';
    save();
    render();
  }

  function fillRandomIdea() {
    noteTitleInput.value = 'Идея для сюжета';
    noteTextInput.value = ideas[Math.floor(Math.random() * ideas.length)];
  }

  addNoteBtn.addEventListener('click', addNote);
  randomIdeaBtn.addEventListener('click', fillRandomIdea);

  render();
});

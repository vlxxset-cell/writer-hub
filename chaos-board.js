document.addEventListener('DOMContentLoaded', () => {
  const palette = document.getElementById('colorPalette');
  const board = document.getElementById('chaosBoard');
  const addBtn = document.getElementById('addChaosNote');

  const pastelColors = [
    '#fff2d8',
    '#f8e7f1',
    '#dfe9ff',
    '#d9f1e8',
    '#fff5d9',
    '#e8f0fd',
    '#f9e8e2'
  ];

  let selectedColor = pastelColors[0];
  let notes = [];
  const storageKey = 'chaosBoardNotes';

  function loadNotes() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  }

  function saveNotes() {
    localStorage.setItem(storageKey, JSON.stringify(notes.map(note => ({
      id: note.dataset.id,
      left: note.style.left,
      top: note.style.top,
      color: note.dataset.color,
      content: note.querySelector('.note-content').innerHTML
    }))));
  }

  function createPalette() {
    pastelColors.forEach(color => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'palette-swatch';
      button.style.background = color;
      button.dataset.color = color;
      button.addEventListener('click', () => {
        selectedColor = color;
        document.querySelectorAll('.palette-swatch').forEach(s => s.classList.toggle('active', s === button));
      });
      palette.appendChild(button);
    });
    palette.firstChild.classList.add('active');
  }

  function makeNoteElement(data = {}) {
    const note = document.createElement('div');
    note.className = 'chaos-note';
    note.dataset.id = data.id || `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    note.dataset.color = data.color || selectedColor;
    note.style.background = note.dataset.color;
    note.style.left = data.left || `${Math.max(16, Math.min(560, Math.random() * 520))}px`;
    note.style.top = data.top || `${Math.max(16, Math.min(320, Math.random() * 280))}px`;

    note.innerHTML = `
      <div class="chaos-note-header">
        <button type="button" class="note-handle" aria-label="Перетащить">☰</button>
        <button type="button" class="note-remove" aria-label="Удалить">×</button>
      </div>
      <div class="note-content" contenteditable="true" data-placeholder="Пиши что хочешь...">${data.content || ''}</div>
    `;

    const removeBtn = note.querySelector('.note-remove');
    removeBtn.addEventListener('click', () => {
      notes = notes.filter(item => item !== note);
      note.remove();
      saveNotes();
    });

    const handle = note.querySelector('.note-handle');
    handle.addEventListener('pointerdown', (event) => startDrag(event, note));

    const content = note.querySelector('.note-content');
    content.addEventListener('input', saveNotes);

    notes.push(note);
    board.appendChild(note);
    return note;
  }

  function startDrag(event, note) {
    event.preventDefault();
    const rect = note.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    note.setPointerCapture(event.pointerId);

    function move(evt) {
      const left = Math.min(Math.max(0, evt.clientX - boardRect.left - offsetX), boardRect.width - rect.width);
      const top = Math.min(Math.max(0, evt.clientY - boardRect.top - offsetY), boardRect.height - rect.height);
      note.style.left = `${left}px`;
      note.style.top = `${top}px`;
    }

    function end() {
      note.releasePointerCapture(event.pointerId);
      saveNotes();
      board.removeEventListener('pointermove', move);
      board.removeEventListener('pointerup', end);
      board.removeEventListener('pointercancel', end);
    }

    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', end);
    board.addEventListener('pointercancel', end);
  }

  function renderNotes() {
    const saved = loadNotes();
    if (saved.length) {
      saved.forEach(data => makeNoteElement(data));
    }
  }

  addBtn.addEventListener('click', () => {
    makeNoteElement({ color: selectedColor, content: '' });
    saveNotes();
  });

  createPalette();
  renderNotes();
});

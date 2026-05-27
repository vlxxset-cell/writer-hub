document.addEventListener('DOMContentLoaded', () => {
  let books = JSON.parse(localStorage.getItem('books')) || [];
  let index = Number(localStorage.getItem('currentBook'));

  if (isNaN(index) || !books[index]) {
    window.location.href = 'books.html';
    return;
  }

  const book = books[index];
  book.chapters = book.chapters || [];

  const bookSubtitle = document.getElementById('bookSubtitle');
  const pageTitle = document.getElementById('pageTitle');
  const chaptersList = document.getElementById('chapters');
  const emptyMessage = document.getElementById('emptyMessage');
  const newTitleInput = document.getElementById('newChapterTitle');
  const addBtn = document.getElementById('addChapterBtn');

  function capitalizeWords(text) {
    return text
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  bookSubtitle.textContent = book.title ? `Книга «${capitalizeWords(book.title)}»` : 'Книга';
  pageTitle.textContent = 'Главы';

  let lastDeletedChapter = null;
  let lastDeletedIndex = null;
  let undoTimer = null;
  let undoInterval = null;

  function save() {
    books[index] = book;
    localStorage.setItem('books', JSON.stringify(books));
  }

  function render() {
    chaptersList.innerHTML = '';

    if (!book.chapters.length) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';

    book.chapters.forEach((ch, i) => {
      const li = document.createElement('li');
      li.className = 'book-card';

      li.innerHTML = `
        <h2>${ch.title || `Глава ${i + 1}`}</h2>
        <div class="actions">
          <a class="open-btn" href="editor.html?chapter=${i}&book=${index}">
            Открыть
          </a>
          <button class="delete-btn">Удалить</button>
        </div>
      `;

      li.querySelector('.delete-btn').addEventListener('click', () => {
        const deleted = book.chapters[i];
        const delIndex = i;
        book.chapters.splice(i, 1);
        save();
        render();
        window.undoManager.register('Глава удалена', () => {
          book.chapters.splice(delIndex, 0, deleted);
          save();
          render();
        });
      });

      chaptersList.appendChild(li);
    });
  }

  addBtn.addEventListener('click', () => {
    const title = newTitleInput.value.trim();
    if (!title) return;

    book.chapters.push({
      title,
      events: []
    });

    newTitleInput.value = '';
    save();
    render();
  });

  // undo handled by undoManager

  render();
});
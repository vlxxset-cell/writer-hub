let books = JSON.parse(localStorage.getItem("books")) || [];

let pendingTitle = "";
let searchQuery = "";
let lastDeleted = null;
let lastDeletedIndex = null;
let undoTimer = null;
let undoInterval = null;
let editingIndex = null;

// ===== РЕНДЕР =====
function renderBooks() {
  const list = document.getElementById("booksList");
  list.innerHTML = "";

  const filteredBooks = books
    .map((book, index) => ({ book, index }))
      .filter(({ book }) => {
        const title = (book.title || "").toLowerCase();
        return !searchQuery || title.includes(searchQuery.toLowerCase());
      });
  filteredBooks.forEach(({ book, index }) => {
    const div = document.createElement("div");
    div.className = "book-card";

    const coverHTML = book.cover
      ? `<div class="cover"><img src="${book.cover}" alt="Обложка книги"></div>`
      : `<div class="cover"></div>`;

    div.innerHTML = `
      ${coverHTML}
      <h3>${book.title}</h3>
      <p>${book.genre || 'Книга'}</p>
      <button class="open-btn">открыть</button>
      <button class="edit-btn">изменить</button>
      <button class="delete-btn">удалить</button>
    `;

    div.querySelector(".open-btn").onclick = (e) => {
      e.stopPropagation();
      try { console.log('books.open click', index); } catch (e) {}
      openBook(index);
    };

    div.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      showEditModal(index);
    };

    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      deleteBook(index);
    };

    list.appendChild(div);
  });
}

// ===== ДОБАВИТЬ КНИГУ (ОТКРЫВАЕТ МОДАЛКУ) =====
function showAddModal() {
  editingIndex = null;
  const input = document.getElementById("newBookTitle");
  const genreSelect = document.getElementById("genreSelect");
  const modalBtn = document.getElementById("modalActionBtn");
  input.value = "";
  genreSelect.value = "Фэнтези";
  document.getElementById("modalText").innerText = "Какую книгу вы хотите добавить?";
  modalBtn.innerText = "Создать";
  modalBtn.onclick = () => confirmCreate();
  document.getElementById("modal").classList.add("show");
  input.focus();
}

function showEditModal(index) {
  editingIndex = index;
  const book = books[index];
  const input = document.getElementById("newBookTitle");
  const genreSelect = document.getElementById("genreSelect");
  const modalBtn = document.getElementById("modalActionBtn");
  input.value = book.title;
  genreSelect.value = book.genre || "Фэнтези";
  document.getElementById("modalText").innerText = "Изменить книгу";
  modalBtn.innerText = "Сохранить";
  modalBtn.onclick = () => confirmEdit();
  document.getElementById("modal").classList.add("show");
  input.focus();
  input.select();
}

// ===== ПОДТВЕРДИТЬ СОЗДАНИЕ =====
function confirmCreate() {
  const input = document.getElementById("newBookTitle");
  const genreSelect = document.getElementById("genreSelect");
  const title = input.value.trim();
  const genre = genreSelect.value;

  if (!title) return;

  books.push({
    title,
    cover: null,
    genre
  });

  input.value = "";

  saveBooks();
  renderBooks();

  closeModal();
}

// ===== ПОДТВЕРДИТЬ РЕДАКТИРОВАНИЕ =====
function confirmEdit() {
  if (editingIndex === null) return;

  const input = document.getElementById("newBookTitle");
  const genreSelect = document.getElementById("genreSelect");
  const title = input.value.trim();
  const genre = genreSelect.value;

  if (!title) return;

  books[editingIndex].title = title;
  books[editingIndex].genre = genre;

  input.value = "";
  editingIndex = null;

  saveBooks();
  renderBooks();

  closeModal();
}

// ===== ОТМЕНА =====
function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

function initSearch() {
  const search = document.getElementById("searchBooks");
  search.addEventListener("input", () => {
    searchQuery = search.value.trim();
    renderBooks();
  });
}

// ===== УДАЛИТЬ =====
function deleteBook(index) {
  const deleted = books[index];
  const delIndex = index;
  books.splice(index, 1);
  saveBooks();
  renderBooks();
  window.undoManager.register('Книга удалена', () => {
    books.splice(delIndex, 0, deleted);
    saveBooks();
    renderBooks();
  });
}

// undo handled by undoManager

// ===== СОХРАНИТЬ =====
function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

// ===== ОТКРЫТЬ =====
function openBook(index) {
  try { console.log('books.openBook set currentBook=', index, 'writer_user=', localStorage.getItem('writer_user')); } catch (e) {}
  localStorage.setItem("currentBook", index);
  try { console.log('books.openBook after set currentBook=', localStorage.getItem('currentBook')); } catch (e) {}
  // небольшая задержка, чтобы гарантировать запись в storage перед навигацией
  setTimeout(() => { window.location.href = "book.html"; }, 20);
}

// старт
initSearch();
renderBooks();
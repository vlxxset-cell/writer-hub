document.addEventListener("DOMContentLoaded", () => {

  let books = JSON.parse(localStorage.getItem("books")) || [];
  let index = Number(localStorage.getItem("currentBook"));

  if (isNaN(index) || !books[index]) {
    window.location.href = "books.html";
    return;
  }

  let book = books[index];

  // ===== TITLE =====
  const titleEl = document.getElementById("bookTitle");
  titleEl.innerText = book.title || "";

  titleEl.addEventListener("input", () => {
    book.title = titleEl.innerText;
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
  });

  // ===== COVER =====
  const coverPicker = document.getElementById("coverPicker");
  const coverPreview = document.getElementById("coverPreview");
  const coverDeleteBtn = document.querySelector(".cover-controls button");
  const coverUndoToast = document.getElementById("coverUndoToast");

  let deletedCover = null;
  let coverUndoTimer = null;
  let coverUndoInterval = null;

  function renderCover() {
    if (book.cover) {
      coverPreview.innerHTML = `<img src="${book.cover}" alt="Обложка книги">`;
      coverPreview.style.background = "none";
      coverDeleteBtn.style.display = "inline-flex";
    } else {
      coverPreview.innerHTML = "";
      coverPreview.style.background = "";
      coverDeleteBtn.style.display = "none";
    }
  }

  renderCover();

  coverPicker.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Выберите изображение для обложки");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      book.cover = reader.result;
      books[index] = book;
      localStorage.setItem("books", JSON.stringify(books));
      renderCover();
    };

    reader.readAsDataURL(file);
  });

  function removeCover() {
    if (!book.cover) return;

    deletedCover = book.cover;
    book.cover = null;
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
    renderCover();
    showCoverUndo();
  }

  function showCoverUndo() {
    coverUndoToast.innerHTML = `
      <div class="undo-label">
        <span class="undo-toast__text">Обложка удалена</span>
        <span class="undo-timer">5 сек</span>
      </div>
      <button onclick="undoCover()">отменить</button>
      <div class="undo-progress"><div class="undo-progress__bar"></div></div>
    `;
    coverUndoToast.classList.add("show");
    coverUndoToast.style.display = "flex";

    if (coverUndoTimer) {
      clearTimeout(coverUndoTimer);
    }
    if (coverUndoInterval) {
      clearInterval(coverUndoInterval);
    }

    const duration = 5000;
    const start = Date.now();
    const progressBar = coverUndoToast.querySelector(".undo-progress__bar");
    const timerText = coverUndoToast.querySelector(".undo-timer");
    progressBar.style.width = "100%";
    timerText.innerText = "5 сек";

    coverUndoInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.max(0, 100 - (elapsed / duration) * 100);
      progressBar.style.width = `${percent}%`;
      timerText.innerText = `${Math.max(0, Math.ceil((duration - elapsed) / 1000))} сек`;
    }, 100);

    coverUndoTimer = setTimeout(() => {
      coverUndoToast.classList.remove("show");
      coverUndoToast.style.display = "none";
      deletedCover = null;
      coverUndoTimer = null;
      clearInterval(coverUndoInterval);
      coverUndoInterval = null;
    }, duration);
  }

  window.undoCover = function () {
    if (deletedCover === null) return;

    book.cover = deletedCover;
    deletedCover = null;
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
    renderCover();

    clearTimeout(coverUndoTimer);
    coverUndoTimer = null;
    clearInterval(coverUndoInterval);
    coverUndoInterval = null;

    coverUndoToast.classList.remove("show");
    coverUndoToast.style.display = "none";
  }

  window.removeCover = removeCover;

  // ===== LIGHTBOX =====
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  coverPreview.addEventListener("click", () => {
    if (!book.cover) return;

    lightboxImg.src = book.cover;
    lightbox.classList.add("show");
  });

  window.closeLightbox = function () {
    lightbox.classList.remove("show");
    lightboxImg.src = "";
  };

});
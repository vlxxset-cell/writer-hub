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

    // resize before storing to avoid quota exceeded on mobile photos
    (async () => {
      try {
        const small = await (function resizeImageFile(file, maxWidth = 1200, quality = 0.8) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = () => {
              img.onload = () => {
                const ratio = img.width / img.height;
                let w = img.width; let h = img.height;
                if (w > maxWidth) { w = maxWidth; h = Math.round(maxWidth / ratio); }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch (e) { reject(e); }
              };
              img.onerror = reject;
              img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })(file);

        book.cover = small;
        books[index] = book;
        try {
          localStorage.setItem("books", JSON.stringify(books));
          renderCover();
        } catch (err) {
          console.error('save cover error', err);
          alert('Хранилище переполнено. Обложка слишком большая. Попробуйте выбрать более маленькое изображение.');
        }
      } catch (err) {
        console.error('resize cover error', err);
        alert('Не удалось обработать выбранный файл.');
      }
    })();
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
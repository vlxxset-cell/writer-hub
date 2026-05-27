document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem("books")) || [];
  const index = Number(localStorage.getItem("currentBook"));

  if (isNaN(index) || !books[index]) {
    window.location.href = "books.html";
    return;
  }

  const book = books[index];
  const bookSubtitle = document.getElementById("bookSubtitle");
  const pageTitle = document.getElementById("pageTitle");
  const plotSummary = document.getElementById("plotSummary");
  const twistsList = document.getElementById("twistsList");
  const addTwistBtn = document.getElementById("addTwistBtn");
  const clearTwistsBtn = document.getElementById("clearTwistsBtn");
  const saveStatus = document.getElementById("saveStatus");

  function capitalizeWords(text) {
    return text
      .trim()
      .split(" ")
      .filter(Boolean)
      .map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  bookSubtitle.textContent = book.title ? `Книга «${capitalizeWords(book.title)}»` : "Книга";
  pageTitle.textContent = "Сюжет";
  book.plot = book.plot || "";
  book.plotTwists = book.plotTwists || [];
  let lastDeletedTwist = null;
  let lastDeletedIndex = null;
  let undoTimer = null;
  let undoInterval = null;

  plotSummary.value = book.plot;

  function save() {
    book.plot = plotSummary.value;
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
    saveStatus.innerText = "Сохранено";
  }

  function createTwistCard(twist, position) {
    const card = document.createElement("div");
    card.className = "twist-card";
    card.innerHTML = `
      <div class="twist-header">
        <input class="twist-title" placeholder="Название поворота" value="${twist.title || ""}" />
        <button class="delete-btn" type="button">Удалить</button>
      </div>
    `;

    const titleInput = card.querySelector(".twist-title");
    const deleteBtn = card.querySelector(".delete-btn");

    function updateTwist() {
      book.plotTwists[position] = {
        ...book.plotTwists[position],
        title: titleInput.value
      };
      save();
    }

    titleInput.addEventListener("input", updateTwist);

    deleteBtn.addEventListener("click", () => {
      const deleted = book.plotTwists[position];
      const delIndex = position;
      book.plotTwists.splice(position, 1);
      save();
      renderTwists();
      window.undoManager.register('Поворот удалён', () => {
        book.plotTwists.splice(delIndex, 0, deleted);
        save();
        renderTwists();
      });
    });

    return card;
  }

  // undo handled by undoManager

  function renderTwists() {
    twistsList.innerHTML = "";

    if (!book.plotTwists.length) {
      twistsList.innerHTML = `<p style="color:#64748b;">Добавь первый поворот, чтобы увидеть список сюжетных линий.</p>`;
      return;
    }

    book.plotTwists.forEach((twist, index) => {
      twistsList.appendChild(createTwistCard(twist, index));
    });
  }

  plotSummary.addEventListener("input", save);

  addTwistBtn.addEventListener("click", () => {
    book.plotTwists.push({ title: "" });
    save();
    renderTwists();
  });

  clearTwistsBtn.addEventListener("click", () => {
    book.plotTwists = [];
    save();
    renderTwists();
  });

  renderTwists();
});

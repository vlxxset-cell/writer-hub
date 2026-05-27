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
  const timelineList = document.getElementById("timelineList");
  const addTimelineBtn = document.getElementById("addTimelineBtn");
  const clearTimelineBtn = document.getElementById("clearTimelineBtn");
  const copyTimelineBtn = document.getElementById("copyTimelineBtn");
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
  pageTitle.textContent = "Хронология";
  book.chronology = book.chronology || [];
   let lastDeletedItem = null;
   let lastDeletedIndex = null;
   let undoTimer = null;
   let undoInterval = null;

  function save() {
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
    saveStatus.innerText = "Сохранено";
  }

  function createTimelineItem(event, position) {
    const item = document.createElement("div");
    item.className = "timeline-node";

    item.innerHTML = `
      <div class="timeline-card">
        <div class="timeline-number">${position + 1}</div>
        <input class="timeline-title" placeholder="Название события" value="${event.title || ""}" />
        
        <div class="hero-actions">
          <button class="delete-btn" type="button">Удалить</button>
        </div>
      </div>
    `;

    const titleInput = item.querySelector(".timeline-title");
    const deleteBtn = item.querySelector(".delete-btn");

    function updateEvent() {
        book.chronology[position] = {
          ...book.chronology[position],
          title: titleInput.value
        };
      save();
    }

    titleInput.addEventListener("input", updateEvent);

    deleteBtn.addEventListener("click", () => {
      const deleted = book.chronology[position];
      const delIndex = position;
      book.chronology.splice(position, 1);
      save();
      render();
      window.undoManager.register('Событие удалено', () => {
        book.chronology.splice(delIndex, 0, deleted);
        save();
        render();
      });
    });

    return item;
  }

    // undo handled by undoManager
  function render() {
    timelineList.innerHTML = "";

    if (!book.chronology.length) {
      timelineList.innerHTML = `<p style="color:#64748b;">Добавь первое событие, и стрелочки покажут путь истории.</p>`;
      return;
    }

    book.chronology.forEach((event, index) => {
      timelineList.appendChild(createTimelineItem(event, index));
    });
  }

  addTimelineBtn.addEventListener("click", () => {
    book.chronology.push({ title: "" });
    save();
    render();
  });

  clearTimelineBtn.addEventListener("click", () => {
    book.chronology = [];
    save();
    render();
  });

  copyTimelineBtn.addEventListener("click", async () => {
    const text = book.chronology
      .map((item, index) => `${index + 1}. ${item.title || "Событие"}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      saveStatus.innerText = "Скопировано";
      setTimeout(() => saveStatus.innerText = "Сохранено", 1500);
    } catch {
      saveStatus.innerText = "Ошибка копирования";
      setTimeout(() => saveStatus.innerText = "Сохранено", 1500);
    }
  });

  render();
});

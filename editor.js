document.addEventListener("DOMContentLoaded", () => {
  let books = JSON.parse(localStorage.getItem("books")) || [];

  const params = new URLSearchParams(window.location.search);
  const chapterIndex = Number(params.get("chapter"));
  const bookIndex = Number(params.get("book"));

  if (!books[bookIndex] || !books[bookIndex].chapters[chapterIndex]) {
    window.location.href = "chapter.html";
    return;
  }

  const chapter = books[bookIndex].chapters[chapterIndex];

  const titleEl = document.getElementById("chapterTitle");
  const summaryEl = document.getElementById("chapterSummary");
  const eventsList = document.getElementById("eventsList");
  const addEventBtn = document.getElementById("addEventBtn");

  titleEl.textContent = `Глава "${chapter.title}"`;

  chapter.events = chapter.events || [];

  summaryEl.value = chapter.summary || "";

  function save() {
    books[bookIndex].chapters[chapterIndex] = chapter;
    localStorage.setItem("books", JSON.stringify(books));
  }

  summaryEl.addEventListener("input", () => {
    chapter.summary = summaryEl.value;
    save();
  });

  let lastDeletedEvent = null;
  let lastDeletedIndex = null;
  let undoTimer = null;
  let undoInterval = null;

  function createEvent(data = {}) {
    const id = data.id || crypto.randomUUID();
    const initialPriority = data.priority || "low";

    const item = document.createElement("div");
    item.className = `event-item priority-${initialPriority}`;
    item.dataset.id = id;

    item.innerHTML = `
      <div class="event-body">
        <input class="event-input" placeholder="Новое событие..." value="${data.text || ""}" />

        <div class="priority-group">
          <button class="priority-btn ${data.priority === "low" || !data.priority ? "active" : ""}" data-value="low">низкий</button>
          <button class="priority-btn ${data.priority === "medium" ? "active" : ""}" data-value="medium">средний</button>
          <button class="priority-btn ${data.priority === "high" ? "active" : ""}" data-value="high">высокий</button>
        </div>
      </div>
      <button class="delete-event-btn" type="button">удалить</button>
    `;

    const input = item.querySelector(".event-input");
    const buttons = item.querySelectorAll(".priority-btn");
    const deleteBtn = item.querySelector(".delete-event-btn");

    function update() {
      const idx = chapter.events.findIndex(e => e.id === id);

      const updated = {
        id,
        text: input.value,
        priority: item.querySelector(".priority-btn.active")?.dataset.value || "low"
      };

      if (idx >= 0) {
        chapter.events[idx] = updated;
      } else {
        chapter.events.push(updated);
      }

      item.className = `event-item priority-${updated.priority}`;

      save();
      sortEvents();
    }

    deleteBtn.addEventListener("click", () => {
      const idx = chapter.events.findIndex(e => e.id === id);
      if (idx === -1) return;
      const deleted = chapter.events[idx];
      const delIndex = idx;
      chapter.events.splice(idx, 1);
      save();
      render();
      window.undoManager.register('Событие удалено', () => {
        chapter.events.splice(delIndex, 0, deleted);
        save();
        render();
      });
    });

    input.addEventListener("input", update);

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        update();
        render();
      });
    });

    return item;
  }

  function sortEvents() {
    const order = { high: 0, medium: 1, low: 2 };
    chapter.events.sort((a, b) => {
      return (order[a.priority || "low"] || 2) - (order[b.priority || "low"] || 2);
    });
  }

  function render() {
    eventsList.innerHTML = "";
    sortEvents();

    chapter.events.forEach(ev => {
      eventsList.appendChild(createEvent(ev));
    });
  }

  addEventBtn.addEventListener("click", () => {
    chapter.events.push({
      id: crypto.randomUUID(),
      text: "",
      priority: "low"
    });

    save();
    render();
  });

  // undo handled by undoManager

  render();
});
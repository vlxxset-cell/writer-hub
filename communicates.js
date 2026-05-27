document.addEventListener('DOMContentLoaded', () => {
  const books = JSON.parse(localStorage.getItem('books')) || [];
  const list = document.getElementById('booksList');

  if (!books.length) {
    list.innerHTML = '<p style="color:#64748b;">Добавьте книгу на странице «Книги», чтобы создать граф персонажей.</p>';
    return;
  }

  books.forEach((book, i) => {
    const div = document.createElement('div');
    div.className = 'book-card';
    const coverStyle = book.cover ? `background-image: url('${book.cover}'); background-size: cover; background-position:center;` : '';
    div.innerHTML = `
      <div class="cover" style="${coverStyle}"></div>
      <h3>${book.title || 'Книга'}</h3>
      <p>${book.genre || ''}</p>
      <div class="actions"><button class="open-btn">Открыть граф</button></div>
    `;
    div.querySelector('.open-btn').addEventListener('click', () => {
      localStorage.setItem('currentBookGraph', i);
      window.location.href = 'heroescom.html';
    });
    list.appendChild(div);
  });
});

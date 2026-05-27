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
  const heroesList = document.getElementById("heroesList");
  const addHeroBtn = document.getElementById("addHeroBtn");
  const clearHeroesBtn = document.getElementById("clearHeroesBtn");
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
  pageTitle.textContent = "Персонажи";
  book.heroes = book.heroes || [];
  let lastDeletedHero = null;
  let lastDeletedIndex = null;
  let undoTimer = null;
  let undoInterval = null;

  function save() {
    books[index] = book;
    localStorage.setItem("books", JSON.stringify(books));
    saveStatus.innerText = "Сохранено";
  }

  // --- helpers for computing subtle card color based on optimism slider ---
  function hexToRgb(hex) {
    hex = (hex || '').replace('#','').trim();
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return {r, g, b};
  }

  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    if (max!==min){
      const d = max-min;
      s = l>0.5? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h = Math.round(h*60);
    }
    return {h: h||0, s: Math.round(s*100), l: Math.round(l*100)};
  }

  function hslCss(h,s,l){ return `hsl(${h} ${s}% ${l}%)`; }

  function computeCardBackground(optimistValue){
    // optimistValue: 0..100, 50 neutral
    const neutralBackground = hslCss(35, 20, 94);
    if (typeof optimistValue !== 'number' || optimistValue === 50) {
      return neutralBackground;
    }

    const p = Math.min(1, Math.max(0, Math.abs(optimistValue - 50) / 50));
    const tintAlpha = 0.1 + p * 0.12; // 0.1..0.22 for clearer pastel overlay

    if (optimistValue > 50) {
      const coolBase = hslCss(205, 32, 94);
      const overlay = `rgba(185, 214, 255, ${tintAlpha})`; // soft pale sky
      return `linear-gradient(${overlay}, ${overlay}), ${coolBase}`;
    }

    const warmBase = hslCss(28, 30, 94);
    const overlay = `rgba(255, 218, 185, ${tintAlpha})`; // softer pale peach
    return `linear-gradient(${overlay}, ${overlay}), ${warmBase}`;
  }

  function applyCardStyle(heroObj, el){
    try{
      const v = heroObj && heroObj.sliders && (heroObj.sliders.optimistPessimist != null) ? Number(heroObj.sliders.optimistPessimist) : null;
      if (v === null) { el.style.background = ''; return; }
      el.style.background = computeCardBackground(v);
    }catch(e){ console.warn('applyCardStyle error', e); }
  }

  function createHeroCard(hero, position) {
    const card = document.createElement("div");
    card.className = "hero-card";
    card.innerHTML = `
      <div class="hero-top">
        <div class="hero-avatar" style="background-image: url('${hero.photo || ""}');" title="Нажми, чтобы добавить фото">
          ${hero.photo ? "" : "+"}
        </div>
        <div class="hero-fields">
          <input class="hero-input hero-name" placeholder="Имя персонажа" value="${hero.name || ""}" />
          <input class="hero-input hero-age" placeholder="Возраст" value="${hero.age || ""}" />
          <input class="hero-input hero-role" placeholder="Род деятельности" value="${hero.role || ""}" />
          <input class="hero-input hero-eyes" placeholder="Цвет глаз" value="${hero.eyes || ""}" />
          <input class="hero-input hero-hair-color" placeholder="Цвет волос" value="${hero.hair_color || ""}" />
          <select class="hero-input hero-hair-structure">
            <option value="">Структура волос</option>
            <option value="straight" ${hero.hair_structure==='straight'?'selected':''}>Прямые</option>
            <option value="wavy" ${hero.hair_structure==='wavy'?'selected':''}>Волнистые</option>
            <option value="curly" ${hero.hair_structure==='curly'?'selected':''}>Кудрявые</option>
            <option value="coily" ${hero.hair_structure==='coily'?'selected':''}>Плотные/кудрявые</option>
          </select>
        </div>
      </div>
      <div class="relations-grid">
        <textarea class="hero-textarea hero-relations-close" placeholder="Отношения: близкие">${hero.relations_close || ""}</textarea>
        <textarea class="hero-textarea hero-relations-complex" placeholder="Отношения: сложные">${hero.relations_complex || ""}</textarea>
        <textarea class="hero-textarea hero-relations-neutral" placeholder="Отношения: нейтральные">${hero.relations_neutral || ""}</textarea>
      </div>
      <div class="traits-section">
        <div class="traits-input-row">
          <input class="hero-input trait-input" placeholder="Добавить черту" />
          <button class="quick-btn add-trait-btn" type="button">Добавить</button>
        </div>
        <div class="traits-input-row">
          <select class="trait-suggestions">
            <option value="">Выбрать подсказку</option>
            <option value="смелый">смелый</option>
            <option value="мужественный">мужественный</option>
            <option value="таинственный">таинственный</option>
            <option value="решительный">решительный</option>
            <option value="интроверт">интроверт</option>
            <option value="харизматичный">харизматичный</option>
            <option value="непредсказуемый">непредсказуемый</option>
          </select>
          <button class="quick-btn add-suggestion-btn" type="button">Добавить</button>
        </div>
        <ul class="traits-list"></ul>
      </div>
      <div class="sliders-section">
        <div class="slider-row"><div class="slider-label">Оптимист — Пессимист</div><input type="range" class="hero-slider optimist" min="0" max="100" value="${(hero.sliders && hero.sliders.optimistPessimist) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Интроверт — Экстраверт</div><input type="range" class="hero-slider introextro" min="0" max="100" value="${(hero.sliders && hero.sliders.introextro) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Закрытый — Открытый</div><input type="range" class="hero-slider closedopen" min="0" max="100" value="${(hero.sliders && hero.sliders.closedOpen) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Импульс — Контроль</div><input type="range" class="hero-slider impulsecontrol" min="0" max="100" value="${(hero.sliders && hero.sliders.impulseControl) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Недоверчивый — Доверчивый</div><input type="range" class="hero-slider distrusttrust" min="0" max="100" value="${(hero.sliders && hero.sliders.distrustTrust) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Избегающий — Прямолинейный</div><input type="range" class="hero-slider avoiddirect" min="0" max="100" value="${(hero.sliders && hero.sliders.avoidDirect) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Спокойный — Драматичный</div><input type="range" class="hero-slider calmdramatic" min="0" max="100" value="${(hero.sliders && hero.sliders.calmDramatic) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Шутник — Серьёзный</div><input type="range" class="hero-slider jokerserious" min="0" max="100" value="${(hero.sliders && hero.sliders.jokerSerious) || 50}" /></div>
        <div class="slider-row"><div class="slider-label">Зависимый — Независимый</div><input type="range" class="hero-slider dependentindependent" min="0" max="100" value="${(hero.sliders && hero.sliders.dependentIndependent) || 50}" /></div>
      </div>
      <div class="hero-actions">
        <button class="delete-btn" type="button">Удалить</button>
      </div>
      <input type="file" accept="image/*" class="hero-photo-input" style="display:none" />
    `;

    const nameInput = card.querySelector(".hero-name");
    const ageInput = card.querySelector(".hero-age");
    const roleInput = card.querySelector(".hero-role");
    const relationsClose = card.querySelector('.hero-relations-close');
    const relationsComplex = card.querySelector('.hero-relations-complex');
    const relationsNeutral = card.querySelector('.hero-relations-neutral');
    const eyesInput = card.querySelector('.hero-eyes');
    const hairColorInput = card.querySelector('.hero-hair-color');
    const hairStructureSelect = card.querySelector('.hero-hair-structure');
    const traitInput = card.querySelector('.trait-input');
    const addTraitBtn = card.querySelector('.add-trait-btn');
    const traitSelect = card.querySelector('.trait-suggestions');
    const addSuggestionBtn = card.querySelector('.add-suggestion-btn');
    const traitsListEl = card.querySelector('.traits-list');
    const introExtroSlider = card.querySelector('.hero-slider.introextro');
    const optimistSlider = card.querySelector('.hero-slider.optimist');
    const closedOpenSlider = card.querySelector('.hero-slider.closedopen');
    const impulseControlSlider = card.querySelector('.hero-slider.impulsecontrol');
    const distrustTrustSlider = card.querySelector('.hero-slider.distrusttrust');
    const avoidDirectSlider = card.querySelector('.hero-slider.avoiddirect');
    const calmDramaticSlider = card.querySelector('.hero-slider.calmdramatic');
    const jokerSeriousSlider = card.querySelector('.hero-slider.jokerserious');
    const dependentIndependentSlider = card.querySelector('.hero-slider.dependentindependent');
    const deleteBtn = card.querySelector(".delete-btn");
    const photoInput = card.querySelector(".hero-photo-input");
    const avatar = card.querySelector(".hero-avatar");
    const saveCardBtn = document.createElement('button'); 
    saveCardBtn.type = 'button'; 
    saveCardBtn.className = 'quick-btn save-card-btn'; 
    saveCardBtn.textContent = 'Сохранить персонажа';
    const actions = card.querySelector('.hero-actions'); 
    actions.insertBefore(saveCardBtn, actions.firstChild);

    function updateHero() {
      book.heroes[position] = {
        ...book.heroes[position],
        name: nameInput.value,
        age: ageInput.value,
        role: roleInput.value,
        eyes: eyesInput.value,
        hair_color: hairColorInput.value,
        hair_structure: hairStructureSelect.value,
        sliders: {
          introextro: Number(introExtroSlider?.value || 50),
          optimistPessimist: Number(optimistSlider?.value || 50),
          closedOpen: Number(closedOpenSlider?.value || 50),
          impulseControl: Number(impulseControlSlider?.value || 50),
          distrustTrust: Number(distrustTrustSlider?.value || 50),
          avoidDirect: Number(avoidDirectSlider?.value || 50),
          calmDramatic: Number(calmDramaticSlider?.value || 50),
          jokerSerious: Number(jokerSeriousSlider?.value || 50),
          dependentIndependent: Number(dependentIndependentSlider?.value || 50)
        },
        relations_close: relationsClose.value,
        relations_complex: relationsComplex.value,
        relations_neutral: relationsNeutral.value,
        traits: book.heroes[position].traits || [],
        photo: book.heroes[position]?.photo || hero.photo || "",
        isSummaryView: book.heroes[position]?.isSummaryView || false
      };
      save();
      applyCardStyle(book.heroes[position], card);
    }

    nameInput.addEventListener("input", updateHero);
    ageInput.addEventListener("input", updateHero);
    roleInput.addEventListener("input", updateHero);
    eyesInput.addEventListener("input", updateHero);
    hairColorInput.addEventListener("input", updateHero);
    hairStructureSelect.addEventListener("change", updateHero);
    relationsClose.addEventListener('input', updateHero);
    relationsComplex.addEventListener('input', updateHero);
    relationsNeutral.addEventListener('input', updateHero);

    avatar.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        book.heroes[position] = book.heroes[position] || {};
        book.heroes[position].photo = reader.result;
        avatar.style.backgroundImage = `url('${reader.result}')`;
        avatar.textContent = "";
        save();
      };
      reader.readAsDataURL(file);
    });

    // save without generating heavy canvas image (just mark as summary view)
    saveCardBtn.addEventListener('click', () => {
      try {
        const heroObj = book.heroes[position] = book.heroes[position] || {};
        heroObj.isSummaryView = true;
        save();
        showSummary();
      } catch (err) { 
        alert('Ошибка при сохранении карточки: ' + (err && err.message)); 
      }
    });

    // показать компактную карточку вместо формы
    const makeSummaryElement = () => {
      const h = book.heroes[position] || {};
      const wrap = document.createElement('div');
      wrap.className = 'hero-summary-card';
      wrap.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <img src="${h.photo||''}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;border:1px solid var(--color-border);flex-shrink:0;background-color:var(--color-bg-tertiary);" alt="${h.name||'Персонаж'}" />
          <div style="flex:1">
            <h3 style="margin:0;font-size:1.05rem">${h.name||'Без имени'}</h3>
            <div style="color:var(--color-text-secondary);margin-top:6px">${h.role||''}${h.age?(', '+h.age):''}</div>
            <div style="margin-top:8px;color:var(--color-text-tertiary);font-size:0.95rem">${(h.traits||[]).slice(0,5).join(', ')}</div>
            <div style="margin-top:8px;color:var(--color-text-secondary);font-size:0.95rem">Глаза: ${h.eyes||'—'} · Волосы: ${h.hair_color||'—'}${h.hair_structure?(' · '+(h.hair_structure==='straight'?'прямые':h.hair_structure==='wavy'?'волнистые':h.hair_structure==='curly'?'кудрявые':'плотные/кудрявые')):''}</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="quick-btn edit-hero-btn" type="button">Редактировать</button>
          <button class="delete-hero-btn delete-btn" type="button">Удалить</button>
        </div>
      `;

      const editBtn = wrap.querySelector('.edit-hero-btn');
      const delBtn = wrap.querySelector('.delete-hero-btn');

      editBtn.addEventListener('click', () => {
        book.heroes[position].isSummaryView = false;
        save();
        const newCard = createHeroCard(book.heroes[position] || {}, position);
        wrap.parentNode.replaceChild(newCard, wrap);
      });

      delBtn.addEventListener('click', () => {
          const deleted = book.heroes[position];
          const delIndex = position;
          book.heroes.splice(position, 1);
          save();
          render();
          window.undoManager.register('Персонаж удалён', () => {
            book.heroes.splice(delIndex, 0, deleted);
            save();
            render();
          });

      });

      // apply subtle color based on sliders
      applyCardStyle(h, wrap);
      return wrap;
    };

    function showSummary() {
      try {
        const summary = makeSummaryElement();
        if (card.parentNode) card.parentNode.replaceChild(summary, card);
      } catch (e) { 
        console.warn('showSummary error', e); 
      }
    }

    function renderTraits() {
      traitsListEl.innerHTML = '';
      const traits = book.heroes[position].traits || [];
      traits.forEach((t, i) => {
        const li = document.createElement('li');
        li.textContent = t;
        const rem = document.createElement('button');
        rem.type = 'button';
        rem.textContent = 'x';
        rem.addEventListener('click', () => {
          traits.splice(i, 1);
          book.heroes[position].traits = traits;
          save();
          renderTraits();
        });
        li.appendChild(rem);
        traitsListEl.appendChild(li);
      });
    }

    addTraitBtn.addEventListener('click', () => {
      const v = traitInput.value.trim() || traitSelect.value;
      if (!v) return;
      book.heroes[position].traits = book.heroes[position].traits || [];
      if (!book.heroes[position].traits.includes(v)) {
        book.heroes[position].traits.push(v);
      }
      traitInput.value = '';
      traitSelect.value = '';
      save();
      renderTraits();
    });

    addSuggestionBtn.addEventListener('click', () => {
      const v = traitSelect.value;
      if (!v) return;
      book.heroes[position].traits = book.heroes[position].traits || [];
      if (!book.heroes[position].traits.includes(v)) {
        book.heroes[position].traits.push(v);
      }
      traitSelect.value = '';
      save();
      renderTraits();
    });

    // initial render traits
    book.heroes[position].traits = book.heroes[position].traits || [];
    renderTraits();

    // wire sliders to update
    [introExtroSlider, optimistSlider, closedOpenSlider, impulseControlSlider, distrustTrustSlider, avoidDirectSlider, calmDramaticSlider, jokerSeriousSlider, dependentIndependentSlider].forEach(s => {
      if (!s) return;
      s.addEventListener('input', updateHero);
    });

    // initial style
    applyCardStyle(book.heroes[position], card);

    deleteBtn.addEventListener('click', () => {
      const deleted = book.heroes[position];
      const delIndex = position;
      book.heroes.splice(position, 1);
      save();
      render();
      window.undoManager.register('Персонаж удалён', () => {
        book.heroes.splice(delIndex, 0, deleted);
        save();
        render();
      });
    });

    return card;
  }

  // undo handled by undoManager

  function render() {
    heroesList.innerHTML = "";

    if (!book.heroes.length) {
      heroesList.innerHTML = `<p style="color:#64748b;">Добавь персонажа — карточки появятся здесь.</p>`;
      return;
    }

    book.heroes.forEach((hero, index) => {
      const card = createHeroCard(hero, index);
      heroesList.appendChild(card);
      
      // If hero was saved as summary view, show compact version immediately
      if (hero.isSummaryView) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'hero-summary-card';
        const h = hero;
        summaryCard.innerHTML = `
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <img src="${h.photo||''}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;border:1px solid var(--color-border);flex-shrink:0;background-color:var(--color-bg-tertiary);" alt="${h.name||'Персонаж'}" />
            <div style="flex:1">
              <h3 style="margin:0;font-size:1.05rem">${h.name||'Без имени'}</h3>
              <div style="color:var(--color-text-secondary);margin-top:6px">${h.role||''}${h.age?(', '+h.age):''}</div>
              <div style="margin-top:8px;color:var(--color-text-tertiary);font-size:0.95rem">${(h.traits||[]).slice(0,5).join(', ')}</div>
              <div style="margin-top:8px;color:var(--color-text-secondary);font-size:0.95rem">Глаза: ${h.eyes||'—'} · Волосы: ${h.hair_color||'—'}${h.hair_structure?(' · '+(h.hair_structure==='straight'?'прямые':h.hair_structure==='wavy'?'волнистые':h.hair_structure==='curly'?'кудрявые':'плотные/кудрявые')):''}</div>
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
            <button class="quick-btn edit-hero-btn" type="button">Редактировать</button>
            <button class="delete-hero-btn delete-btn" type="button">Удалить</button>
          </div>
        `;
        // apply subtle color based on sliders
        applyCardStyle(h, summaryCard);
        
        const editBtn = summaryCard.querySelector('.edit-hero-btn');
        const delBtn = summaryCard.querySelector('.delete-hero-btn');
        
        editBtn.addEventListener('click', () => {
          book.heroes[index].isSummaryView = false;
          save();
          const newCard = createHeroCard(book.heroes[index] || {}, index);
          summaryCard.parentNode.replaceChild(newCard, summaryCard);
        });
        
        delBtn.addEventListener('click', () => {
          const deleted = book.heroes[index];
          const delIndex = index;
          book.heroes.splice(index, 1);
          save();
          render();
          window.undoManager.register('Персонаж удалён', () => {
            book.heroes.splice(delIndex, 0, deleted);
            save();
            render();
          });
        });
        
        card.parentNode.replaceChild(summaryCard, card);
      }
    });
  }

  addHeroBtn.addEventListener("click", () => {
    book.heroes.push({ 
      name: "", 
      age: "", 
      role: "", 
      eyes: "",
      hair_color: "",
      hair_structure: "",
      sliders: { introextro:50, optimistPessimist:50, closedOpen:50, impulseControl:50, distrustTrust:50, avoidDirect:50, calmDramatic:50, jokerSerious:50, dependentIndependent:50 },
      relations_close: "", 
      relations_complex: "", 
      relations_neutral: "", 
      traits: [], 
      photo: "",
      isSummaryView: false
    });
    save();
    render();
  });

  clearHeroesBtn.addEventListener("click", () => {
    book.heroes = [];
    save();
    render();
  });

  render();
});

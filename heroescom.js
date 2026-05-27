document.addEventListener('DOMContentLoaded', () => {
  const idx = Number(localStorage.getItem('currentBookGraph'));
  const books = JSON.parse(localStorage.getItem('books')) || [];
  if (isNaN(idx) || !books[idx]) { window.location.href = 'books.html'; return; }
  const book = books[idx];

  const relSource = document.getElementById('relSource');
  const relTarget = document.getElementById('relTarget');
  const relType = document.getElementById('relType');
  const relStrength = document.getElementById('relStrength');
  const relChapter = document.getElementById('relChapter');
  const addRelBtn = document.getElementById('addRelBtn');
  const relPreview = document.getElementById('relPreview');

  book.heroes = book.heroes || [];
  book.relations = book.relations || [];

  function save() { books[idx] = book; localStorage.setItem('books', JSON.stringify(books)); }

  // build nodes helper
  function makeNode(h, i) {
    return { id: i, label: h.name || `Персонаж ${i+1}`, title: h.role || '', image: h.photo || null, shape: h.photo ? 'circularImage' : 'ellipse' };
  }

  // derive edges from stored relations OR from parsing relations_* fields
  function buildEdges() {
    const edges = [];
    // from explicit stored relations
    (book.relations || []).forEach((r, i) => {
      edges.push({ id: 'r'+i, from: r.from, to: r.to, color: relationColor(r.type), width: Math.max(1, (r.strength||3)), title: r.type + (r.chapter? (' (гл.'+r.chapter+')') : ''), chapter: r.chapter || 'all' });
    });

    // parse textual relations as fallback
    book.heroes.forEach((h, i) => {
      [['relations_close','friend'], ['relations_complex','neutral'], ['relations_neutral','neutral']].forEach(([field, type]) => {
        const txt = (h[field] || '').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
        txt.forEach((name) => {
          const target = book.heroes.findIndex(x => (x.name||'').toLowerCase() === name.toLowerCase());
          if (target >=0) {
            const id = `p-${i}-${target}-${field}`;
            if (!edges.find(e=>e.from===i && e.to===target && e.id===id)) {
              edges.push({ id, from: i, to: target, color: relationColor(type), width: 2, title: type, chapter: 'all' });
            }
          }
        });
      });
    });

    return edges;
  }

  function relationColor(type) {
    switch(type) {
      case 'friend': return '#10b981';
      case 'love': return '#ec4899';
      case 'enemy': return '#ef4444';
      case 'family': return '#3b82f6';
      default: return '#94a3b8';
    }
  }

    // draw small preview showing two photos connected by a colored line
    function createRelationPreview(fromIdx, toIdx, type, strength) {
      relPreview.innerHTML = '';
      const w = 300, h = 110;
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-bg-primary') || '#fff';
      ctx.fillRect(0,0,w,h);

      const fromHero = book.heroes[fromIdx] || {};
      const toHero = book.heroes[toIdx] || {};
      const imgA = new Image(); const imgB = new Image();
      imgA.crossOrigin = imgB.crossOrigin = 'anonymous';
      let loaded = 0;
      function maybeRender(){
        loaded++; if (loaded < 2) return;
        // draw avatars as circles
        const ax = 40, ay = h/2, ar = 32;
        const bx = w-40, by = h/2, br = 32;
        // line
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.strokeStyle = relationColor(type); ctx.lineWidth = Math.max(2, (strength||3)); ctx.stroke();
        // draw circle A
        ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI*2); ctx.closePath(); ctx.clip();
        if (imgA.width) ctx.drawImage(imgA, ax-ar, ay-ar, ar*2, ar*2); else { ctx.fillStyle='#e2e8f0'; ctx.fillRect(ax-ar, ay-ar, ar*2, ar*2); }
        ctx.restore();
        // draw circle B
        ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.closePath(); ctx.clip();
        if (imgB.width) ctx.drawImage(imgB, bx-br, by-br, br*2, br*2); else { ctx.fillStyle='#e2e8f0'; ctx.fillRect(bx-br, by-br, br*2, br*2); }
        ctx.restore();
        // labels
        ctx.fillStyle = '#0f172a'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText(fromHero.name||('Персонаж '+(fromIdx+1)), ax, ay+ar+14);
        ctx.fillText(toHero.name||('Персонаж '+(toIdx+1)), bx, by+br+14);
        relPreview.appendChild(canvas);
      }
      imgA.onload = maybeRender; imgB.onload = maybeRender;
      // set src (prefer saved small card if exists)
      imgA.src = (fromHero.card || fromHero.photo) || '';
      imgB.src = (toHero.card || toHero.photo) || '';
      // if no src, trigger render twice to draw placeholders
      if (!imgA.src) { imgA.width = 0; maybeRender(); }
      if (!imgB.src) { imgB.width = 0; maybeRender(); }
    }

  // populate selectors
  function populateSelectors() {
    relSource.innerHTML = '';
    relTarget.innerHTML = '';
    book.heroes.forEach((h,i)=>{
      const opt = document.createElement('option'); opt.value = i; opt.textContent = h.name || `Персонаж ${i+1}`;
      relSource.appendChild(opt.cloneNode(true)); relTarget.appendChild(opt);
    });
  }

  populateSelectors();

  // network
  const container = document.getElementById('network');
  let data = { nodes: new vis.DataSet(book.heroes.map(makeNode)), edges: new vis.DataSet(buildEdges()) };
  const options = { physics: { stabilization:false }, edges: { smooth:false, color: {inherit:false} }, interaction: { hover:true } };
  const network = new vis.Network(container, data, options);

  // update nodes & selectors when heroes change (sync)
  function refreshNodes() {
    const newNodes = book.heroes.map(makeNode);
    data.nodes.clear();
    data.nodes.add(newNodes);
    populateSelectors();
  }

  // listen for localStorage changes (other tabs/windows)
  window.addEventListener('storage', (e) => {
    if (e.key === 'books') {
      try {
        const all = JSON.parse(e.newValue || '[]');
        if (Array.isArray(all) && all[idx]) {
          // update local book reference
          book.heroes = all[idx].heroes || [];
          book.relations = all[idx].relations || [];
          refreshNodes();
          refreshEdges();
        }
      } catch (err) { /* ignore parse errors */ }
    }
  });

  // hover highlight
  const originalEdges = {};
  network.on('hoverNode', params => {
    const nodeId = params.node;
    const connected = network.getConnectedEdges(nodeId);
    connected.forEach(eid => {
      const e = data.edges.get(eid);
      if (e) {
        originalEdges[eid] = { color: e.color, width: e.width };
        data.edges.update({ id: eid, color: { color: '#ffd54f' }, width: Math.min(8, (e.width||2)+3) });
      }
    });
  });

  network.on('blurNode', params => {
    Object.keys(originalEdges).forEach(eid => {
      const orig = originalEdges[eid];
      data.edges.update({ id: eid, color: orig.color, width: orig.width });
    });
    for (const k in originalEdges) delete originalEdges[k];
  });

  function deleteRelationById(edgeId) {
    if (!edgeId) return;
    if (edgeId.startsWith('r')) {
      const relIndex = Number(edgeId.slice(1));
      const deleted = book.relations[relIndex];
      if (!deleted) return;
      const fromName = book.heroes[deleted.from]?.name || `Персонаж ${deleted.from + 1}`;
      const toName = book.heroes[deleted.to]?.name || `Персонаж ${deleted.to + 1}`;
      if (!confirm(`Удалить связь "${deleted.type}" между ${fromName} и ${toName}?`)) return;
      book.relations.splice(relIndex, 1);
      save();
      refreshEdges();
      populateSelectors();
      window.undoManager.register('Связь удалена', () => {
        book.relations.splice(relIndex, 0, deleted);
        save();
        refreshEdges();
        populateSelectors();
      });
      return;
    }

    if (edgeId.startsWith('p-')) {
      const parts = edgeId.split('-');
      const from = Number(parts[1]);
      const to = Number(parts[2]);
      const field = parts.slice(3).join('-');
      const source = book.heroes[from];
      const targetName = book.heroes[to]?.name || '';
      if (!source || !targetName) return;
      const originalValue = source[field] || '';
      const entries = originalValue.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      if (!entries.length) return;
      const candidate = entries.find(n => n.toLowerCase() === targetName.toLowerCase()) || entries[0];
      if (!confirm(`Удалить связь "${candidate}" из поля ${field.replace('relations_','')}?`)) return;
      source[field] = entries.filter(n => n.toLowerCase() !== candidate.toLowerCase()).join(', ');
      save();
      refreshEdges();
      populateSelectors();
      window.undoManager.register('Связь удалена', () => {
        source[field] = originalValue;
        save();
        refreshEdges();
        populateSelectors();
      });
    }
  }

  network.on('click', params => {
    if (params.edges && params.edges.length) {
      deleteRelationById(params.edges[0]);
    }
  });

  function refreshEdges() {
    data.edges.clear();
    data.edges.add(buildEdges());
  }

  addRelBtn.addEventListener('click', () => {
    const from = Number(relSource.value);
    const to = Number(relTarget.value);
    if (isNaN(from) || isNaN(to) || from===to) return alert('Выберите двух разных персонажей');
    const type = relType.value;
    const strength = Math.max(1, Math.min(6, Number(relStrength.value)||3));
    const chapterVal = relChapter.value.trim() || null;
    // show preview of the two characters and their connection
    try { createRelationPreview(from, to, type, strength); } catch (err) { console.warn('preview error', err); }
    const rel = { from, to, type, strength, chapter: chapterVal };
    book.relations.push(rel);
    save();
    populateSelectors();
    refreshEdges();
  });

  // initial render
  refreshEdges();
});

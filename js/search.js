/**
 * Paseo Altozano · Busqueda en el mapa (teclado propio para totem, sin teclado del SO)
 *
 * - Tolera acentos, espacios, apostrofes y "&" ("H y M", "carls jr", "wing stop").
 * - Tolera errores de dedo por distancia de edicion ("sefora" -> Sephora).
 * - Al elegir un resultado traza la ruta con showMapView(nodeId), igual que SET_DESTINATION.
 */
(function () {
  const SEARCH_TYPES = ['store', 'anchor_store', 'island', 'restroom', 'service'];
  const MAX_RESULTS = 4;

  const CATEGORY_TEXT = {
    'moda': 'moda ropa calzado zapatos accesorios',
    'departamentales': 'departamental departamentales tienda ancla',
    'tecnologia': 'tecnologia celulares electronica',
    'salud-y-belleza': 'belleza salud cosmeticos optica',
    'agencias': 'autos agencia agencias coches',
    'restaurantes': 'restaurante restaurantes comida comer',
    'comida-y-snacks': 'snacks botanas postres dulces comida',
    'cafeterias-y-helados': 'cafe cafeteria helados postres',
    'entretenimiento': 'entretenimiento diversion juegos cine',
    'casa-y-hogar': 'casa hogar muebles',
    'servicios': 'servicios banco cajero'
  };
  const CATEGORY_LABEL = {
    'moda': 'Moda', 'departamentales': 'Tienda departamental', 'tecnologia': 'Tecnología',
    'salud-y-belleza': 'Belleza y salud', 'agencias': 'Autos', 'restaurantes': 'Restaurante',
    'comida-y-snacks': 'Comida y snacks', 'cafeterias-y-helados': 'Café y helados',
    'entretenimiento': 'Entretenimiento', 'casa-y-hogar': 'Casa y hogar', 'servicios': 'Servicios'
  };
  const SUGGESTIONS = ['Moda', 'Comida', 'Café', 'Belleza', 'Cine'];
  const LEVEL_LABEL = { 1: 'Planta Baja', 2: 'Nivel 1', 3: 'Nivel 2' };

  const KEY_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '&', '⌫']
  ];

  let index = null;
  let query = '';
  let noResultsTimer = null;

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const compact = (s, amp) => norm(s).replace(/&/g, amp).replace(/[^a-z0-9]/g, '');
  const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return Math.max(m, n);
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // mallGraph vive como `let` global de state.js: es visible aqui por nombre, pero no como window.mallGraph
  function getGraph() {
    return typeof mallGraph !== 'undefined' && mallGraph ? mallGraph : window.mallGraph;
  }

  function buildIndex() {
    const graph = getGraph();
    if (index || !graph || !Array.isArray(graph.nodes)) return index;
    index = graph.nodes
      .filter(n => SEARCH_TYPES.includes(n.type) && n.name)
      .map(n => {
        // Los nodos de servicio no tienen locatario: la inferencia por palabras clave los clasifica mal
        const cat = n.type === 'service' ? 'servicios' : ((typeof getNodeTenantCategory === 'function') ? getNodeTenantCategory(n) : 'other');
        const isRestroom = n.type === 'restroom';
        const label = isRestroom ? 'Sanitarios' : (CATEGORY_LABEL[cat] || 'Local');
        const extra = isRestroom ? 'bano banos sanitario sanitarios wc' : (CATEGORY_TEXT[cat] || '');
        return {
          node: n,
          cat,
          label,
          keys: [compact(n.name, 'y'), compact(n.name, '')].filter((k, i, a) => k && a.indexOf(k) === i),
          words: tokens(n.name),
          extra: norm(`${label} ${extra}`)
        };
      });
    return index;
  }

  function score(entry, q) {
    const qy = compact(q, 'y');
    const qn = compact(q, '');
    const qWords = tokens(q);
    if (!qy) return 0;
    let best = 0;

    for (const key of entry.keys) {
      if (key.startsWith(qy) || key.startsWith(qn)) best = Math.max(best, 100 - Math.min(20, key.length - qy.length));
      else if (qy.length >= 2 && (key.includes(qy) || key.includes(qn))) best = Math.max(best, 65);
    }
    if (best < 90 && qWords.length && qWords.every(w => entry.words.some(ew => ew.startsWith(w)))) best = Math.max(best, 90);
    // Categoria y sinonimos ("ropa", "banos"): palabras de 2+ letras, si no "h y m" coincide con "casa y hogar"
    if (best < 75 && qWords.length && qWords.every(w => w.length >= 2 && entry.extra.split(' ').some(ew => ew.startsWith(w)))) best = Math.max(best, 75);

    if (best === 0 && qy.length >= 4) {
      const allowed = Math.floor(qy.length / 3);
      for (const key of entry.keys) {
        const d = Math.min(levenshtein(qy, key), levenshtein(qy, key.slice(0, qy.length)));
        if (d <= allowed) best = Math.max(best, 70 - d * 10);
      }
    }
    return best;
  }

  function search(q) {
    const list = buildIndex() || [];
    if (!q.trim()) {
      return list.filter(e => e.node.type === 'anchor_store')
        .sort((a, b) => a.node.name.localeCompare(b.node.name, 'es'))
        .slice(0, MAX_RESULTS);
    }
    return list
      .map(e => ({ e, s: score(e, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s || a.e.node.name.localeCompare(b.e.node.name, 'es'))
      .filter((r, _, all) => all[0].s < 80 || r.s >= 65)  // con un acierto claro, los "parecidos" estorban
      .slice(0, MAX_RESULTS)
      .map(r => r.e);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderResults() {
    const box = document.getElementById('mm-search-results');
    const field = document.getElementById('mm-search-text');
    const clear = document.getElementById('mm-search-clear');
    if (!box || !field) return;

    field.textContent = query;
    field.classList.toggle('mm-search-placeholder', !query);
    if (!query) field.textContent = 'Buscar tienda o comida';
    if (clear) clear.style.visibility = query ? 'visible' : 'hidden';

    box.textContent = '';
    const results = search(query);

    if (!results.length) {
      box.appendChild(el('p', 'mm-search-empty', `No encontramos «${query}». Prueba con una categoría:`));
      const chips = el('div', 'mm-search-chips');
      SUGGESTIONS.forEach(word => {
        const chip = el('button', 'mm-search-chip', word);
        chip.type = 'button';
        chip.addEventListener('pointerdown', ev => { ev.preventDefault(); setQuery(word); });
        chips.appendChild(chip);
      });
      box.appendChild(chips);
      return;
    }

    if (!query) box.appendChild(el('p', 'mm-search-hint', 'Tiendas ancla'));
    results.forEach(entry => {
      const n = entry.node;
      const row = el('button', 'mm-search-row');
      row.type = 'button';

      const badge = el('span', 'mm-search-badge');
      if (n.logo) {
        const img = document.createElement('img');
        img.src = n.logo;
        img.alt = '';
        img.loading = 'lazy';
        badge.classList.add('mm-search-badge--logo');
        badge.appendChild(img);
      } else {
        const style = (typeof MINIMAL_CATEGORY_STYLE !== 'undefined' && MINIMAL_CATEGORY_STYLE[entry.cat]) || { fill: '#4a5a6a', icon: '#vec-icon-bag' };
        badge.style.background = style.fill;
        badge.innerHTML = `<svg viewBox="-8 -8 16 16" width="30" height="30" aria-hidden="true"><use href="${style.icon}"/></svg>`;
      }

      const text = el('span', 'mm-search-rowtext');
      text.appendChild(el('span', 'mm-search-name', n.name.replace(/\s*\[[^\]]*\]/g, '')));
      text.appendChild(el('span', 'mm-search-meta', `${entry.label} · ${LEVEL_LABEL[n.level] || `Nivel ${n.level}`}`));

      const go = el('span', 'mm-search-go');
      go.innerHTML = '<i class="fa-solid fa-route"></i><span>Cómo llegar</span>';

      row.append(badge, text, go);
      row.addEventListener('click', () => choose(entry));
      box.appendChild(row);
    });
  }

  function choose(entry) {
    const n = entry.node;
    if (window.KioskBridge && typeof window.KioskBridge.notifyMetricsEvent === 'function') {
      window.KioskBridge.notifyMetricsEvent('map_search_select', { query, nodeId: n.id, name: n.name });
    }
    closeSearch();
    if (typeof window.showMapView === 'function') window.showMapView(n.id);
  }

  function setQuery(q) {
    query = q.slice(0, 32);
    renderResults();
    clearTimeout(noResultsTimer);
    if (query.trim().length >= 3 && !search(query).length) {
      const snapshot = query;
      noResultsTimer = setTimeout(() => {
        // Busquedas sin resultado: dato para leasing (que marcas pide la gente y no estan)
        if (snapshot === query && window.KioskBridge && typeof window.KioskBridge.notifyMetricsEvent === 'function') {
          window.KioskBridge.notifyMetricsEvent('map_search_no_results', { query: snapshot });
        }
      }, 1500);
    }
  }

  function buildKeyboard() {
    const kb = document.getElementById('mm-search-keyboard');
    if (!kb || kb.childElementCount) return;
    KEY_ROWS.forEach(row => {
      const r = el('div', 'mm-key-row');
      row.forEach(k => {
        const b = el('button', k === '⌫' ? 'mm-key mm-key--wide' : 'mm-key', k === '⌫' ? '' : k);
        b.type = 'button';
        if (k === '⌫') b.innerHTML = '<i class="fa-solid fa-delete-left"></i>';
        b.setAttribute('aria-label', k === '⌫' ? 'Borrar' : k);
        // pointerdown: el toque responde al instante y no roba foco
        b.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          setQuery(k === '⌫' ? query.slice(0, -1) : query + k);
        });
        r.appendChild(b);
      });
      kb.appendChild(r);
    });
    const last = el('div', 'mm-key-row');
    const space = el('button', 'mm-key mm-key--space', 'espacio');
    space.type = 'button';
    space.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (query && !query.endsWith(' ')) setQuery(query + ' ');
    });
    last.appendChild(space);
    kb.appendChild(last);
  }

  function openSearch() {
    const sheet = document.getElementById('mm-search-sheet');
    if (!sheet) return;
    buildIndex();
    buildKeyboard();
    sheet.classList.add('mm-search--open');
    setQuery('');
  }

  function closeSearch() {
    const sheet = document.getElementById('mm-search-sheet');
    if (sheet) sheet.classList.remove('mm-search--open');
    clearTimeout(noResultsTimer);
  }

  // Categoria, nivel e icono de un nodo para la ficha que se abre al tocarlo en el mapa
  function describe(n) {
    let cat = n.type === 'service' ? 'servicios' : (typeof getNodeTenantCategory === 'function' ? getNodeTenantCategory(n) : 'other');
    let label = CATEGORY_LABEL[cat] || 'Local';
    let icon = null;
    let fill = '#4a5a6a';
    if (n.type === 'portal_escalator') { label = 'Escaleras eléctricas'; icon = '#vec-icon-stairs'; fill = '#0891b2'; }
    else if (n.type === 'portal_elevator') { label = 'Elevador'; icon = '#vec-icon-elevator'; fill = '#2563eb'; }
    else if (n.type === 'restroom') { label = 'Sanitarios'; icon = '#vec-icon-restroom'; fill = '#eab308'; }
    else if (typeof MINIMAL_CATEGORY_STYLE !== 'undefined' && MINIMAL_CATEGORY_STYLE[cat]) {
      icon = MINIMAL_CATEGORY_STYLE[cat].icon;
      fill = MINIMAL_CATEGORY_STYLE[cat].fill;
    }
    return { label, icon, fill, cat };
  }

  window.MapSearch = { open: openSearch, close: closeSearch, search, setQuery, describe };
  window.openMapSearch = openSearch;
  window.closeMapSearch = closeSearch;
  window.clearMapSearch = () => setQuery('');
})();

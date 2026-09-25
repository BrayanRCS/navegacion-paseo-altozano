/**
 * Paseo Altozano · Estudio del grafo (edicion visual de nodos y aristas)
 *
 * Reutiliza la logica de editor.js (arrastrar, enlazar, crear, gemelos, exportar) y le agrega:
 * deshacer/rehacer, ajuste fino de posicion (X/Y y flechas), verificacion de rutas y guardado a archivo.
 *
 * Solo se ofrece con ?studio=1 en la URL: el totem nunca muestra este modo.
 * Los cambios se guardan en el navegador (localStorage); para hacerlos permanentes se exporta mall_graph.json.
 */
(function () {
  const ENABLED = new URLSearchParams(window.location.search).get('studio') === '1';
  const DEST_TYPES = ['store', 'anchor_store', 'island'];
  const LONG_EDGE_UNITS = 140;

  const hist = { stack: [], idx: -1, lock: false };
  let baseline = null;
  let nudgeTimer = null;

  const $ = id => document.getElementById(id);
  const inStudio = () => document.body.classList.contains('studio-active');
  const snap = () => JSON.stringify({ nodes: mallGraph.nodes, edges: mallGraph.edges });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const levelLabel = lvl => ({ 1: 'PB', 2: 'N1', 3: 'N2' }[lvl] || `N${lvl}`);
  const spec = () => (typeof FLOOR_SPECS !== 'undefined' && FLOOR_SPECS[currentLevel]) || { width: 1536, height: 718 };

  function setStatus(msg) {
    const el = $('editor-hud-title');
    if (el) el.textContent = msg;
  }

  // ---------- historial ----------
  const originalSave = window.saveCustomGraphToStorage;

  function pushHistory() {
    if (hist.lock || !mallGraph) return;
    const s = snap();
    if (hist.stack[hist.idx] === s) return;
    hist.stack = hist.stack.slice(0, hist.idx + 1);
    hist.stack.push(s);
    if (hist.stack.length > 100) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    updateUi();
  }

  // Cada confirmacion de cambio del editor (soltar un nodo, enlazar, crear, borrar...) pasa por aqui
  window.saveCustomGraphToStorage = function () {
    originalSave.apply(this, arguments);
    if (inStudio()) pushHistory();
  };

  function restore(s) {
    const data = JSON.parse(s);
    hist.lock = true;
    mallGraph.nodes = data.nodes;
    mallGraph.edges = data.edges;
    originalSave();
    hist.lock = false;
    if (selectedEditorNodeId && !mallGraph.nodes.some(n => n.id === selectedEditorNodeId)) {
      selectedEditorNodeId = null;
      AltozanoState.selectedEditorNodeId = null;
    }
    editorConnectSourceNodeId = null;
    AltozanoState.editorConnectSourceNodeId = null;
    renderMapOverlay();
    updateUi();
  }

  window.studioUndo = function () {
    if (hist.idx <= 0) return;
    hist.idx--;
    restore(hist.stack[hist.idx]);
    setStatus('Deshecho');
  };

  window.studioRedo = function () {
    if (hist.idx >= hist.stack.length - 1) return;
    hist.idx++;
    restore(hist.stack[hist.idx]);
    setStatus('Rehecho');
  };

  // ---------- interfaz ----------
  function updateUi() {
    if (!mallGraph) return;
    const counts = $('studio-counts');
    if (counts) counts.textContent = `${mallGraph.nodes.length} nodos · ${Math.round(mallGraph.edges.length / 2)} conexiones`;
    const undo = $('studio-undo');
    const redo = $('studio-redo');
    if (undo) undo.disabled = hist.idx <= 0;
    if (redo) redo.disabled = hist.idx >= hist.stack.length - 1;
    const dirty = $('studio-dirty');
    if (dirty) dirty.classList.toggle('hidden', baseline === null || snap() === baseline);
    const custom = $('studio-custom');
    if (custom) {
      let saved = false;
      try { saved = !!localStorage.getItem('altozano_custom_mall_graph'); } catch (e) { /* sin almacenamiento */ }
      custom.classList.toggle('hidden', !saved);
    }
  }

  window.studioSyncInspector = function (node, pos) {
    const x = $('editor-node-x-input');
    const y = $('editor-node-y-input');
    const lvl = $('editor-node-level-select');
    if (x && document.activeElement !== x) x.value = pos.x;
    if (y && document.activeElement !== y) y.value = pos.y;
    if (lvl && node && document.activeElement !== lvl) lvl.value = String(node.level);
    const del = $('studio-delete');
    if (del) del.disabled = !node;
    const totemBox = $('editor-totem-container');
    if (totemBox) {
      const isTotem = !!node && node.type === 'totem';
      totemBox.classList.toggle('hidden', !isTotem);
      if (isTotem) {
        const dev = $('editor-node-device-input');
        if (dev && document.activeElement !== dev) dev.value = totemDeviceId(node);
        const active = node.id === TOTEM_NODE_ID;
        const status = $('editor-totem-status');
        if (status) status.textContent = active ? '★ Punto de partida activo' : `?totem=${totemDeviceId(node)}`;
        const useBtn = $('editor-totem-active-btn');
        if (useBtn) useBtn.disabled = active;
      }
    }
    updateUi();
  };

  window.studioChangeNodeLevel = function (newLevel) {
    if (!selectedEditorNodeId || !mallGraph) return;
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
    if (!node || node.level === newLevel) return;

    // Desconectar aristas que conectaban con nodos del piso anterior si no son portales
    mallGraph.edges = mallGraph.edges.filter(e => {
      if (e.from === node.id || e.to === node.id) {
        const otherId = e.from === node.id ? e.to : e.from;
        const other = mallGraph.nodes.find(n => n.id === otherId);
        return other && other.level === newLevel;
      }
      return true;
    });

    node.level = newLevel;
    window.saveCustomGraphToStorage();
    if (typeof buildFloorSubgraphs === 'function') buildFloorSubgraphs();

    // Cambiar la vista de la cámara automáticamente al nuevo piso
    if (typeof switchLevel === 'function') switchLevel(newLevel, false);
    renderMapOverlay();
    const lvlName = { 1: 'PB', 2: 'Nivel 1', 3: 'Nivel 2' }[newLevel] || `Nivel ${newLevel}`;
    updateEditorHudInfo(node, node.coordinates, `📍 "${node.name}" trasladado a ${lvlName}`);
  };

  window.studioApplyXY = function () {
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
    if (!node) return;
    const s = spec();
    const x = clamp(Math.round(+$('editor-node-x-input').value), 0, s.width);
    const y = clamp(Math.round(+$('editor-node-y-input').value), 0, s.height);
    if (!isFinite(x) || !isFinite(y)) return;
    node.coordinates.x = x;
    node.coordinates.y = y;
    window.saveCustomGraphToStorage();
    renderMapOverlay();
    updateEditorHudInfo(node, node.coordinates);
  };

  // ---------- arrastre y conversion de coordenadas ----------
  // Con la matriz real del SVG: incluye zoom, desplazamiento y el giro del modo vertical
  window.screenToSvgCoordinates = function (screenX, screenY) {
    const svg = $('map-svg-overlay');
    const container = $('map-container');
    const ctm = svg && svg.getScreenCTM();
    if (!ctm || !container) return { x: 0, y: 0 };
    const box = container.getBoundingClientRect();
    const pt = svg.createSVGPoint();
    pt.x = screenX + box.left;
    pt.y = screenY + box.top;
    const p = pt.matrixTransform(ctm.inverse());
    const s = spec();
    return { x: clamp(Math.round(p.x), 0, s.width), y: clamp(Math.round(p.y), 0, s.height) };
  };

  // Movimiento en vivo: desplaza el grupo del nodo respecto a donde nacio (sin duplicar su traslacion)
  window.updateLiveNodeAndEdgesSvg = function (node, posX, posY) {
    const g = document.querySelector(`#svg-nodes-layer g[data-graph-node-id="${node.id}"]`);
    if (g) {
      const hit = g.querySelector('circle');
      if (g.__ox === undefined && hit) {
        g.__ox = +hit.getAttribute('cx');
        g.__oy = +hit.getAttribute('cy');
        g.__base = g.getAttribute('transform') || '';
      }
      if (g.__ox !== undefined) {
        g.setAttribute('transform', `translate(${posX - g.__ox} ${posY - g.__oy}) ${g.__base}`.trim());
      }
    }
    const edgesLayer = $('svg-edges-layer');
    if (edgesLayer) {
      edgesLayer.querySelectorAll(`[data-edge-u="${node.id}"], [data-edge-v="${node.id}"]`).forEach(line => {
        if (line.getAttribute('data-edge-u') === node.id) { line.setAttribute('x1', posX); line.setAttribute('y1', posY); }
        if (line.getAttribute('data-edge-v') === node.id) { line.setAttribute('x2', posX); line.setAttribute('y2', posY); }
      });
    }
  };

  // ---------- herramientas ----------
  window.toggleConnectMode = function () {
    isConnectMode = !isConnectMode;
    AltozanoState.isConnectMode = isConnectMode;
    const btn = $('btn-editor-connect-mode');
    if (btn) btn.classList.toggle('mm-sbtn--on', isConnectMode);
    if (!isConnectMode) {
      editorConnectSourceNodeId = null;
      AltozanoState.editorConnectSourceNodeId = null;
    }
    setStatus(isConnectMode
      ? 'Enlazar: toca un nodo y luego otro para unirlos (o separarlos si ya lo estaban)'
      : 'Enlazar desactivado');
    renderMapOverlay();
  };

  // Los nodos nuevos nacen en el centro de lo que se ve, no en el centro del plano
  function viewCenter() {
    const c = $('map-container');
    return window.screenToSvgCoordinates(c.clientWidth / 2, c.clientHeight / 2);
  }
  window.createNewWaypointAtCenter = () => { const p = viewCenter(); createNewWaypoint(p.x, p.y); };
  window.createNewRestroomAtCenter = () => { const p = viewCenter(); createNewRestroom(p.x, p.y); };
  window.createNewElevatorAtCenter = () => { const p = viewCenter(); createNewElevator(p.x, p.y); };
  window.createNewEscalatorAtCenter = () => { const p = viewCenter(); createNewEscalator(p.x, p.y); };

  // ---------- totems ----------
  function uniqueDevice(base, exceptId) {
    const root = slugifyTotem(base) || 'totem';
    let candidate = root;
    let i = 2;
    while (getTotems().some(t => t.id !== exceptId && totemDeviceId(t) === candidate)) candidate = `${root}-${i++}`;
    return candidate;
  }

  window.createNewTotemAtCenter = function () {
    const p = viewCenter();
    let name = 'Nuevo';
    let i = 2;
    while (getTotems().some(t => slugifyTotem(totemDisplayName(t)) === slugifyTotem(name))) name = `Nuevo ${i++}`;
    const node = {
      id: `n_totem_${Date.now().toString(36)}`,
      level: currentLevel,
      type: 'totem',
      name,
      device: uniqueDevice(name),
      coordinates: { x: p.x, y: p.y }
    };
    mallGraph.nodes.push(node);
    window.saveCustomGraphToStorage();
    selectedEditorNodeId = node.id;
    AltozanoState.selectedEditorNodeId = node.id;
    renderMapOverlay();
    updateEditorHudInfo(node, node.coordinates, '📍 Tótem nuevo: ponle nombre, conéctalo a un pasillo con «Enlazar» y elige su identificador');
  };

  window.studioSetDevice = function (value) {
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId && n.type === 'totem');
    if (!node) return;
    const input = $('editor-node-device-input');
    const slug = slugifyTotem(value);
    if (!slug) {
      setStatus('El identificador no puede quedar vacío');
      if (input) input.value = totemDeviceId(node);
      return;
    }
    const clash = getTotems().find(t => t.id !== node.id && totemDeviceId(t) === slug);
    if (clash) {
      setStatus(`«${slug}» ya lo usa el tótem ${totemDisplayName(clash)}`);
      if (input) input.value = totemDeviceId(node);
      return;
    }
    node.device = slug;
    window.saveCustomGraphToStorage();
    updateEditorHudInfo(node, node.coordinates, `Identificador del tótem: ?totem=${slug}`);
  };

  // Marca este tótem como el punto de partida con el que se ve y se prueba el mapa
  window.studioUseAsStart = function () {
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId && n.type === 'totem');
    if (!node) return;
    setActiveTotemId(node.id, false);
    const url = new URL(window.location.href);
    url.searchParams.set('totem', totemDeviceId(node));
    history.replaceState(null, '', url);
    renderMapOverlay();
    updateEditorHudInfo(node, node.coordinates, `★ ${totemDisplayName(node)} es ahora el punto de partida`);
  };

  // Al renombrar un tótem, la etiqueta del mapa y las listas de origen siguen al nombre
  const originalRename = window.handleSelectedNodeNameChange;
  window.handleSelectedNodeNameChange = function () {
    originalRename.apply(this, arguments);
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
    if (node && node.type === 'totem') {
      applyTotemLabels();
      renderMapOverlay();
    }
  };

  // El mapa necesita al menos un tótem; si se borra el activo, pasa a ser el primero que quede
  const originalDelete = window.deleteSelectedNode;
  window.deleteSelectedNode = function () {
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
    if (node && node.type === 'totem' && getTotems().length <= 1) {
      setStatus('No se puede eliminar el único tótem: el mapa necesita al menos un punto de partida');
      return;
    }
    const wasActive = !!node && node.id === TOTEM_NODE_ID;
    originalDelete.apply(this, arguments);
    if (wasActive && !mallGraph.nodes.some(n => n.id === node.id) && getTotems().length) setActiveTotemId(getTotems()[0].id, false);
  };

  // ---------- entrar y salir ----------
  window.studioToggle = function () {
    if (!mallGraph) return;
    if (!isEditorMode) {
      document.body.classList.add('studio-active');
      if (typeof closeNodePopup === 'function') closeNodePopup();
      if (typeof closeMapSearch === 'function') closeMapSearch();
      if (typeof filterMapCategory === 'function') filterMapCategory('all');
      setEditorSubMode('graph');
      toggleEditorMode();
      hist.stack = [];
      hist.idx = -1;
      pushHistory();
      baseline = snap();
      updateUi();
      setStatus('Arrastra un nodo para moverlo. Doble clic en el mapa crea un nodo nuevo.');
      if (typeof zoomToOverview === 'function') zoomToOverview(true);
    } else {
      toggleEditorMode();
      document.body.classList.remove('studio-active');
      selectedEditorNodeId = null;
      AltozanoState.selectedEditorNodeId = null;
      renderMapOverlay();
    }
  };

  // ---------- exportar ----------
  function exportJson() {
    return JSON.stringify({
      mall: mallGraph.mall || 'Paseo Altozano',
      total_nodes: mallGraph.nodes.length,
      total_edges: mallGraph.edges.length,
      nodes: mallGraph.nodes,
      edges: mallGraph.edges
    }, null, 2);
  }

  const originalDownload = window.downloadMallGraphJsonFile;
  window.downloadMallGraphJsonFile = function () {
    originalDownload();
    baseline = snap();
    updateUi();
  };

  // Con Chrome/Edge se elige el archivo destino y se escribe directo; si no, se descarga
  window.studioSaveToFile = async function () {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'mall_graph.json',
          types: [{ description: 'Grafo del mapa (JSON)', accept: { 'application/json': ['.json'] } }]
        });
        const w = await handle.createWritable();
        await w.write(exportJson());
        await w.close();
        baseline = snap();
        updateUi();
        setStatus(`💾 Guardado en ${handle.name}`);
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    window.downloadMallGraphJsonFile();
    setStatus('💾 Se descargo mall_graph.json');
  };

  // ---------- verificacion ----------
  function findIssues() {
    const nodes = mallGraph.nodes;
    const edges = mallGraph.edges;
    const byId = new Map(nodes.map(n => [n.id, n]));
    const degree = new Map();
    edges.forEach(e => {
      degree.set(e.from, (degree.get(e.from) || 0) + 1);
      degree.set(e.to, (degree.get(e.to) || 0) + 1);
    });

    const issues = { unreachable: [], noEdges: [], orphans: [], twin: [], long: [], broken: [], totem: [] };

    const totems = nodes.filter(n => n.type === 'totem');
    const dests = nodes.filter(n => DEST_TYPES.includes(n.type));
    if (!totems.length) issues.totem.push({ id: null, text: 'No hay ningún tótem: el mapa necesita al menos un punto de partida' });
    const seenDevice = new Map();
    totems.forEach(t => {
      const device = totemDeviceId(t);
      if (seenDevice.has(device)) issues.totem.push({ id: t.id, text: `El identificador «${device}» está repetido en ${totemDisplayName(seenDevice.get(device))} y ${totemDisplayName(t)}` });
      else seenDevice.set(device, t);
      if (!(degree.get(t.id) > 0)) issues.totem.push({ id: t.id, text: `Tótem ${totemDisplayName(t)} · ${levelLabel(t.level)} sin conexión a un pasillo (el mapa lo une al punto más cercano)` });
      dests.forEach(n => {
        let ok = false;
        try {
          const r = calculateMultiFloorRoute(t.id, n.id);
          ok = Array.isArray(r) && r.length > 0 && r.every(s => s.path && s.path.length > 0);
        } catch (e) { ok = false; }
        if (!ok) issues.unreachable.push({ id: n.id, text: `${n.name} · ${levelLabel(n.level)}${totems.length > 1 ? ` · desde ${totemDisplayName(t)}` : ''}` });
      });
    });
    dests.forEach(n => {
      if (!(degree.get(n.id) > 0)) issues.noEdges.push({ id: n.id, text: `${n.name} · ${levelLabel(n.level)}` });
    });

    nodes.filter(n => (n.type === 'corridor_waypoint') && !(degree.get(n.id) > 0))
      .forEach(n => issues.orphans.push({ id: n.id, text: `${n.name || n.id} · ${levelLabel(n.level)}` }));

    const groups = new Map();
    nodes.filter(n => n.type && n.type.startsWith('portal_')).forEach(n => {
      const code = (n.twin_code || '').trim().toUpperCase();
      if (!code) { issues.twin.push({ id: n.id, text: `${n.name} · ${levelLabel(n.level)} · sin código gemelo` }); return; }
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code).push(n);
    });
    groups.forEach((list, code) => {
      const levels = new Set(list.map(n => n.level));
      if (levels.size < 2) issues.twin.push({ id: list[0].id, text: `[${code}] solo existe en ${levelLabel(list[0].level)}: falta su gemela en otro nivel` });
    });

    const seen = new Set();
    edges.forEach(e => {
      const u = byId.get(e.from);
      const v = byId.get(e.to);
      if (!u || !v) { issues.broken.push({ id: (u || v || {}).id, text: `Arista con nodo inexistente: ${e.from} → ${e.to}` }); return; }
      if (e.from === e.to) { issues.broken.push({ id: u.id, text: `Arista consigo mismo: ${u.name || u.id}` }); return; }
      const key = [e.from, e.to].sort().join('|');
      if (seen.has(key)) return;
      seen.add(key);
      if (u.level === v.level) {
        const d = Math.hypot(u.coordinates.x - v.coordinates.x, u.coordinates.y - v.coordinates.y);
        if (d > LONG_EDGE_UNITS) {
          issues.long.push({ id: u.id, text: `${u.name || u.id} ↔ ${v.name || v.id} · ${levelLabel(u.level)} · ${Math.round(d * 0.28)} m` });
        }
      }
    });
    return issues;
  }

  window.studioVerify = function () {
    const issues = findIssues();
    const sections = [
      ['unreachable', 'Locales a los que no llega una ruta desde un tótem', 'Es lo más grave: un visitante no podría llegar.'],
      ['noEdges', 'Locales sin ninguna arista', 'El mapa los enlaza solo al pasillo más cercano; conviene conectarlos a mano.'],
      ['twin', 'Escaleras y elevadores con código gemelo incompleto', 'Sin gemela en otro nivel, la ruta nunca cruza por ahí.'],
      ['orphans', 'Puntos de pasillo sin aristas', 'Nodos sueltos: se pueden limpiar con «Limpiar huérfanos».'],
      ['long', `Aristas muy largas (más de ${Math.round(LONG_EDGE_UNITS * 0.28)} m)`, 'Pueden atravesar paredes; revisa si son correctas.'],
      ['broken', 'Aristas rotas', 'Apuntan a nodos que no existen o a sí mismas.'],
      ['totem', 'Tótems por revisar', 'Cada tótem necesita un identificador único y al menos una conexión a un pasillo.']
    ];
    const total = sections.reduce((n, [k]) => n + issues[k].length, 0);
    const box = $('studio-report-body');
    box.textContent = '';
    const head = document.createElement('p');
    head.className = total ? 'mm-report-summary mm-report-summary--warn' : 'mm-report-summary mm-report-summary--ok';
    head.textContent = total
      ? `Se encontraron ${total} puntos por revisar.`
      : '✅ Todo en orden: cada local tiene ruta desde el tótem y no hay aristas raras.';
    box.appendChild(head);
    sections.forEach(([key, title, hint]) => {
      const list = issues[key];
      if (!list.length) return;
      const h = document.createElement('h4');
      h.textContent = `${title} (${list.length})`;
      const p = document.createElement('p');
      p.className = 'mm-report-hint';
      p.textContent = hint;
      box.append(h, p);
      list.slice(0, 40).forEach(item => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mm-report-item';
        b.textContent = item.text;
        if (item.id) b.addEventListener('click', () => window.studioFocusNode(item.id));
        box.appendChild(b);
      });
      if (list.length > 40) {
        const more = document.createElement('p');
        more.className = 'mm-report-hint';
        more.textContent = `… y ${list.length - 40} más`;
        box.appendChild(more);
      }
    });
    $('studio-report').classList.remove('hidden');
  };

  window.studioCloseReport = function () { $('studio-report').classList.add('hidden'); };

  window.studioFocusNode = function (id) {
    const node = mallGraph.nodes.find(n => n.id === id);
    if (!node) return;
    window.studioCloseReport();
    if (node.level !== currentLevel) switchLevel(node.level, false);
    selectedEditorNodeId = id;
    AltozanoState.selectedEditorNodeId = id;
    renderMapOverlay();
    updateEditorHudInfo(node, node.coordinates);
    if (typeof zoomToCoordinates === 'function') zoomToCoordinates(node.coordinates.x, node.coordinates.y, 2.2, true, 500);
  };

  // ---------- teclado ----------
  function nudge(dx, dy) {
    const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
    if (!node) return;
    const s = spec();
    node.coordinates.x = clamp(node.coordinates.x + dx, 0, s.width);
    node.coordinates.y = clamp(node.coordinates.y + dy, 0, s.height);
    renderMapOverlay();
    updateEditorHudInfo(node, node.coordinates);
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(() => window.saveCustomGraphToStorage(), 450);
  }

  document.addEventListener('keydown', e => {
    if (!inStudio()) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? window.studioRedo() : window.studioUndo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); window.studioRedo(); return; }
    if (typing) return;
    if (e.key === 'Escape') {
      if (isConnectMode) window.toggleConnectMode();
      selectedEditorNodeId = null;
      AltozanoState.selectedEditorNodeId = null;
      renderMapOverlay();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEditorNodeId) { e.preventDefault(); deleteSelectedNode(); return; }
    const step = e.shiftKey ? 5 : 1;
    // En modo vertical el mapa esta girado -90 grados: derecha en pantalla es +y del plano y arriba es +x
    const vertical = isVerticalMode && !document.body.classList.contains('mobile-navigation-mode');
    const moves = vertical
      ? { ArrowRight: [0, step], ArrowLeft: [0, -step], ArrowUp: [step, 0], ArrowDown: [-step, 0] }
      : { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key] && selectedEditorNodeId) {
      e.preventDefault();
      nudge(moves[e.key][0], moves[e.key][1]);
    }
  });

  // ---------- de donde sale el grafo ----------
  // Con ?graph=file o ?studio=1 se muestra una etiqueta que dice si se esta usando el archivo o la copia del navegador
  function showGraphSource() {
    if (!ENABLED) return;
    const param = new URLSearchParams(window.location.search).get('graph');
    const storageKey = typeof getGraphStorageKey === 'function' ? getGraphStorageKey() : 'altozano_custom_mall_graph';
    let custom = false;
    try { custom = !!localStorage.getItem(storageKey); } catch (e) { /* sin almacenamiento */ }
    const fileName = window.currentGraphFileName || 'mall_graph.json';
    const fromFile = param === 'file' || !custom;
    const el = document.createElement('div');
    el.id = 'graph-source-badge';
    el.className = 'mm-graph-badge' + (fromFile ? '' : ' mm-graph-badge--copy');
    el.textContent = `Grafo: ${fromFile ? 'archivo ' + fileName : 'copia guardada en este navegador'} · ${mallGraph.nodes.length} nodos · ${mallGraph.edges.length} aristas`;
    document.body.appendChild(el);
  }

  // ---------- arranque ----------
  {
    const waitForGraph = setInterval(() => {
      if (typeof mallGraph !== 'undefined' && mallGraph && document.querySelector('#svg-nodes-layer g')) {
        clearInterval(waitForGraph);
        showGraphSource();
      }
    }, 500);
  }
  if (ENABLED) {
    const entry = $('studio-entry-btn');
    if (entry) entry.classList.remove('hidden');
    const timer = setInterval(() => {
      if (typeof mallGraph !== 'undefined' && mallGraph && document.querySelector('#svg-nodes-layer g')) {
        clearInterval(timer);
        setTimeout(() => {
          if (typeof showMapView === 'function' && typeof currentKioskView !== 'undefined' && currentKioskView !== 'map') showMapView();
          if (!isEditorMode) window.studioToggle();
        }, 600);
      }
    }, 500);
  }
})();

/**
 * Paseo Altozano · Registro de totems (puntos de partida)
 *
 * Cada nodo type:'totem' del grafo es un totem. Agregar otro no requiere tocar codigo: se crea el nodo en el Estudio.
 *
 *   id      identificador del nodo (n_totem_12)              -> no cambia, lo usa el kiosco
 *   name    nombre visible ("Atlas")                          -> sale en instrucciones y etiquetas
 *   device  identificador corto en URL y mensajes ("atlas")   -> opcional; si falta se deriva del nombre
 *
 * Se elige el totem activo con ?totem=<id|device|nombre> o con el mensaje INIT_TOTEM del kiosco.
 * Sin indicar nada se usa n_totem_12 si existe, o el primero del grafo.
 */
const DEFAULT_TOTEM_ID = 'n_totem_12';

function slugifyTotem(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getTotems() {
  return (typeof mallGraph !== 'undefined' && mallGraph && Array.isArray(mallGraph.nodes))
    ? mallGraph.nodes.filter(n => n.type === 'totem')
    : [];
}

function totemDeviceId(node) {
  return (node && (node.device || slugifyTotem(node.name))) || (node && node.id) || '';
}

// Nombre para mostrar: sin emojis ni "Punto 12" heredados del formato anterior
function totemDisplayName(node) {
  if (!node) return 'Tótem';
  const clean = String(node.name || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/^\s*t[oó]tem\s+/i, '').trim();
  return clean || node.id;
}

// Busca un totem por id de nodo, identificador corto o nombre
function resolveTotem(key) {
  if (!key) return null;
  const raw = String(key).trim();
  const wanted = slugifyTotem(raw);
  const list = getTotems();
  return list.find(n => n.id === raw)
    || list.find(n => totemDeviceId(n) === wanted)
    || list.find(n => slugifyTotem(totemDisplayName(n)) === wanted)
    || null;
}

function getActiveTotem() {
  return resolveTotem(TOTEM_NODE_ID) || resolveTotem(DEFAULT_TOTEM_ID) || getTotems()[0] || null;
}

function getActiveTotemLevel() {
  const t = getActiveTotem();
  return t ? t.level : 2;
}

// Textos fijos ("Punto 12") que ahora siguen al totem activo
function applyTotemLabels() {
  const t = getActiveTotem();
  const name = totemDisplayName(t);
  const lvl = t ? ({ 1: 'PB', 2: 'Nivel 1', 3: 'Nivel 2' }[t.level] || `Nivel ${t.level}`) : '';
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('legend-totem-label', `📍 Tótem ${name}`);
  set('dir-totem-here', `📍 Tótem ${name} · ${lvl}`);
  set('dir-totem-context', t && t.context_element ? `(${t.context_element})` : '');

  // Actualizar etiqueta (Tótem) en los botones de piso del directorio
  const activeLevel = t ? t.level : 2;
  const btnPB = document.getElementById('dir-floor-btn-1');
  const btnN1 = document.getElementById('dir-floor-btn-2');
  const btnN2 = document.getElementById('dir-floor-btn-3');
  if (btnPB) btnPB.textContent = activeLevel === 1 ? '📍 PB (Tótem)' : '🌿 PB';
  if (btnN1) btnN1.textContent = activeLevel === 2 ? '📍 Nivel 1 (Tótem)' : '🌿 Nivel 1';
  if (btnN2) btnN2.textContent = activeLevel === 3 ? '📍 Nivel 2 (Tótem)' : '✨ Nivel 2';

  const sel = document.getElementById('origin-select');
  if (sel) {
    // Un opcion por totem (los agregados desde el Estudio aparecen sin recargar) y con el nombre vigente
    getTotems().slice().reverse().forEach(tt => {
      const ttLvl = { 1: 'PB', 2: 'Nivel 1', 3: 'Nivel 2' }[tt.level] || `Nivel ${tt.level}`;
      let opt = Array.from(sel.options).find(o => o.value === tt.id);
      if (!opt) { opt = new Option('', tt.id); sel.insertBefore(opt, sel.firstChild); }
      opt.textContent = `📍 Tótem ${totemDisplayName(tt)} (${ttLvl})`;
    });
  }
}

// Fija el totem activo. Devuelve false si no existe. animate: encuadra el mapa sobre el totem
function setActiveTotemId(key, animate = true) {
  const t = resolveTotem(key);
  if (!t) return false;
  TOTEM_NODE_ID = t.id;
  if (typeof AltozanoState !== 'undefined') AltozanoState.activeTotemId = t.id;
  applyTotemLabels();
  if (animate && typeof switchLevel === 'function' && typeof currentLevel !== 'undefined') {
    if (currentLevel !== t.level) switchLevel(t.level, false);
    if (typeof renderMapOverlay === 'function') renderMapOverlay();
    if (typeof zoomToTotem === 'function') zoomToTotem(true, 2.6);
  } else if (typeof renderMapOverlay === 'function' && typeof mallGraph !== 'undefined' && mallGraph) {
    renderMapOverlay();
  }
  return true;
}
window.setActiveTotemId = setActiveTotemId;
window.getActiveTotem = getActiveTotem;

// Al arrancar: ?totem= elige el totem; si no llega nada se usa el predeterminado
function initTotems() {
  const requested = new URLSearchParams(window.location.search).get('totem');
  const t = resolveTotem(requested) || resolveTotem(DEFAULT_TOTEM_ID) || getTotems()[0];
  if (t) {
    TOTEM_NODE_ID = t.id;
    if (typeof switchLevel === 'function') {
      switchLevel(t.level, false);
    }
  }
  applyTotemLabels();
}

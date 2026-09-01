/**
 * Paseo Altozano · Application Bootstrap & Cache Manager
 */

async function loadCachedJson(key, url) {
  const storageKey = `altozano_${key}_${APP_CACHE_VERSION}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      fetch(`${url}?v=${APP_CACHE_VERSION}`)
        .then(res => res.ok ? res.json() : null)
        .then(fresh => {
          if (fresh) {
            try { localStorage.setItem(storageKey, JSON.stringify(fresh)); } catch (e) {}
          }
        })
        .catch(() => {});
      return parsed;
    }
  } catch (e) {}

  const res = await fetch(`${url}?v=${APP_CACHE_VERSION}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching ${url}`);
  const data = await res.json();
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {}
  return data;
}

function populateSelects() {
  const originSel = document.getElementById('origin-select');
  const destSel = document.getElementById('dest-select');
  if (!originSel || !destSel) return;
  
  originSel.innerHTML = '';
  destSel.innerHTML = '';

  const totemOpt = new Option("📍 Tótem Principal (Punto 12 - Nivel 1)", TOTEM_NODE_ID);
  originSel.appendChild(totemOpt);

  const levels = {
    1: { name: "Planta Baja (Nivel Inferior)", nodes: [] },
    2: { name: "Planta 1 (Nivel Principal)", nodes: [] },
    3: { name: "Planta 2 (Nivel Superior)", nodes: [] }
  };

  mallGraph.nodes.forEach(n => {
    if (n.name && (n.type === 'store' || n.type === 'anchor_store' || n.type === 'island' || n.type.startsWith('portal_') || n.type === 'service' || n.type === 'restroom')) {
      if (levels[n.level]) levels[n.level].nodes.push(n);
    }
  });

  [1, 2, 3].forEach(lvl => {
    const og1 = document.createElement('optgroup');
    og1.label = `--- ${levels[lvl].name} ---`;
    const og2 = document.createElement('optgroup');
    og2.label = `--- ${levels[lvl].name} ---`;

    levels[lvl].nodes.sort((a, b) => a.name.localeCompare(b.name)).forEach(n => {
      const opt1 = new Option(`${n.name} (Nivel ${n.level === 1 ? 'PB' : (n.level === 2 ? '1' : '2')})`, n.id);
      const opt2 = new Option(`${n.name} (Nivel ${n.level === 1 ? 'PB' : (n.level === 2 ? '1' : '2')})`, n.id);
      og1.appendChild(opt1);
      og2.appendChild(opt2);
    });

    originSel.appendChild(og1);
    destSel.appendChild(og2);
  });

  originSel.value = TOTEM_NODE_ID;
}

async function initApp() {
  try {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('altozano_') && !k.includes(APP_CACHE_VERSION)) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {}

    const [dataGraph, legData] = await Promise.all([
      loadCachedJson('graph', 'mall_graph.json'),
      loadCachedJson('legends', 'gemini-code-1787086839436.json')
    ]);
    
    mallGraph = dataGraph;
    mallLegends = legData.mall_legends;
    
    buildFloorSubgraphs();
    populateSelects();
    renderLegendList();
    setupInteractiveCameraPan();
    if (typeof initLogoPositions === 'function') initLogoPositions();
    if (typeof setupEditorDragListeners === 'function') setupEditorDragListeners();
    
    initFromUrlParams();
  } catch (err) {
    console.error("Error loading graph/legend data:", err);
  }
}

// Attach lifecycle events
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

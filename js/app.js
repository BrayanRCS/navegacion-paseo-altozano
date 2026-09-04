/**
 * Paseo Altozano · Application Bootstrap & Offline-First Preloader
 * Guarantees 100% Standalone Totem Kiosk Operation & Fast Cold-Start
 */

function setPreloaderProgress(percent, message) {
  const bar = document.getElementById('preloader-progress-bar');
  const txt = document.getElementById('preloader-status-text');
  const pct = document.getElementById('preloader-percentage-text');
  if (bar) bar.style.width = `${percent}%`;
  if (txt && message) txt.innerText = message;
  if (pct) pct.innerText = `${percent}%`;
}

function dismissPreloader() {
  const preloader = document.getElementById('app-preloader');
  if (!preloader) return;
  setPreloaderProgress(100, "¡Sistema listo!");
  setTimeout(() => {
    preloader.style.opacity = '0';
    preloader.style.pointerEvents = 'none';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 700);
  }, 400);
}

function preloadSingleImage(url) {
  return new Promise((resolve) => {
    if (!url || typeof Image === 'undefined') return resolve(url);
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(url)).catch(() => resolve(url));
      } else {
        resolve(url);
      }
    };
    img.onerror = () => resolve(null); // Never block app if a single logo fails
    img.src = url;
  });
}

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

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[Offline Engine] Service Worker registered with scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[Offline Engine] Service Worker registration failed:', err);
      });
  }
}

async function initApp() {
  try {
    registerServiceWorker();
    setPreloaderProgress(15, "Descargando planos y grafos de navegación...");
    
    // 1. Fetch core graph and legends
    const [dataGraph, legData] = await Promise.all([
      loadCachedJson('graph', 'mall_graph.json'),
      loadCachedJson('legends', 'gemini-code-1787086839436.json')
    ]);
    
    mallGraph = dataGraph;
    mallLegends = legData.mall_legends;
    
    if (typeof initCustomGraph === 'function') initCustomGraph();
    if (typeof initLogoPositions === 'function') initLogoPositions();

    setPreloaderProgress(45, "Cargando planos arquitectónicos HD...");

    // 2. Preload and hardware-decode all architectural floor map images in parallel
    const mapImageUrls = [
      'planta-baja-dark.png',
      'planta-uno-dark.png',
      'planta-dos-dark.png',
      'planta-baja.png',
      'planta-uno.png',
      'planta-dos.png'
    ];
    await Promise.all(mapImageUrls.map(url => preloadSingleImage(url)));

    setPreloaderProgress(75, "Cargando catálogo completo de logotipos...");

    // 3. Collect and preload all brand logo SVGs in parallel
    const logoUrls = new Set();
    if (mallGraph && Array.isArray(mallGraph.nodes)) {
      mallGraph.nodes.forEach(n => {
        if (n.logo) logoUrls.add(n.logo);
      });
    }
    await Promise.all(Array.from(logoUrls).map(url => preloadSingleImage(url)));

    setPreloaderProgress(90, "Compilando subgrafos de navegación A*...");

    // 4. Build subgraphs and initialize UI
    buildFloorSubgraphs();
    populateSelects();
    if (typeof renderCategoryHub === 'function') renderCategoryHub();
    renderLegendList();
    setupInteractiveCameraPan();
    if (typeof setupEditorDragListeners === 'function') setupEditorDragListeners();
    
    initFromUrlParams();
    renderMapOverlay();

    setPreloaderProgress(100, "¡Carga completa!");
    dismissPreloader();
  } catch (err) {
    console.error("Error loading graph/legend data:", err);
    dismissPreloader();
  }
}

// Attach lifecycle events
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
}

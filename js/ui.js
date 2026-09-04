/**
 * Paseo Altozano · User Interface & Interactions Module
 */

function triggerHaptic(type = 'light') {
  if ('vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(22);
      else if (type === 'medium') navigator.vibrate([35, 20, 35]);
      else if (type === 'success') navigator.vibrate([45, 30, 70]);
    } catch (e) {}
  }
}

function toggleStoresAndRestaurants() {
  showStoresAndRestaurants = !showStoresAndRestaurants;
  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) {
    nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';
  }
  updateToggleStoresButtonUI();
  triggerHaptic('light');
}

function updateToggleStoresButtonUI() {
  const btn = document.getElementById('btn-toggle-stores');
  const btnText = document.getElementById('btn-toggle-stores-text');
  const btnIcon = document.getElementById('btn-toggle-stores-icon');
  if (!btn) return;
  if (showStoresAndRestaurants) {
    if (btnText) btnText.innerText = "Ocultar Tiendas y Restaurantes";
    if (btnIcon) btnIcon.className = "fa-solid fa-eye-slash text-xs";
    btn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border border-slate-700";
  } else {
    if (btnText) btnText.innerText = "Mostrar Tiendas y Restaurantes";
    if (btnIcon) btnIcon.className = "fa-solid fa-store text-xs";
    btn.className = "px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border border-blue-400/40";
  }
}

function updateZoomButtonUI() {
  const btnText = document.getElementById('zoom-toggle-text');
  const btnIcon = document.getElementById('zoom-toggle-icon');
  if (btnText && btnIcon) {
    if (currentCamera.isZoomed) {
      btnText.innerText = "Ver Todo";
      btnIcon.className = "fa-solid fa-compress text-xs";
    } else {
      btnText.innerText = "Ver Todo";
      btnIcon.className = "fa-solid fa-expand text-xs";
    }
  }
}

function toggleMapOrientation() {
  isVerticalMode = !isVerticalMode;
  triggerHaptic('medium');
  applyMapOrientation();
}

function applyMapOrientation() {
  const container = document.getElementById('map-container');
  const icon = document.getElementById('orientation-icon');
  const isMobile = document.body.classList.contains('mobile-navigation-mode');

  if (isVerticalMode) {
    if (container && !isMobile) {
      container.style.aspectRatio = 'auto';
      container.style.height = 'calc(100vh - 215px)';
      container.style.minHeight = '580px';
      container.style.maxHeight = 'none';
    }
    if (icon) icon.className = "fa-solid fa-arrows-rotate text-xs text-sky-400";
    currentCamera.rotation = -90;
  } else {
    if (container && !isMobile) {
      container.style.aspectRatio = 'auto';
      container.style.height = 'calc(100vh - 215px)';
      container.style.minHeight = '580px';
      container.style.maxHeight = 'none';
    }
    if (icon) icon.className = "fa-solid fa-arrows-rotate text-xs text-slate-400";
    currentCamera.rotation = 0;
  }

  cachedViewport = null;
  renderMapOverlay();
  updateCameraTransform();
  updateCompassUI();
  zoomToOverview(true);
}

function switchLevel(lvl, autoZoom = true) {
  currentLevel = lvl;
  cachedViewport = null;
  const spec = FLOOR_SPECS[lvl];
  
  const title = document.getElementById('map-level-title');
  const count = document.getElementById('map-nodes-count');
  const svgOverlay = document.getElementById('map-svg-overlay');

  [1, 2, 3].forEach(l => {
    const btnDir = document.getElementById(`btn-lvl-${l}`);
    if (btnDir) {
      btnDir.className = l === lvl 
        ? "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md"
        : "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white";
    }
    const btnMap = document.getElementById(`map-bar-btn-lvl-${l}`);
    if (btnMap) {
      btnMap.className = l === lvl
        ? "px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md"
        : "px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white";
    }
    const btnMob = document.getElementById(`mob-lvl-${l}`);
    if (btnMob) {
      btnMob.className = l === lvl
        ? "px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 text-white shadow-md"
        : "px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white";
    }

    // Zero-Flicker GPU Layer Crossfade
    const layerImg = document.getElementById(`floor-plan-img-${l}`);
    if (layerImg) {
      if (l === lvl) {
        layerImg.style.display = 'block';
        requestAnimationFrame(() => {
          layerImg.style.opacity = '0.95';
        });
      } else {
        layerImg.style.opacity = '0';
        setTimeout(() => {
          if (currentLevel !== l) {
            layerImg.style.display = 'none';
          }
        }, 280);
      }
    }
  });

  const fallbackImg = document.getElementById('floor-plan-img');
  if (fallbackImg) fallbackImg.src = spec.img;

  if (title) title.innerText = spec.name;
  if (count) count.innerText = spec.count;
  if (svgOverlay) svgOverlay.setAttribute('viewBox', `0 0 ${spec.width} ${spec.height}`);

  closeNodePopup();
  renderMapOverlay();
  updateSegmentButtons();
  if (autoZoom) {
    zoomToOverview(true);
  }
}

function showFloorTransitionHUD(fromLvl, toLvl, portalNode = null) {
  const hud = document.getElementById('floor-transition-hud');
  const card = document.getElementById('floor-transition-card');
  const icon = document.getElementById('floor-trans-icon');
  const title = document.getElementById('floor-trans-title');
  const desc = document.getElementById('floor-trans-desc');
  const badge = document.getElementById('floor-trans-badge');
  const fromBadge = document.getElementById('floor-trans-from');
  const toBadge = document.getElementById('floor-trans-to');

  if (!hud) return;

  const floorNames = {
    1: 'Planta Baja (PB)',
    2: 'Nivel 1 (N1)',
    3: 'Nivel 2 (N2)'
  };
  const floorCodes = { 1: 'PB', 2: 'N1', 3: 'N2' };

  const isUp = toLvl > fromLvl;
  const isElevator = portalNode && ((portalNode.type || '').includes('elevator') || (portalNode.name || '').toLowerCase().includes('elevador'));
  const isEscalator = portalNode && ((portalNode.type || '').includes('escalator') || (portalNode.name || '').toLowerCase().includes('escalera'));

  let actionText = isUp ? 'Subiendo' : 'Bajando';
  let portalTypeName = 'Conexión de Piso';

  if (isElevator) {
    portalTypeName = 'Elevador';
    if (icon) icon.className = 'fa-solid fa-elevator text-sky-400 text-2xl animate-bounce';
  } else if (isEscalator) {
    portalTypeName = 'Escaleras Eléctricas';
    if (icon) icon.className = 'fa-solid fa-stairs text-amber-400 text-2xl animate-pulse';
  } else {
    portalTypeName = 'Escaleras';
    if (icon) icon.className = 'fa-solid fa-stairs text-sky-400 text-2xl';
  }

  const portalName = portalNode && portalNode.name ? portalNode.name : portalTypeName;

  if (title) title.innerText = `${actionText} a ${floorNames[toLvl] || 'Piso ' + toLvl}`;
  if (desc) desc.innerText = `Por ${portalName}`;
  if (badge) badge.innerText = `${isUp ? '⬆ SUBIENDO' : '⬇ BAJANDO'} · ${portalTypeName.toUpperCase()}`;
  if (fromBadge) fromBadge.innerText = floorCodes[fromLvl] || `P${fromLvl}`;
  if (toBadge) toBadge.innerText = floorCodes[toLvl] || `P${toLvl}`;

  hud.classList.remove('hidden');
  requestAnimationFrame(() => {
    hud.classList.remove('opacity-0');
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }
  });
}

function hideFloorTransitionHUD() {
  const hud = document.getElementById('floor-transition-hud');
  const card = document.getElementById('floor-transition-card');
  if (!hud) return;

  hud.classList.add('opacity-0');
  if (card) {
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
  }
  setTimeout(() => {
    hud.classList.add('hidden');
  }, 280);
}

function setTotemRoute(destId) {
  showMapView(destId);
}

function showDirectoryView() {
  currentKioskView = 'directory';
  const dirEl = document.getElementById('view-directory');
  const mapEl = document.getElementById('view-map');
  if (dirEl && mapEl) {
    mapEl.classList.add('hidden');
    dirEl.classList.remove('hidden');
    if (typeof anime !== 'undefined') {
      anime({
        targets: '#view-directory',
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 320,
        easing: 'easeOutQuad'
      });
    }
  }
}

function showMapView(destId = null) {
  currentKioskView = 'map';
  const dirEl = document.getElementById('view-directory');
  const mapEl = document.getElementById('view-map');
  if (dirEl && mapEl) {
    dirEl.classList.add('hidden');
    mapEl.classList.remove('hidden');
    cachedViewport = null;

    if (destId) {
      const origSel = document.getElementById('origin-select');
      const destSel = document.getElementById('dest-select');
      if (origSel) origSel.value = TOTEM_NODE_ID;
      if (destSel) destSel.value = destId;
    } else {
      // Exploring / browsing map freely without active route
      stopWalkSimulation();
      routeSegments = [];
      currentSteps = [];
      currentStepIndex = 0;
      const waterBedEl = document.getElementById('svg-water-bed');
      const pathEl = document.getElementById('svg-active-route');
      const destPinEl = document.getElementById('svg-dest-pin');
      const arrowEl = document.getElementById('svg-nav-arrow-cursor');
      const segsBar = document.getElementById('route-segments-bar');
      if (waterBedEl) waterBedEl.setAttribute('d', '');
      if (pathEl) pathEl.setAttribute('d', '');
      if (destPinEl) destPinEl.style.display = 'none';
      if (arrowEl) arrowEl.style.display = 'none';
      if (segsBar) segsBar.style.display = 'none';
    }

    requestAnimationFrame(() => {
      cachedViewport = null;
      if (destId) {
        calculateRoute(TOTEM_NODE_ID, destId);
      } else {
        renderMapOverlay();
        zoomToOverview(false);
      }
    });

    if (typeof anime !== 'undefined') {
      anime({
        targets: '#view-map',
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 320,
        easing: 'easeOutQuad'
      });
    }
  }
}


let currentDirectoryFloorFilter = 'all'; // 'all' | 1 | 2 | 3

function renderCategoryHub() {
  const container = document.getElementById('category-hub-grid');
  if (!container || typeof DIRECTORY_CATEGORIES === 'undefined') return;

  // Calculate store counts per category dynamically
  const categoryCounts = {};
  DIRECTORY_CATEGORIES.forEach(c => categoryCounts[c.id] = 0);

  if (mallLegends) {
    [1, 2, 3].forEach(lvl => {
      const spec = FLOOR_SPECS[lvl];
      const legendFloor = mallLegends[spec.legendKey];
      if (!legendFloor) return;
      (legendFloor.stores || []).forEach(s => {
        const cat = matchNodeCategory(s);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        categoryCounts['all']++;
      });
      (legendFloor.islas || []).forEach(isl => {
        const cat = matchNodeCategory(isl);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        categoryCounts['all']++;
      });
    });
  }

  container.innerHTML = '';
  DIRECTORY_CATEGORIES.forEach(cat => {
    const isActive = currentCategoryFilter === cat.id;
    const count = categoryCounts[cat.id] || 0;

    const btn = document.createElement('button');
    btn.className = `group relative overflow-hidden rounded-3xl p-4 sm:p-5 text-left transition-all duration-300 transform active:scale-95 shadow-xl border cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[125px] ${
      isActive 
        ? 'bg-gradient-to-br ' + cat.gradient + ' text-white border-white/60 ring-4 ring-sky-500/30 scale-[1.02]' 
        : 'bg-slate-900/90 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
    }`;

    btn.onclick = () => {
      filterByCategory(cat.id);
      const listEl = document.getElementById('legend-items-container');
      if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    btn.innerHTML = `
      <!-- Ambient Card Glow -->
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20 ${isActive ? 'bg-white' : 'bg-sky-500'}"></div>
      
      <div class="flex items-start justify-between w-full relative z-10">
        <div class="w-12 h-12 rounded-2xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-sky-400 border border-slate-800'} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
          <i class="fa-solid ${cat.icon}"></i>
        </div>
        <span class="px-2.5 py-1 rounded-xl text-[11px] font-black ${isActive ? 'bg-white/25 text-white' : 'bg-slate-950/80 text-slate-400 border border-slate-800'}">
          ${count} ${count === 1 ? 'lugar' : 'locales'}
        </span>
      </div>

      <div class="mt-3 relative z-10">
        <div class="flex items-center gap-1.5">
          <span class="text-sm">${cat.emoji}</span>
          <h3 class="text-sm sm:text-base font-black leading-tight ${isActive ? 'text-white' : 'text-slate-100 group-hover:text-sky-300'}">${cat.name}</h3>
        </div>
        <p class="text-[11px] ${isActive ? 'text-white/80' : 'text-slate-400'} font-medium mt-0.5 line-clamp-1">${cat.desc}</p>
      </div>
    `;

    container.appendChild(btn);
  });
}

function filterByCategory(cat) {
  currentCategoryFilter = cat;
  renderCategoryHub();
  renderMapOverlay();
  renderLegendList();
}

function filterByFloor(floor) {
  currentDirectoryFloorFilter = floor;
  const floorBtns = ['all', '1', '2', '3'];
  floorBtns.forEach(f => {
    const el = document.getElementById(`dir-floor-btn-${f}`);
    if (el) {
      if (String(currentDirectoryFloorFilter) === String(f)) {
        el.className = "px-4 py-2 rounded-2xl text-xs font-black transition-all bg-blue-600 text-white shadow-md cursor-pointer";
      } else {
        el.className = "px-4 py-2 rounded-2xl text-xs font-bold transition-all bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer";
      }
    }
  });
  renderLegendList();
}

function clearSearchInput() {
  const input = document.getElementById('legend-search-input');
  const clearBtn = document.getElementById('legend-search-clear-btn');
  if (input) {
    input.value = '';
    input.focus();
    if (clearBtn) clearBtn.classList.add('hidden');
    filterLegendList();
  }
}

function getNodeCategoryGroup(node) {
  if (typeof matchNodeCategory === 'function') {
    return matchNodeCategory(node);
  }
  return 'other';
}

function getPlaceVisualInfo(node) {
  if (!node) return { emoji: '📍', category: 'PUNTO DE CONTROL', bgGradient: 'from-blue-600 to-sky-500', name: 'Pasillo Principal', detail: 'Conector de pasillo abierto' };

  const name = (node.name || node.context_element || '').toLowerCase();
  const type = node.type || '';
  const id = node.id || '';

  if (type === 'portal_escalator' || name.includes('escalera')) {
    return { emoji: '🪜', category: 'CONEXIÓN VERTICAL', bgGradient: 'from-cyan-600 to-teal-800', name: node.name || 'Escaleras Eléctricas', detail: `Conecta con Nivel ${node.level === 1 ? '1' : (node.level === 2 ? 'PB / 2' : '1')}` };
  }
  if (type === 'portal_elevator' || name.includes('elevador')) {
    return { emoji: '🛗', category: 'ELEVADOR PANORÁMICO', bgGradient: 'from-blue-600 to-indigo-800', name: node.name || 'Elevador Panorámico', detail: 'Acceso accesible y directo entre niveles' };
  }
  if (id === TOTEM_NODE_ID || name.includes('tótem')) {
    return { emoji: '📍', category: 'TÓTEM INTERACTIVO', bgGradient: 'from-rose-600 to-red-800', name: 'Tótem Principal (Punto 12)', detail: 'Ubicado en pasillo frente a Chedraui / M-Caps' };
  }

  if (name.includes('starbucks')) return { emoji: '☕', category: 'CAFETERÍA & BEBIDAS', bgGradient: 'from-emerald-700 to-green-900', name: 'Starbucks Coffee', detail: 'Bebidas artesanales y café de especialidad' };
  if (name.includes('sanborns')) return { emoji: '🍽️', category: 'RESTAURANTE & TIENDA', bgGradient: 'from-sky-700 to-blue-900', name: 'Sanborns Altozano', detail: 'Restaurante tradicional, panadería y tienda' };
  if (name.includes('moyo') || name.includes('nutrisa') || name.includes('ice') || name.includes('helad') || name.includes('crepe') || name.includes('dairy') || name.includes('chocolat')) {
    return { emoji: '🍦', category: 'POSTRES & HELADOS', bgGradient: 'from-pink-600 to-rose-900', name: node.name || 'Heladería / Postres', detail: 'Helados de yogurt, nieves y postres' };
  }
  if (name.includes('cine') || name.includes('cinelia') || name.includes('cinépolis')) {
    return { emoji: '🎬', category: 'ENTRETENIMIENTO', bgGradient: 'from-indigo-700 to-purple-950', name: 'Cinelia Plaza Altozano', detail: 'Salas de cine premium y dulcería' };
  }
  if (name.includes('liverpool')) return { emoji: '🛍️', category: 'TIENDA DEPARTAMENTAL', bgGradient: 'from-pink-700 to-rose-950', name: 'Liverpool Altozano', detail: 'Moda, tecnología, hogar y gourmet' };
  if (name.includes('sears')) return { emoji: '🛍️', category: 'TIENDA DEPARTAMENTAL', bgGradient: 'from-red-700 to-rose-950', name: 'Sears Altozano', detail: 'Moda, electrónica y línea blanca' };
  if (name.includes('chedraui')) return { emoji: '🛒', category: 'SUPERMERCADO SELECTO', bgGradient: 'from-amber-600 to-orange-900', name: 'Chedraui Selecto', detail: 'Supermercado gourmet y comestibles' };

  return { emoji: '🏬', category: 'LOCAL COMERCIAL', bgGradient: 'from-blue-600 to-sky-500', name: node.name || 'Local Comercial', detail: `Ubicado en Nivel ${node.level === 1 ? 'PB' : (node.level === 2 ? '1' : '2')}` };
}

function updatePlaceCard(node, isFinal = false) {
  if (!node) return;
  const info = getPlaceVisualInfo(node);
  const titleEl = document.getElementById('place-preview-title');
  if (titleEl) titleEl.innerText = isFinal ? `🎯 ${node.name || 'Destino'}` : (node.name || info.name);
  const catEl = document.getElementById('place-preview-category');
  if (catEl) catEl.innerText = info.category;
  const descEl = document.getElementById('place-preview-desc');
  if (descEl) descEl.innerText = info.detail;
}

function renderLegendList() {
  if (!mallLegends) return;
  const container = document.getElementById('legend-items-container');
  if (!container) return;
  container.innerHTML = '';
  const fragment = document.createDocumentFragment ? document.createDocumentFragment() : container;

  const allItems = [];

  [1, 2, 3].forEach(lvl => {
    const spec = FLOOR_SPECS[lvl];
    const legendFloor = mallLegends[spec.legendKey];
    if (!legendFloor) return;

    (legendFloor.stores || []).forEach(s => {
      const nodeId = `n_lvl${lvl}_store_${s.id}`;
      const node = (levelNodes[lvl] && levelNodes[lvl][nodeId]) || { name: s.name, type: s.type, level: lvl, id: nodeId };
      allItems.push({
        nodeId: nodeId,
        node: node,
        name: s.name,
        level: lvl,
        type: s.type,
        isIsland: false
      });
    });

    (legendFloor.islas || []).forEach(isl => {
      const nodeId = `n_lvl${lvl}_island_${isl.id}`;
      const node = (levelNodes[lvl] && levelNodes[lvl][nodeId]) || { name: isl.name, type: 'island', level: lvl, id: nodeId };
      allItems.push({
        nodeId: nodeId,
        node: node,
        name: isl.name,
        level: lvl,
        type: 'island',
        islandId: isl.id,
        isIsland: true
      });
    });
  });

  const filtered = allItems.filter(item => {
    // 1. Category filter
    const cat = getNodeCategoryGroup(item.node);
    const passCategory = currentCategoryFilter === 'all' || cat === currentCategoryFilter;
    
    // 2. Floor filter
    const passFloor = currentDirectoryFloorFilter === 'all' || String(item.level) === String(currentDirectoryFloorFilter);

    return passCategory && passFloor;
  });

  filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

  const countBadgeEl = document.getElementById('legend-results-count');
  if (countBadgeEl) {
    countBadgeEl.innerText = `${filtered.length} ${filtered.length === 1 ? 'local encontrado' : 'locales encontrados'}`;
  }

  if (filtered.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'col-span-full py-12 px-4 text-center flex flex-col items-center justify-center';
    emptyDiv.innerHTML = `
      <div class="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl text-slate-500 mb-3 shadow-inner">
        <i class="fa-solid fa-store-slash"></i>
      </div>
      <h4 class="text-base font-bold text-slate-300">No encontramos locales en este filtro</h4>
      <p class="text-xs text-slate-500 mt-1 max-w-xs">Prueba seleccionando otra categoría o cambiando el piso.</p>
      <button onclick="filterByCategory('all'); filterByFloor('all');" class="mt-4 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md">
        Ver Todos los Locales
      </button>
    `;
    container.appendChild(emptyDiv);
    return;
  }

  filtered.forEach(item => {
    const info = getPlaceVisualInfo(item.node);
    const logoUrl = (item.node && item.node.logo) || item.logo || (item.node && item.node.logo_white);

    const div = document.createElement('div');
    div.className = "p-4 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800/90 hover:border-sky-500/60 cursor-pointer transition-all flex items-center justify-between gap-3.5 group shadow-lg active:scale-[0.98]";
    
    div.onclick = () => {
      showMapView(item.nodeId);
    };

    const levelBadgeText = item.level === 1 ? 'PB (Inferior)' : (item.level === 2 ? 'Nivel 1 (Principal)' : 'Nivel 2 (Superior)');
    const levelBadgeColor = item.level === 1 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70' : (item.level === 2 ? 'bg-blue-950/80 text-sky-300 border-sky-800/70' : 'bg-purple-950/80 text-purple-300 border-purple-800/70');

    let avatarHtml = '';
    if (logoUrl) {
      avatarHtml = `
        <div class="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-md border border-slate-700/60 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          ${getLogoHtml(logoUrl, item.name, 'w-full h-full object-contain brand-logo-img')}
        </div>
      `;
    } else if (item.isIsland) {
      avatarHtml = `
        <span class="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-sm font-black font-mono group-hover:bg-sky-500 group-hover:text-white transition-all flex-shrink-0 shadow-md">I${item.islandId || 'S'}</span>
      `;
    } else {
      avatarHtml = `
        <span class="w-14 h-14 rounded-2xl ${item.type === 'anchor_store' ? 'bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700'} flex items-center justify-center text-xl font-black font-mono group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0 shadow-md">${info.emoji}</span>
      `;
    }

    div.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0">
        ${avatarHtml}
        <div class="truncate">
          <h4 class="text-sm font-black text-white group-hover:text-sky-300 truncate leading-snug">${item.name}</h4>
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span class="text-[9px] px-2.5 py-0.5 rounded-lg border font-black ${levelBadgeColor}">${levelBadgeText}</span>
            <span class="text-[11px] text-slate-400 font-medium truncate">${info.category}</span>
          </div>
        </div>
      </div>
      <button class="flex items-center gap-2 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-sky-500 group-hover:from-blue-500 group-hover:to-sky-400 px-4 py-2.5 rounded-2xl border border-sky-400/40 shadow-lg shadow-blue-600/30 transition-all flex-shrink-0">
        <i class="fa-solid fa-map-location-dot text-sm"></i>
        <span>Cómo llegar</span>
      </button>
    `;

    fragment.appendChild(div);
  });

  if (fragment !== container) container.appendChild(fragment);
  NavAnimator.staggerLegend();
}

let filterLegendRaf = null;
function filterLegendList() {
  if (filterLegendRaf) cancelAnimationFrame(filterLegendRaf);
  filterLegendRaf = requestAnimationFrame(() => {
    const input = document.getElementById('legend-search-input');
    const clearBtn = document.getElementById('legend-search-clear-btn');
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    if (clearBtn) {
      if (q.length > 0) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    const items = document.querySelectorAll('#legend-items-container > div');
    let visibleCount = 0;
    items.forEach(el => {
      const text = el.innerText.toLowerCase();
      const match = text.includes(q);
      el.style.display = match ? 'flex' : 'none';
      if (match) visibleCount++;
    });

    const countBadgeEl = document.getElementById('legend-results-count');
    if (countBadgeEl) {
      countBadgeEl.innerText = `${visibleCount} ${visibleCount === 1 ? 'local encontrado' : 'locales encontrados'}`;
    }
  });
}


function getNodePixelPosition(nodeX, nodeY) {
  const vp = getMapViewport();
  const u = nodeX / vp.spec.width;
  const v = nodeY / vp.spec.height;
  const pixelX = vp.offsetX + u * vp.renderW;
  const pixelY = vp.offsetY + v * vp.renderH;

  const screenX = (pixelX * currentCamera.scale) + currentCamera.panX;
  const screenY = (pixelY * currentCamera.scale) + currentCamera.panY;

  return { x: screenX, y: screenY };
}

function updatePopupPosition() {
  if (!selectedPopupNode || selectedPopupNode.level !== currentLevel) return;
  const popup = document.getElementById('map-node-popup');
  if (!popup || popup.classList.contains('hidden')) return;
  const pos = getNodePixelPosition(selectedPopupNode.coordinates.x, selectedPopupNode.coordinates.y);
  popup.style.left = `${pos.x}px`;
  popup.style.top = `${pos.y - 10}px`;
}

function showNodePopup(node) {
  if (!node) return;
  selectedPopupNode = node;
  const popup = document.getElementById('map-node-popup');
  if (!popup) return;

  const info = getPlaceVisualInfo(node);
  const emojiEl = document.getElementById('popup-emoji');
  if (node.logo) {
    emojiEl.innerHTML = `<div class="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shadow border border-slate-700/50">${getLogoHtml(node.logo, node.name, 'w-full h-full object-contain brand-logo-img')}</div>`;
  } else {
    emojiEl.innerText = info.emoji;
  }
  document.getElementById('popup-category').innerText = info.category;
  document.getElementById('popup-title').innerText = node.name || 'Punto';
  document.getElementById('popup-desc').innerText = info.detail || `Nivel ${node.level === 1 ? 'PB' : (node.level === 2 ? '1' : '2')}`;

  const pos = getNodePixelPosition(node.coordinates.x, node.coordinates.y);
  popup.style.left = `${pos.x}px`;
  popup.style.top = `${pos.y - 10}px`;
  popup.classList.remove('hidden');

  if (typeof anime !== 'undefined') {
    anime.remove(popup);
    anime({
      targets: popup,
      opacity: [0, 1],
      scale: [0.85, 1],
      translateY: [10, 0],
      duration: 300,
      easing: 'easeOutBack'
    });
  }
}

function closeNodePopup() {
  const popup = document.getElementById('map-node-popup');
  if (!popup || popup.classList.contains('hidden')) return;
  if (typeof anime !== 'undefined') {
    anime({
      targets: popup,
      opacity: [1, 0],
      scale: [1, 0.85],
      duration: 180,
      easing: 'easeInQuad',
      complete: () => {
        popup.classList.add('hidden');
        selectedPopupNode = null;
      }
    });
  } else {
    popup.classList.add('hidden');
    selectedPopupNode = null;
  }
}

function routeToPopupNode() {
  if (!selectedPopupNode) return;
  const destId = selectedPopupNode.id;
  closeNodePopup();
  document.getElementById('origin-select').value = TOTEM_NODE_ID;
  document.getElementById('dest-select').value = destId;
  calculateRoute();
}

function setOriginPopupNode() {
  if (!selectedPopupNode) return;
  const origSelect = document.getElementById('origin-select');
  origSelect.value = selectedPopupNode.id;
  closeNodePopup();
  calculateRoute();
}

function renderRouteSegmentsBar() {
  const bar = document.getElementById('route-segments-bar');
  const container = document.getElementById('segments-container');
  if (!bar || !container) return;
  
  if (routeSegments.length <= 1) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  container.innerHTML = '';

  routeSegments.forEach((seg, idx) => {
    const btn = document.createElement('button');
    const isActive = seg.level === currentLevel;
    btn.id = `seg-btn-${idx}`;
    btn.className = `px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
      isActive ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
    }`;
    btn.innerHTML = `<i class="fa-solid fa-layer-group mr-1 text-[10px]"></i> ${seg.title}`;
    btn.onclick = () => {
      switchLevel(seg.level, true);
    };
    container.appendChild(btn);
  });

  NavAnimator.staggerSegments();
}

function updateSegmentButtons() {
  routeSegments.forEach((seg, idx) => {
    const btn = document.getElementById(`seg-btn-${idx}`);
    if (btn) {
      const isActive = seg.level === currentLevel;
      btn.className = `px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
        isActive ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
      }`;
    }
  });
}

function updateTotemUI(syncMap = true) {
  if (currentSteps.length === 0) return;
  const step = currentSteps[currentStepIndex];

  const tagNumber = document.getElementById('step-number-tag');
  if (tagNumber) tagNumber.innerText = `PASO ${currentStepIndex + 1} DE ${currentSteps.length}`;
  const tagLevel = document.getElementById('step-level-tag');
  if (tagLevel) tagLevel.innerText = `Nivel ${step.level === 1 ? 'PB' : (step.level === 2 ? '1' : '2')}`;
  const mainInstr = document.getElementById('step-instruction-main');
  if (mainInstr) mainInstr.innerText = step.title;
  const ctxInstr = document.getElementById('step-instruction-context');
  if (ctxInstr) ctxInstr.innerText = step.context;
  const actionTxt = document.getElementById('step-action-text');
  if (actionTxt) actionTxt.innerText = step.actionText;

  const barContainer = document.getElementById('step-progress-bars');
  if (barContainer) {
    barContainer.innerHTML = '';
    barContainer.style.gridTemplateColumns = `repeat(${currentSteps.length}, minmax(0, 1fr))`;
    for (let i = 0; i < currentSteps.length; i++) {
      const seg = document.createElement('div');
      seg.className = `h-1.5 rounded-full transition-all duration-300 ${i <= currentStepIndex ? 'bg-blue-500' : 'bg-slate-700'}`;
      barContainer.appendChild(seg);
    }
  }

  // Sync Mobile Guidance Card UI
  const mStepNumber = document.getElementById('mobile-step-number');
  if (mStepNumber) mStepNumber.innerText = `PASO ${currentStepIndex + 1} DE ${currentSteps.length}`;
  const mStepLevel = document.getElementById('mobile-step-level');
  if (mStepLevel) mStepLevel.innerText = `Nivel ${step.level === 1 ? 'PB' : (step.level === 2 ? '1' : '2')}`;
  const mStepTitle = document.getElementById('mobile-step-title');
  if (mStepTitle) mStepTitle.innerText = step.title;
  const mStepCtx = document.getElementById('mobile-step-context');
  if (mStepCtx) mStepCtx.innerText = step.context;
  const mActionText = document.getElementById('mobile-step-action-btn-text');
  if (mActionText) mActionText.innerText = step.actionText || (currentStepIndex === currentSteps.length - 1 ? 'Finalizar' : 'Paso siguiente');
  const mIcon = document.getElementById('mobile-step-icon');
  if (mIcon) {
    mIcon.className = `fa-solid ${step.icon || 'fa-arrow-up'} text-white text-xl`;
  }

  const mProgress = document.getElementById('mobile-step-progress');
  if (mProgress) {
    mProgress.innerHTML = '';
    mProgress.style.gridTemplateColumns = `repeat(${currentSteps.length}, minmax(0, 1fr))`;
    for (let i = 0; i < currentSteps.length; i++) {
      const seg = document.createElement('div');
      seg.className = `h-1.5 rounded-full transition-all duration-300 ${i <= currentStepIndex ? 'bg-blue-500' : 'bg-slate-700'}`;
      mProgress.appendChild(seg);
    }
  }

  const stepCards = document.querySelectorAll('#route-steps-grid > div');
  stepCards.forEach((card, idx) => {
    if (idx === currentStepIndex) {
      card.className = "p-2.5 rounded-xl border text-xs cursor-pointer transition-all bg-blue-600/20 border-blue-500 text-white shadow-lg";
    } else {
      card.className = "p-2.5 rounded-xl border text-xs cursor-pointer transition-all bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700";
    }
  });

  NavAnimator.animateTotemStep();

  if (step.node) {
    updatePlaceCard(step.node, currentStepIndex === currentSteps.length - 1);
  }

  if (syncMap) {
    if (step.level !== currentLevel) {
      switchLevel(step.level, false);
    } else {
      renderMapOverlay(false);
    }
    positionNavArrowOnNode(step.node, step.nextNode, false);

    if (step.node && step.node.level === currentLevel) {
      const heading = getNodeHeading(step.node, step.nextNode);
      zoomToCoordinates(step.node.coordinates.x, step.node.coordinates.y, getDynamicZoomLevel(false), true, 600, heading);
    }
  }
}

function renderStepsList() {
  const container = document.getElementById('route-steps-grid');
  if (!container) return;
  container.innerHTML = '';
  currentSteps.forEach((step, idx) => {
    const isCurrent = idx === currentStepIndex;
    const div = document.createElement('div');
    div.className = `p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
      isCurrent ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
    }`;
    div.onclick = () => {
      stopWalkSimulation();
      currentStepIndex = idx;
      if (step) {
        const sIdx = routeSegments.findIndex(s => s.level === step.level);
        if (sIdx !== -1) {
          simSegIndex = sIdx;
          if (step.node) {
            const nIdx = routeSegments[sIdx].path.findIndex(n => n.id === step.node.id);
            simNodeIndex = nIdx !== -1 ? nIdx : 0;
          }
        }
      }
      updateTotemUI(true);
    };
    div.innerHTML = `
      <div class="flex items-center justify-between font-bold mb-1">
        <span class="text-[10px] uppercase text-sky-400">Paso ${idx + 1}</span>
        <span class="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded">Nivel ${step.level === 1 ? 'PB' : (step.level === 2 ? '1' : '2')}</span>
      </div>
      <p class="font-semibold text-white truncate">${step.title}</p>
      <p class="text-[11px] text-slate-400 truncate mt-0.5">${step.context}</p>
    `;
    container.appendChild(div);
  });

  NavAnimator.staggerSteps();
}

function nextNavStep() {
  stopWalkSimulation();
  triggerHaptic('light');
  if (currentStepIndex < currentSteps.length - 1) {
    currentStepIndex++;
  } else {
    currentStepIndex = 0;
    simSegIndex = 0;
    simNodeIndex = 0;
    if (routeSegments.length > 0 && currentLevel !== routeSegments[0].level) {
      switchLevel(routeSegments[0].level, false);
    }
  }
  updateTotemUI(true);
}

function getMobileRouteUrl() {
  const origId = document.getElementById('origin-select')?.value || TOTEM_NODE_ID;
  const destId = document.getElementById('dest-select')?.value || 'n_lvl2_14';
  
  let host = window.location.host;
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    const port = window.location.port ? `:${window.location.port}` : ':3000';
    host = `${LOCAL_NETWORK_IP}${port}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}/?orig=${encodeURIComponent(origId)}&dest=${encodeURIComponent(destId)}&mode=mobile`;
}

function showQrModal() {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;

  const url = getMobileRouteUrl();
  const input = document.getElementById('qr-custom-url-input');
  if (input) input.value = url;

  const destId = document.getElementById('dest-select')?.value;
  const destNode = mallGraph ? mallGraph.nodes.find(n => n.id === destId) : null;
  if (destNode) {
    const info = getPlaceVisualInfo(destNode);
    const qrEmoji = document.getElementById('qr-route-emoji');
    if (destNode.logo) {
      qrEmoji.innerHTML = `<div class="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-700/60">${getLogoHtml(destNode.logo, destNode.name, 'w-full h-full object-contain brand-logo-img')}</div>`;
    } else {
      qrEmoji.innerText = info.emoji;
    }
    document.getElementById('qr-route-title').innerText = destNode.name || 'Destino';
    document.getElementById('qr-route-level').innerText = `Nivel ${destNode.level === 1 ? 'PB' : (destNode.level === 2 ? '1' : '2')}`;
    const timeDist = document.getElementById('route-time-dist');
    document.getElementById('qr-route-desc').innerText = `${timeDist ? timeDist.innerText : 'Ruta guiada'}`;
  }

  const canvasContainer = document.getElementById('qrcode-canvas');
  if (canvasContainer) {
    canvasContainer.innerHTML = '';
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(canvasContainer, {
          text: url,
          width: 190,
          height: 190,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel) ? QRCode.CorrectLevel.H : 2
        });
      }
    } catch (e) {
      console.warn("QRCode error:", e);
    }
  }

  modal.classList.remove('hidden');
  if (typeof anime !== 'undefined') {
    anime({
      targets: modal.firstElementChild,
      scale: [0.85, 1],
      opacity: [0, 1],
      duration: 250,
      easing: 'easeOutBack'
    });
  }
}

function closeQrModal() {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;
  if (typeof anime !== 'undefined') {
    anime({
      targets: modal.firstElementChild,
      scale: [1, 0.85],
      opacity: [1, 0],
      duration: 180,
      easing: 'easeInQuad',
      complete: () => {
        modal.classList.add('hidden');
      }
    });
  } else {
    modal.classList.add('hidden');
  }
}

function copyQrLink() {
  const input = document.getElementById('qr-custom-url-input');
  if (!input) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btnText = document.getElementById('btn-copy-text');
    if (btnText) {
      btnText.innerText = "¡Copiado!";
      setTimeout(() => { btnText.innerText = "Copiar"; }, 2000);
    }
  }).catch(() => {
    input.select();
    document.execCommand('copy');
  });
}

function openMobileRouteTab() {
  const url = getMobileRouteUrl();
  window.open(url, '_blank');
}

function initFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const orig = params.get('orig') || params.get('origin');
  const dest = params.get('dest') || params.get('destination');
  const mode = params.get('mode');

  if (orig && document.getElementById('origin-select')) {
    document.getElementById('origin-select').value = orig;
  }
  if (dest && document.getElementById('dest-select')) {
    document.getElementById('dest-select').value = dest;
  }

  if (dest) {
    showMapView(dest);
  } else {
    showDirectoryView();
    if (document.getElementById('origin-select')) document.getElementById('origin-select').value = TOTEM_NODE_ID;
    if (document.getElementById('dest-select')) document.getElementById('dest-select').value = "n_lvl2_store_17";
  }

  if (mode === 'mobile') {
    applyMobileNavigationLayout();
  }
}

function applyMobileNavigationLayout() {
  document.body.classList.add('mobile-navigation-mode');
  
  const totemHeader = document.querySelector('header');
  if (totemHeader) totemHeader.style.display = 'none';
  
  const mainKiosk = document.querySelector('main');
  if (mainKiosk) mainKiosk.style.display = 'none';

  const mobileApp = document.getElementById('view-mobile-app');
  if (mobileApp) mobileApp.classList.remove('hidden');

  const mapContainer = document.getElementById('map-container');
  const mobileMapSlot = document.getElementById('mobile-map-slot');
  if (mapContainer && mobileMapSlot) {
    mobileMapSlot.appendChild(mapContainer);
    mapContainer.style.maxHeight = 'none';
    mapContainer.style.aspectRatio = 'auto';
    mapContainer.style.minHeight = '350px';
    mapContainer.style.height = '100%';
  }

  const destId = document.getElementById('dest-select')?.value;
  const destNode = mallGraph ? mallGraph.nodes.find(n => n.id === destId) : null;
  if (destNode) {
    const info = getPlaceVisualInfo(destNode);
    const mEmoji = document.getElementById('mobile-target-emoji');
    if (mEmoji && mEmoji.parentElement) {
      if (destNode.logo) {
        mEmoji.parentElement.className = "w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0 border border-slate-700/60";
        mEmoji.parentElement.innerHTML = getLogoHtml(destNode.logo, destNode.name, 'w-full h-full object-contain brand-logo-img');
      } else {
        mEmoji.innerText = info.emoji;
      }
    }
    const mTitle = document.getElementById('mobile-target-title');
    if (mTitle) mTitle.innerText = destNode.name || 'Destino';
  }

  updateTotemUI(true);
  zoomToOverview(false);
}

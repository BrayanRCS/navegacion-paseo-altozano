/**
 * Paseo Altozano · SVG Map Rendering Engine
 */

function getLogoHtml(logoUrl, altText = '', imgClass = 'w-full h-full object-contain brand-logo-img') {
  if (!logoUrl) return '';
  return `<img src="${logoUrl}" alt="${altText}" class="${imgClass}" loading="lazy">`;
}

function positionNavArrowOnNode(node, nextNode, animate = false, duration = 600, easing = 'easeInOutSine') {
  const arrow = document.getElementById('svg-nav-arrow-cursor');
  if (!arrow) return;
  if (!node || node.level !== currentLevel) {
    arrow.style.display = 'none';
    return;
  }

  arrow.style.display = 'block';
  const heading = getNodeHeading(node, nextNode) || 0;

  if (animate && typeof NavAnimator !== 'undefined' && NavAnimator.animateArrowTo) {
    NavAnimator.animateArrowTo(node.coordinates.x, node.coordinates.y, heading, duration, easing);
  } else if (typeof NavAnimator !== 'undefined' && NavAnimator.setArrowInstant) {
    NavAnimator.setArrowInstant(node.coordinates.x, node.coordinates.y, heading);
  } else {
    arrow.setAttribute('transform', `translate(${node.coordinates.x}, ${node.coordinates.y}) rotate(${heading})`);
  }
}

// Prioridad de un local para decidir cual icono se queda cuando dos se enciman (menor = mas importante)
function nodeIconPriority(n) {
  if (n.type === 'anchor_store') return 0;
  const cat = typeof getNodeCategoryGroup === 'function' ? getNodeCategoryGroup(n) : 'other';
  return { food: 1, coffee: 1, beauty: 2, tech: 2, other: 3, fashion: 4 }[cat] ?? 3;
}

// Para cada nivel de detalle (ver MAP_TIER_PPU) decide que iconos caben sin encimarse, por prioridad.
// Devuelve { nodeId: primerNivelDeDetalleEnQueAparece }. Con zoom cercano aparecen todos.
function computeMinTiers(nodes) {
  const kinds = ['store', 'anchor_store', 'island'];
  const cand = nodes
    .filter(n => kinds.includes(n.type) && (currentCategoryFilter === 'all' || getNodeCategoryGroup(n) === currentCategoryFilter))
    .sort((a, b) => nodeIconPriority(a) - nodeIconPriority(b) || (a.name || '').localeCompare(b.name || '', 'es'));
  const seg = routeSegments && routeSegments.find(sg => sg.level === currentLevel);
  const destId = seg && seg.path.length ? seg.path[seg.path.length - 1].id : null;
  const minTier = {};
  MAP_TIER_PPU.forEach((lower, t) => {
    const minDist = (MAP_ICON_SCREEN_R * currentSizeF * 2 + 4) / lower;  // unidades del plano
    // los ya visibles en niveles previos siguen ocupando su lugar
    const placed = cand.filter(n => minTier[n.id] !== undefined).map(n => n.coordinates);
    cand.forEach(n => {
      if (minTier[n.id] !== undefined) return;
      const { x, y } = n.coordinates;
      const clash = n.id !== destId && placed.some(p => Math.hypot(p.x - x, p.y - y) < minDist);
      if (!clash) {
        placed.push({ x, y });
        minTier[n.id] = t;
      }
    });
  });
  return minTier;
}

// Pin de destino con tarjeta (nombre + nivel). El icono sigue la categoria del local.
function renderDestinationCard(node, seg) {
  const anchor = document.getElementById('dest-pin-anchor');
  const bg = document.getElementById('dest-card-bg');
  const title = document.getElementById('dest-card-title');
  const sub = document.getElementById('dest-card-sub');
  const icon = document.getElementById('dest-pin-icon');
  const shape = document.getElementById('dest-pin-shape');
  const card = document.getElementById('dest-card');
  if (!anchor || !bg || !title || !sub || !icon || !shape || !card) return;

  const { x, y } = node.coordinates;
  // En modo vertical el mapa gira -90 grados: el pin se contragira +90 para que el texto quede derecho.
  // Se hace aqui y no en #svg-dest-pin porque la animacion de aparicion pisa el atributo transform de ese grupo.
  const vertical = isVerticalMode && !document.body.classList.contains('mobile-navigation-mode');
  anchor.setAttribute('transform', `translate(${x}, ${y})${vertical ? ' rotate(90)' : ''}`);
  if (typeof updateMapScaleVars === 'function') updateMapScaleVars(true);

  let iconHref = '#vec-icon-bag';
  let fill = '#0f2b3a';
  if (node.type === 'portal_escalator') iconHref = '#vec-icon-stairs';
  else if (node.type === 'portal_elevator') iconHref = '#vec-icon-elevator';
  else if (node.type === 'restroom') iconHref = '#vec-icon-restroom';
  else if (typeof MINIMAL_CATEGORY_STYLE !== 'undefined' && typeof getNodeTenantCategory === 'function') {
    const style = MINIMAL_CATEGORY_STYLE[getNodeTenantCategory(node)];
    if (style) { iconHref = style.icon; fill = style.fill; }
  }
  icon.setAttribute('href', iconHref);
  shape.setAttribute('fill', fill);

  const levelName = { 1: 'Planta Baja', 2: 'Nivel 1', 3: 'Nivel 2' };
  let levelLabel = levelName[node.level] || `Nivel ${node.level}`;
  // En un tramo intermedio el pin marca la escalera/elevador, no el destino final
  if (seg && seg.isFinal === false && seg.targetLevel) {
    levelLabel = `${seg.targetLevel > node.level ? 'Sube' : 'Baja'} a ${levelName[seg.targetLevel] || `Nivel ${seg.targetLevel}`}`;
  }
  const rawName = (node.name || 'Destino').replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\([^)]*↔[^)]*\)/g, '').trim();
  title.textContent = rawName.length > 24 ? `${rawName.slice(0, 23)}…` : rawName;
  sub.textContent = levelLabel;

  // Ancho segun el texto; la tarjeta se voltea a la izquierda si no cabe a la derecha del pin
  const textW = Math.max(title.getComputedTextLength ? title.getComputedTextLength() : 0, sub.getComputedTextLength ? sub.getComputedTextLength() : 0);
  const cardW = Math.max(72, Math.ceil(textW) + 20);
  // "A la derecha en pantalla" es +x del mapa en horizontal y +y del mapa en vertical
  const spec = (typeof FLOOR_SPECS !== 'undefined' && FLOOR_SPECS[node.level]) || { width: 1536, height: 718 };
  const reach = (18 + cardW) * (typeof currentPinK === 'number' ? currentPinK : 1);
  const flip = vertical ? (y + reach > spec.height - 16) : (x + reach > spec.width - 36);
  const left = flip ? -18 - cardW : 18;
  bg.setAttribute('width', cardW);
  bg.setAttribute('x', left);
  title.setAttribute('x', left + 10);
  sub.setAttribute('x', left + 10);
}

// Coloca el marcador "Estas aqui" sobre el totem activo; solo se ve en el nivel de ese totem
function syncTotemMarker() {
  const el = document.getElementById('svg-totem-marker');
  if (!el) return;
  const t = typeof getActiveTotem === 'function' ? getActiveTotem() : null;
  if (!t || t.level !== currentLevel || isEditorMode) {
    el.style.display = 'none';
    return;
  }
  const { x, y } = t.coordinates;
  el.style.display = 'block';
  const scaleWrap = el.querySelector('.mm-scale-totem');
  const disc = el.querySelector('circle');
  const pin = el.querySelector('text');
  if (scaleWrap) scaleWrap.style.transformOrigin = `${x}px ${y}px`;
  if (disc) { disc.setAttribute('cx', x); disc.setAttribute('cy', y); }
  if (pin) { pin.setAttribute('x', x); pin.setAttribute('y', y + 4.5); }
  if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
    el.setAttribute('transform', `rotate(90, ${x}, ${y})`);
  } else {
    el.removeAttribute('transform');
  }
}

function renderMapOverlay(animate = false) {
  if (!mallGraph) return;

  const nodesLayer = document.getElementById('svg-nodes-layer');
  const edgesLayer = document.getElementById('svg-edges-layer');
  const waterBedEl = document.getElementById('svg-water-bed');
  const pathEl = document.getElementById('svg-active-route');
  const chevronsEl = document.getElementById('svg-chevrons-path');
  const destPinEl = document.getElementById('svg-dest-pin');
  const totemMarkerEl = document.getElementById('svg-totem-marker');

  if (!nodesLayer || !edgesLayer) return;

  nodesLayer.innerHTML = '';
  edgesLayer.innerHTML = '';

  // Clear or prepare tether layer for logo position editor
  const oldTether = document.getElementById('svg-editor-tether-layer');
  if (oldTether) oldTether.innerHTML = '';

  // Nodes and store logos are always visible for user orientation during navigation
  nodesLayer.style.display = (isEditorMode || showStoresAndRestaurants) ? 'block' : 'none';
  edgesLayer.style.display = isEditorMode ? 'block' : 'none';

  // Marcador "Estas aqui" del totem activo (en el nivel donde este)
  syncTotemMarker();

  // Draw Vector Walkable Corridors & Graph Edges (ONLY when in Editor Mode)
  if (isEditorMode) {
    const drawn = new Set();
    const floorEdges = levelGraphs[currentLevel] || {};
    Object.values(floorEdges).forEach(edgeList => {
      edgeList.forEach(e => {
        const u = levelNodes[currentLevel] && levelNodes[currentLevel][e.from];
        const v = levelNodes[currentLevel] && levelNodes[currentLevel][e.to];
        if (u && v) {
          const key = [u.id, v.id].sort().join('--');
          if (!drawn.has(key)) {
            drawn.add(key);

            // 1. Dark casing road line for graph definition in editor
            const casing = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            casing.setAttribute('data-edge-u', u.id);
            casing.setAttribute('data-edge-v', v.id);
            casing.setAttribute('x1', u.coordinates.x);
            casing.setAttribute('y1', u.coordinates.y);
            casing.setAttribute('x2', v.coordinates.x);
            casing.setAttribute('y2', v.coordinates.y);
            casing.setAttribute('stroke', 'rgba(15, 23, 42, 0.85)');
            casing.setAttribute('stroke-width', '8');
            casing.setAttribute('stroke-linecap', 'round');
            edgesLayer.appendChild(casing);

            // 2. High-precision vector corridor centerline
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('data-edge-u', u.id);
            line.setAttribute('data-edge-v', v.id);
            line.setAttribute('x1', u.coordinates.x);
            line.setAttribute('y1', u.coordinates.y);
            line.setAttribute('x2', v.coordinates.x);
            line.setAttribute('y2', v.coordinates.y);
            line.setAttribute('stroke', '#38bdf8');
            line.setAttribute('stroke-width', '3.2');
            line.setAttribute('stroke-linecap', 'round');
            edgesLayer.appendChild(line);
          }
        }
      });
    });
  }

  // Draw Nodes for current level
  const currentFloorNodes = levelNodes[currentLevel] || {};
  const minTiers = (MINIMAL_MAP && !isEditorMode) ? computeMinTiers(Object.values(currentFloorNodes)) : {};
  // Mientras se camina la ruta (Iniciar Ruta/GPS), solo se ve la tienda destino: el resto se
  // esconde para no distraer. No aplica solo con elegir destino, nada mas al arrancar la caminata.
  const navigatingDestId = isSimulating && routeSegments.length
    ? routeSegments[routeSegments.length - 1].goal.id
    : null;
  Object.values(currentFloorNodes).forEach(n => {
    const isWaypoint = n.id.startsWith('n_lvl1_c_') || n.id.startsWith('n_lvl2_c_') || n.id.startsWith('n_lvl3_c_') || n.type === 'corridor_waypoint' || n.type === 'waypoint';

    // In normal mode, waypoints are invisible navigation guides
    // In Editor Mode (Graph SubMode), waypoints are fully interactive draggable nodes!
    if (!isEditorMode && isWaypoint) {
      return;
    }
    // En modo normal solo se muestra el marcador del totem activo, no el nodo de cada totem
    if (!isEditorMode && n.type === 'totem') {
      return;
    }

    const cat = getNodeCategoryGroup(n);
    const isCategoryMatch = currentCategoryFilter === 'all' || cat === currentCategoryFilter;

    // Si hay un filtro activo y el nodo no pertenece a esa categoría, ocultarlo por completo (no mostrar con transparencia)
    if (!isEditorMode && !isCategoryMatch) {
      return;
    }

    // Caminando la ruta: se esconden los demas locales (no las escaleras/elevadores/servicios)
    if (navigatingDestId && ['store', 'anchor_store', 'island'].includes(n.type) && n.id !== navigatingDestId) {
      return;
    }

    // Visual Position
    const logoPos = typeof getNodeLogoPosition === 'function' ? getNodeLogoPosition(n) : n.coordinates;
    const isLogoMode = isEditorMode && editorSubMode === 'logos';
    const posX = isLogoMode ? logoPos.x : n.coordinates.x;
    const posY = isLogoMode ? logoPos.y : n.coordinates.y;

    const isSelected = isEditorMode && selectedEditorNodeId === n.id;
    const isConnectSource = isEditorMode && editorConnectSourceNodeId === n.id;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', isEditorMode ? 'map-node-interactive map-node-editable' : 'map-node-interactive');
    g.style.opacity = '1';
    if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
      g.setAttribute('transform', `rotate(90, ${posX}, ${posY})`);
    }

    // Interactive Hit Area
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hitArea.setAttribute('cx', posX);
    hitArea.setAttribute('cy', posY);
    hitArea.setAttribute('r', isEditorMode ? '22' : '18');
    hitArea.setAttribute('fill', 'transparent');
    hitArea.style.pointerEvents = 'all';
    hitArea.style.cursor = isEditorMode ? 'grab' : 'pointer';
    g.appendChild(hitArea);

    g.addEventListener('click', (e) => {
      if (isEditorMode) {
        e.stopPropagation();
        e.preventDefault();
        if (typeof handleNodeClickInEditor === 'function') {
          handleNodeClickInEditor(n);
        }
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      showNodePopup(n);
    });

    if (isWaypoint) {
      // RENDERING WAYPOINT NODES IN GRAPH STUDIO
      g.setAttribute('data-graph-node-id', n.id);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', posX);
      circle.setAttribute('cy', posY);
      circle.setAttribute('r', isSelected || isConnectSource ? '9' : '6.5');
      circle.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#06b6d4'));
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', isSelected || isConnectSource ? '2.5' : '1.8');
      if (isSelected || isConnectSource) {
        circle.style.filter = 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.9))';
      }

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Punto Guía: ${n.name || n.id} (Arrastra para mover o toca para enlazar)`;
      g.appendChild(title);
      g.appendChild(circle);

    } else if (n.type === 'portal_escalator' || n.type === 'portal_elevator') {
      g.setAttribute('data-graph-node-id', n.id);
      const isEsc = n.type === 'portal_escalator';
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', posX - 12);
      rect.setAttribute('y', posY - 12);
      rect.setAttribute('width', 24);
      rect.setAttribute('height', 24);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : (isEsc ? '#0891b2' : '#2563eb')));
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', isSelected || isConnectSource ? '2.5' : '1.6');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', isEsc ? '#vec-icon-stairs' : '#vec-icon-elevator');
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name} (${isEsc ? 'Escaleras Eléctricas' : 'Elevador'})`;
      g.appendChild(title);
      g.appendChild(rect);
      g.appendChild(useIcon);

    } else if (isEditorMode && (n.type === 'store' || n.type === 'anchor_store' || n.type === 'island' || n.type === 'totem')) {
      // ESTUDIO: los locales se dibujan como asas simples de color por tipo, faciles de agarrar
      g.setAttribute('data-graph-node-id', n.id);
      const handleFill = { store: '#f59e0b', anchor_store: '#f97316', island: '#38bdf8', totem: '#ef4444' }[n.type];
      if (isSelected) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', posX);
        ring.setAttribute('cy', posY);
        ring.setAttribute('r', '13');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#fdf1db');
        ring.setAttribute('stroke-width', '2.5');
        g.appendChild(ring);
      }
      if (n.type === 'totem') {
        const isActiveTotem = n.id === TOTEM_NODE_ID;
        const totemLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        totemLabel.setAttribute('x', posX + 12);
        totemLabel.setAttribute('y', posY + 4);
        totemLabel.setAttribute('font-size', '11');
        totemLabel.setAttribute('font-weight', '800');
        totemLabel.setAttribute('fill', isActiveTotem ? '#fdf1db' : '#fca5a5');
        totemLabel.textContent = `${totemDisplayName(n)}${isActiveTotem ? ' ★' : ''}`;
        g.appendChild(totemLabel);
      }
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('cx', posX);
      handle.setAttribute('cy', posY);
      handle.setAttribute('r', '7.5');
      handle.setAttribute('fill', isConnectSource ? '#10b981' : handleFill);
      handle.setAttribute('stroke', '#ffffff');
      handle.setAttribute('stroke-width', '1.8');
      const handleTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      handleTitle.textContent = `${n.name || n.id} (${n.id})`;
      g.appendChild(handleTitle);
      g.appendChild(handle);

    } else if (MINIMAL_MAP && (n.type === 'store' || n.type === 'anchor_store' || n.type === 'island')) {
      // MAPA MINIMALISTA: circulo con icono de categoria; el logo solo vive en la ficha y el destino
      g.setAttribute('data-graph-node-id', n.id);
      const style = MINIMAL_CATEGORY_STYLE[getNodeTenantCategory(n)] || MINIMAL_CATEGORY_STYLE.other;
      const isAnchor = n.type === 'anchor_store';
      const r = isSelected || isConnectSource ? 12 : (isAnchor ? 11 : 9);

      hitArea.setAttribute('r', '26');
      if (minTiers[n.id]) g.setAttribute('data-mintier', String(minTiers[n.id]));
      // El icono mantiene un tamano casi constante en pantalla: --mm-icon-k lo ajusta segun el zoom
      const ico = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ico.setAttribute('class', 'mm-ico');
      ico.style.transformOrigin = `${posX}px ${posY}px`;

      const disc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      disc.setAttribute('cx', posX);
      disc.setAttribute('cy', posY);
      disc.setAttribute('r', r);
      disc.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : style.fill));
      disc.setAttribute('stroke', 'rgba(255,255,255,0.55)');
      disc.setAttribute('stroke-width', '1.2');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', style.icon);
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);
      useIcon.setAttribute('transform', `translate(${posX} ${posY}) scale(${isAnchor ? 1.15 : 1}) translate(${-posX} ${-posY})`);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = isEditorMode ? `${n.name} (Arrastra para mover o toca para enlazar arista)` : `${n.name} (Toca para trazar ruta)`;
      g.appendChild(title);
      ico.appendChild(disc);
      ico.appendChild(useIcon);
      g.appendChild(ico);

    } else if (n.logo) {
      // OFFICIAL LUXURY BRAND BADGE WITH PURE VECTOR SVG
      const isAnchor = n.type === 'anchor_store';
      const isIsland = n.type === 'island';
      const bw = isAnchor ? 54 : (isIsland ? 32 : 42);
      const bh = isAnchor ? 38 : (isIsland ? 24 : 30);
      const rx = isAnchor ? 10 : (isIsland ? 6 : 8);
      const padX = isAnchor ? 6 : (isIsland ? 3.5 : 4.5);
      const padY = isAnchor ? 5 : (isIsland ? 3 : 3.5);
      const logoW = bw - (padX * 2);
      const logoH = bh - (padY * 2);
      const logoX = posX - (bw / 2) + padX;
      const logoY = posY - (bh / 2) + padY;

      // Vector shadow
      const shadowRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shadowRect.setAttribute('x', posX - bw / 2 + 1.2);
      shadowRect.setAttribute('y', posY - bh / 2 + 2);
      shadowRect.setAttribute('width', bw);
      shadowRect.setAttribute('height', bh);
      shadowRect.setAttribute('rx', rx);
      shadowRect.setAttribute('fill', 'rgba(0, 0, 0, 0.65)');

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', posX - bw / 2);
      bgRect.setAttribute('y', posY - bh / 2);
      bgRect.setAttribute('width', bw);
      bgRect.setAttribute('height', bh);
      bgRect.setAttribute('rx', rx);
      bgRect.setAttribute('fill', '#ffffff');
      bgRect.setAttribute('stroke', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : (isEditorMode ? '#f59e0b' : (isAnchor ? '#0284c7' : 'rgba(203, 213, 225, 0.9)'))));
      bgRect.setAttribute('stroke-width', isSelected || isConnectSource ? '3.0' : (isEditorMode ? '2.5' : (isAnchor ? '2.2' : '1.3')));

      g.setAttribute('data-logo-node-id', n.id);
      g.setAttribute('data-graph-node-id', n.id);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = isEditorMode ? `${n.name} (Arrastra para mover o toca para enlazar arista)` : `${n.name} (Toca para trazar ruta)`;
      g.appendChild(title);
      g.appendChild(shadowRect);
      g.appendChild(bgRect);

      const imgEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      imgEl.setAttribute('href', n.logo);
      imgEl.setAttribute('x', logoX);
      imgEl.setAttribute('y', logoY);
      imgEl.setAttribute('width', logoW);
      imgEl.setAttribute('height', logoH);
      imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      imgEl.setAttribute('shape-rendering', 'geometricPrecision');
      imgEl.style.imageRendering = '-webkit-optimize-contrast';
      g.appendChild(imgEl);

      // In Editor mode, draw node center anchor pin if in graph mode
      if (isEditorMode && editorSubMode === 'graph') {
        const anchorDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        anchorDot.setAttribute('cx', n.coordinates.x);
        anchorDot.setAttribute('cy', n.coordinates.y);
        anchorDot.setAttribute('r', '5');
        anchorDot.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#ef4444'));
        anchorDot.setAttribute('stroke', '#ffffff');
        anchorDot.setAttribute('stroke-width', '1.5');
        g.appendChild(anchorDot);
      }

      // Draw tether indicator line in editor mode or if offset
      if (typeof updateEditorTetherLine === 'function' && (isEditorMode || posX !== n.coordinates.x || posY !== n.coordinates.y)) {
        updateEditorTetherLine(n, posX, posY);
      }
    } else if (n.type === 'anchor_store') {
      g.setAttribute('data-graph-node-id', n.id);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', posX - 11);
      rect.setAttribute('y', posY - 11);
      rect.setAttribute('width', 22);
      rect.setAttribute('height', 22);
      rect.setAttribute('rx', 5);
      rect.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#f97316'));
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', '1.8');

      const lower = (n.name || '').toLowerCase();
      let iconHref = '#vec-icon-bag';
      if (lower.includes('cine')) iconHref = '#vec-icon-film';
      else if (lower.includes('chedraui')) iconHref = '#vec-icon-cart';

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', iconHref);
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name}`;
      g.appendChild(title);
      g.appendChild(rect);
      g.appendChild(useIcon);
    } else if (cat === 'coffee' || cat === 'food') {
      g.setAttribute('data-graph-node-id', n.id);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', posX);
      circle.setAttribute('cy', posY);
      circle.setAttribute('r', isSelected || isConnectSource ? '11' : '8');
      circle.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : (cat === 'coffee' ? '#059669' : '#ea580c')));
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '1.6');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', cat === 'coffee' ? '#vec-icon-coffee' : '#vec-icon-food');
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name}`;
      g.appendChild(title);
      g.appendChild(circle);
      g.appendChild(useIcon);
    } else if (n.type === 'restroom' || n.id.includes('restroom') || (n.name || '').toLowerCase().includes('sanitario') || (n.name || '').toLowerCase().includes('baño')) {
      // DEDICATED RESTROOM BADGE
      g.setAttribute('data-graph-node-id', n.id);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', posX);
      circle.setAttribute('cy', posY);
      circle.setAttribute('r', isSelected || isConnectSource ? '11' : '8.5');
      circle.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#eab308'));
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', isSelected || isConnectSource ? '2.5' : '1.6');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', '#vec-icon-restroom');
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name || 'Sanitarios'}`;
      g.appendChild(title);
      g.appendChild(circle);
      g.appendChild(useIcon);

    } else if (n.type === 'service' || n.type === 'admin' || n.id.includes('admin') || n.id.includes('maint') || (n.name || '').toLowerCase().includes('admin') || (n.name || '').toLowerCase().includes('mantenimiento')) {
      // DEDICATED ADMINISTRATION & SERVICES BADGE
      g.setAttribute('data-graph-node-id', n.id);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', posX - 10);
      rect.setAttribute('y', posY - 10);
      rect.setAttribute('width', 20);
      rect.setAttribute('height', 20);
      rect.setAttribute('rx', 5);
      rect.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#6366f1'));
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', isSelected || isConnectSource ? '2.5' : '1.6');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', '#vec-icon-admin');
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name || 'Administración / Servicios'}`;
      g.appendChild(title);
      g.appendChild(rect);
      g.appendChild(useIcon);

    } else if (n.type === 'parking' || n.id.includes('parking') || (n.name || '').toLowerCase().includes('estacionamiento') || (n.name || '').toLowerCase().includes('parking')) {
      // DEDICATED PARKING BADGE
      g.setAttribute('data-graph-node-id', n.id);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', posX - 10);
      rect.setAttribute('y', posY - 10);
      rect.setAttribute('width', 20);
      rect.setAttribute('height', 20);
      rect.setAttribute('rx', 5);
      rect.setAttribute('fill', isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#2563eb'));
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', isSelected || isConnectSource ? '2.5' : '1.6');

      const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      useIcon.setAttribute('href', '#vec-icon-parking');
      useIcon.setAttribute('x', posX);
      useIcon.setAttribute('y', posY);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name || 'Estacionamiento'}`;
      g.appendChild(title);
      g.appendChild(rect);
      g.appendChild(useIcon);

    } else {
      g.setAttribute('data-graph-node-id', n.id);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', posX);
      circle.setAttribute('cy', posY);

      let r = isSelected || isConnectSource ? '8.5' : '6';
      let fill = isConnectSource ? '#10b981' : (isSelected ? '#f59e0b' : '#3b82f6');
      if (n.type === 'island') { r = '7'; fill = '#38bdf8'; }
      else if (cat === 'fashion') { fill = '#8b5cf6'; }

      circle.setAttribute('r', r);
      circle.setAttribute('fill', fill);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', isSelected || isConnectSource ? '2.2' : '1.4');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.name || n.id}`;
      g.appendChild(title);
      g.appendChild(circle);
    }

    if (!isCategoryMatch && isEditorMode) {
      g.style.opacity = '0.22';
      g.style.filter = 'grayscale(80%)';
      g.style.pointerEvents = 'none';
    } else {
      g.style.opacity = '1';
      g.style.filter = 'none';
      g.style.pointerEvents = 'all';
    }

    // ESTUDIO: todas las asas mantienen un tamano constante en pantalla (--mm-handle-k), aunque se aleje el zoom
    if (isEditorMode) {
      const handleWrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      handleWrap.setAttribute('class', 'mm-handle');
      handleWrap.style.transformOrigin = `${posX}px ${posY}px`;
      Array.from(g.childNodes).forEach(c => { if (c !== hitArea && c.nodeName !== 'title') handleWrap.appendChild(c); });
      g.appendChild(handleWrap);
    }

    // Escaleras, elevadores, sanitarios y servicios: mismo criterio de tamano que los locales, un poco menores
    if (MINIMAL_MAP && !isEditorMode && !isWaypoint && !g.querySelector('.mm-ico')) {
      hitArea.setAttribute('r', '26');
      const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wrap.setAttribute('class', 'mm-scale-sm');
      wrap.style.transformOrigin = `${posX}px ${posY}px`;
      Array.from(g.childNodes).forEach(c => { if (c !== hitArea && c.nodeName !== 'title') wrap.appendChild(c); });
      g.appendChild(wrap);
    }

    nodesLayer.appendChild(g);
  });

  // Draw Modern Pedestrian Navigation Route (solid line)
  const activeSeg = routeSegments.find(s => s.level === currentLevel);
  if (activeSeg && activeSeg.path.length > 0 && waterBedEl && pathEl && destPinEl) {
    let d = '';
    activeSeg.path.forEach((node, i) => {
      d += (i === 0 ? 'M ' : 'L ') + `${node.coordinates.x} ${node.coordinates.y} `;
    });

    waterBedEl.setAttribute('d', d);
    pathEl.setAttribute('d', d);
    if (chevronsEl) chevronsEl.setAttribute('d', '');

    if (animate && typeof NavAnimator !== 'undefined') {
      NavAnimator.animateRoutePath();
    }

    // Position Destination Target Pin
    const lastNode = activeSeg.path[activeSeg.path.length - 1];
    destPinEl.style.display = 'block';
    renderDestinationCard(lastNode, activeSeg);

    // La rotacion del pin la maneja renderDestinationCard (dentro del ancla)
    destPinEl.removeAttribute('transform');
    syncTotemMarker();

    if (animate && typeof NavAnimator !== 'undefined') {
      NavAnimator.popInDestinationPin();
    }
  } else {
    if (waterBedEl) waterBedEl.setAttribute('d', '');
    if (pathEl) pathEl.setAttribute('d', '');
    if (chevronsEl) chevronsEl.setAttribute('d', '');
    if (destPinEl) destPinEl.style.display = 'none';
  }

  if (typeof updateMapScaleVars === 'function') updateMapScaleVars(true);

  // Position Navigation Arrow on active step
  if (currentSteps.length > 0 && currentSteps[currentStepIndex]) {
    const step = currentSteps[currentStepIndex];
    positionNavArrowOnNode(step.node, step.nextNode, false);
  }
}

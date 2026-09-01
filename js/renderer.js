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

  // Display or hide nodes layer based on showStoresAndRestaurants
  nodesLayer.style.display = showStoresAndRestaurants ? (isSimulating ? 'none' : 'block') : 'none';
  edgesLayer.style.display = 'block';

  // Draw Totem 📍 Pin ONLY on Level 2 (Nivel 1)
  if (totemMarkerEl) {
    totemMarkerEl.style.display = currentLevel === 2 ? 'block' : 'none';
  }

  // Draw Vector Walkable Corridors & Crisp Architectural Edges
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

          // 1. Subtle dark casing road line for architectural definition
          const casing = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          casing.setAttribute('x1', u.coordinates.x);
          casing.setAttribute('y1', u.coordinates.y);
          casing.setAttribute('x2', v.coordinates.x);
          casing.setAttribute('y2', v.coordinates.y);
          casing.setAttribute('stroke', 'rgba(15, 23, 42, 0.6)');
          casing.setAttribute('stroke-width', '6.5');
          casing.setAttribute('stroke-linecap', 'round');
          edgesLayer.appendChild(casing);

          // 2. High-precision vector corridor centerline
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', u.coordinates.x);
          line.setAttribute('y1', u.coordinates.y);
          line.setAttribute('x2', v.coordinates.x);
          line.setAttribute('y2', v.coordinates.y);
          line.setAttribute('stroke', 'rgba(56, 189, 248, 0.28)');
          line.setAttribute('stroke-width', '2.2');
          line.setAttribute('stroke-linecap', 'round');
          edgesLayer.appendChild(line);
        }
      }
    });
  });

  // Draw Nodes for current level
  const currentFloorNodes = levelNodes[currentLevel] || {};
  Object.values(currentFloorNodes).forEach(n => {
    if (n.type !== 'totem' && !n.id.startsWith('n_lvl1_c_') && !n.id.startsWith('n_lvl2_c_') && !n.id.startsWith('n_lvl3_c_')) {
      const cat = getNodeCategoryGroup(n);
      const isCategoryMatch = currentCategoryFilter === 'all' || cat === currentCategoryFilter;

      // Calculate Visual Position (support custom dragged offset or default navigation node position)
      const logoPos = typeof getNodeLogoPosition === 'function' ? getNodeLogoPosition(n) : n.coordinates;
      const posX = logoPos.x;
      const posY = logoPos.y;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', isEditorMode ? 'map-node-interactive map-node-editable' : 'map-node-interactive');
      g.style.opacity = isCategoryMatch ? '1' : '0.15';
      if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
        g.setAttribute('transform', `rotate(90, ${posX}, ${posY})`);
      }

      // Invisible enlarged hit area for effortless clicking and drag & drop
      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitArea.setAttribute('cx', posX);
      hitArea.setAttribute('cy', posY);
      hitArea.setAttribute('r', isEditorMode ? '24' : '18');
      hitArea.setAttribute('fill', 'transparent');
      hitArea.style.pointerEvents = 'all';
      hitArea.style.cursor = isEditorMode ? 'grab' : 'pointer';
      g.appendChild(hitArea);

      g.addEventListener('click', (e) => {
        if (isEditorMode) return;
        e.stopPropagation();
        e.preventDefault();
        showNodePopup(n);
      });

      if (n.type === 'portal_escalator' || n.type === 'portal_elevator') {
        const isEsc = n.type === 'portal_escalator';
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', posX - 11);
        rect.setAttribute('y', posY - 11);
        rect.setAttribute('width', 22);
        rect.setAttribute('height', 22);
        rect.setAttribute('rx', 6);
        rect.setAttribute('fill', isEsc ? '#0891b2' : '#2563eb');
        rect.setAttribute('stroke', '#ffffff');
        rect.setAttribute('stroke-width', '1.6');

        const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useIcon.setAttribute('href', isEsc ? '#vec-icon-stairs' : '#vec-icon-elevator');
        useIcon.setAttribute('x', posX);
        useIcon.setAttribute('y', posY);

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${n.name} (${isEsc ? 'Escaleras Eléctricas' : 'Elevador'})`;
        g.appendChild(title);
        g.appendChild(rect);
        g.appendChild(useIcon);
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
        bgRect.setAttribute('stroke', isEditorMode ? '#f59e0b' : (isAnchor ? '#0284c7' : 'rgba(203, 213, 225, 0.9)'));
        bgRect.setAttribute('stroke-width', isEditorMode ? '2.5' : (isAnchor ? '2.2' : '1.3'));

        g.setAttribute('data-logo-node-id', n.id);

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = isEditorMode ? `${n.name} (Arrastra para mover posición visual)` : `${n.name} (Toca para trazar ruta)`;
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

        // Draw tether indicator line in editor mode or if offset
        if (typeof updateEditorTetherLine === 'function' && (isEditorMode || posX !== n.coordinates.x || posY !== n.coordinates.y)) {
          updateEditorTetherLine(n, posX, posY);
        }
      } else if (n.type === 'anchor_store') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', posX - 11);
        rect.setAttribute('y', posY - 11);
        rect.setAttribute('width', 22);
        rect.setAttribute('height', 22);
        rect.setAttribute('rx', 5);
        rect.setAttribute('fill', '#f97316');
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
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', posX);
        circle.setAttribute('cy', posY);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', cat === 'coffee' ? '#059669' : '#ea580c');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '1.4');

        const useIcon = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useIcon.setAttribute('href', cat === 'coffee' ? '#vec-icon-coffee' : '#vec-icon-food');
        useIcon.setAttribute('x', posX);
        useIcon.setAttribute('y', posY);

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${n.name}`;
        g.appendChild(title);
        g.appendChild(circle);
        g.appendChild(useIcon);
      } else {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', posX);
        circle.setAttribute('cy', posY);

        let r = 5.5;
        let fill = '#3b82f6';
        if (n.type === 'island') { r = 6; fill = '#38bdf8'; }
        else if (cat === 'fashion') { fill = '#8b5cf6'; }
        else { fill = '#10b981'; }

        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '1.4');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${n.name || n.id}`;
        g.appendChild(title);
        g.appendChild(circle);
      }

      nodesLayer.appendChild(g);
    }
  });

  // Draw Google Maps Blue River Route & Animated Chevrons
  const activeSeg = routeSegments.find(s => s.level === currentLevel);
  if (activeSeg && activeSeg.path.length > 0 && waterBedEl && pathEl && chevronsEl && destPinEl) {
    let d = '';
    activeSeg.path.forEach((node, i) => {
      d += (i === 0 ? 'M ' : 'L ') + `${node.coordinates.x} ${node.coordinates.y} `;
    });

    waterBedEl.setAttribute('d', d);
    pathEl.setAttribute('d', d);
    chevronsEl.setAttribute('d', d);

    if (animate && typeof NavAnimator !== 'undefined') {
      NavAnimator.animateRoutePath();
    }

    // Position Destination Target Pin
    const lastNode = activeSeg.path[activeSeg.path.length - 1];
    destPinEl.style.display = 'block';
    const dpOuter = document.getElementById('dest-pin-outer');
    const dpInner = document.getElementById('dest-pin-inner');
    const dpLabel = document.getElementById('dest-pin-label');
    if (dpOuter) { dpOuter.setAttribute('cx', lastNode.coordinates.x); dpOuter.setAttribute('cy', lastNode.coordinates.y); }
    if (dpInner) { dpInner.setAttribute('cx', lastNode.coordinates.x); dpInner.setAttribute('cy', lastNode.coordinates.y); }
    if (dpLabel) {
      dpLabel.setAttribute('x', lastNode.coordinates.x);
      dpLabel.setAttribute('y', lastNode.coordinates.y - 14);
      dpLabel.textContent = lastNode.name || 'Destino';
    }

    if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
      destPinEl.setAttribute('transform', `rotate(90, ${lastNode.coordinates.x}, ${lastNode.coordinates.y})`);
      if (totemMarkerEl) totemMarkerEl.setAttribute('transform', 'rotate(90, 960, 510)');
    } else {
      destPinEl.removeAttribute('transform');
      if (totemMarkerEl) totemMarkerEl.removeAttribute('transform');
    }

    if (animate && typeof NavAnimator !== 'undefined') {
      NavAnimator.popInDestinationPin();
    }
  } else {
    if (waterBedEl) waterBedEl.setAttribute('d', '');
    if (pathEl) pathEl.setAttribute('d', '');
    if (chevronsEl) chevronsEl.setAttribute('d', '');
    if (destPinEl) destPinEl.style.display = 'none';
  }

  // Position Navigation Arrow on active step
  if (currentSteps.length > 0 && currentSteps[currentStepIndex]) {
    const step = currentSteps[currentStepIndex];
    positionNavArrowOnNode(step.node, step.nextNode, false);
  }
}

/**
 * Paseo Altozano · Visual Logo Placement Editor (Drag & Drop Engine)
 */

let activeDraggedNodeId = null;
let dragOffsetSvgX = 0;
let dragOffsetSvgY = 0;

function initLogoPositions() {
  try {
    const saved = localStorage.getItem('altozano_custom_logo_positions');
    if (saved) {
      customLogoPositions = JSON.parse(saved);
      AltozanoState.customLogoPositions = customLogoPositions;
    }
  } catch (e) {
    console.warn("Could not load custom logo positions:", e);
  }
}

function saveLogoPositionsToStorage() {
  try {
    localStorage.setItem('altozano_custom_logo_positions', JSON.stringify(customLogoPositions));
  } catch (e) {
    console.warn("Could not save custom logo positions:", e);
  }
}

function getNodeLogoPosition(node) {
  if (!node) return { x: 0, y: 0 };
  if (customLogoPositions && customLogoPositions[node.id]) {
    return customLogoPositions[node.id];
  }
  if (node.logo_position) {
    return node.logo_position;
  }
  return { x: node.coordinates.x, y: node.coordinates.y };
}

function screenToSvgCoordinates(screenX, screenY) {
  const vp = getMapViewport();
  const rotRad = (currentCamera.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(-rotRad);
  const sin = Math.sin(-rotRad);
  
  // Inverse Pan
  const dx = screenX - currentCamera.panX;
  const dy = screenY - currentCamera.panY;
  
  // Inverse Rotation & Scale
  const localX = (dx * cos - dy * sin) / currentCamera.scale;
  const localY = (dx * sin + dy * cos) / currentCamera.scale;
  
  // Map from viewport bounding box to raw SVG viewBox (1536 x spec.height)
  const u = (localX - vp.offsetX) / vp.renderW;
  const v = (localY - vp.offsetY) / vp.renderH;
  
  const rawX = Math.round(u * vp.spec.width);
  const rawY = Math.round(v * vp.spec.height);
  
  return {
    x: Math.max(0, Math.min(vp.spec.width, rawX)),
    y: Math.max(0, Math.min(vp.spec.height, rawY))
  };
}

function toggleEditorMode() {
  isEditorMode = !isEditorMode;
  AltozanoState.isEditorMode = isEditorMode;

  const btn = document.getElementById('btn-editor-mode-toggle');
  const btnText = document.getElementById('btn-editor-mode-text');
  const hud = document.getElementById('editor-hud-bar');

  if (isEditorMode) {
    if (btn) btn.className = "px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/25 border border-amber-300";
    if (btnText) btnText.innerText = "Modo Edición ACTIVO";
    if (hud) hud.classList.remove('hidden');
    triggerHaptic('medium');
  } else {
    if (btn) btn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border border-slate-700";
    if (btnText) btnText.innerText = "Editar Ubicación de Logos";
    if (hud) hud.classList.add('hidden');
    triggerHaptic('light');
  }

  renderMapOverlay();
}

function setupEditorDragListeners() {
  const container = document.getElementById('map-container');
  if (!container) return;

  function handleDragStart(clientX, clientY, target) {
    if (!isEditorMode) return;
    const logoGroup = target.closest('[data-logo-node-id]');
    if (!logoGroup) return;

    const nodeId = logoGroup.getAttribute('data-logo-node-id');
    const node = levelNodes[currentLevel] && levelNodes[currentLevel][nodeId];
    if (!node) return;

    activeDraggedNodeId = nodeId;
    selectedEditorNodeId = nodeId;
    container.classList.add('is-logo-dragging');

    const rect = container.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const svgPoint = screenToSvgCoordinates(screenX, screenY);
    const currentPos = getNodeLogoPosition(node);

    dragOffsetSvgX = svgPoint.x - currentPos.x;
    dragOffsetSvgY = svgPoint.y - currentPos.y;

    updateEditorHudInfo(node, currentPos);
    triggerHaptic('light');
    return true;
  }

  function handleDragMove(clientX, clientY) {
    if (!isEditorMode || !activeDraggedNodeId) return;

    const node = levelNodes[currentLevel] && levelNodes[currentLevel][activeDraggedNodeId];
    if (!node) return;

    const rect = container.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const svgPoint = screenToSvgCoordinates(screenX, screenY);

    const newX = svgPoint.x - dragOffsetSvgX;
    const newY = svgPoint.y - dragOffsetSvgY;

    customLogoPositions[activeDraggedNodeId] = { x: newX, y: newY };
    AltozanoState.customLogoPositions = customLogoPositions;

    updateLogoElementTransform(node, newX, newY);
    updateEditorHudInfo(node, { x: newX, y: newY });
  }

  function handleDragEnd() {
    if (!activeDraggedNodeId) return;
    container.classList.remove('is-logo-dragging');
    saveLogoPositionsToStorage();
    activeDraggedNodeId = null;
    renderMapOverlay();
    triggerHaptic('light');
  }

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('#map-node-popup') || e.target.closest('#editor-hud-bar')) return;
    if (isEditorMode && e.target.closest('[data-logo-node-id]')) {
      e.stopPropagation();
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY, e.target);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (activeDraggedNodeId) {
      e.preventDefault();
      e.stopPropagation();
      handleDragMove(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (activeDraggedNodeId) {
      handleDragEnd();
    }
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      if (e.touches[0].target.closest('#map-node-popup') || e.touches[0].target.closest('#editor-hud-bar')) return;
      if (isEditorMode && e.touches[0].target.closest('[data-logo-node-id]')) {
        e.stopPropagation();
        e.preventDefault();
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.touches[0].target);
      }
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (activeDraggedNodeId && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  container.addEventListener('touchend', () => {
    if (activeDraggedNodeId) {
      handleDragEnd();
    }
  });
}

function updateLogoElementTransform(node, posX, posY) {
  const g = document.querySelector(`[data-logo-node-id="${node.id}"]`);
  if (!g) return;

  const isAnchor = node.type === 'anchor_store';
  const isIsland = node.type === 'island';
  const bw = isAnchor ? 54 : (isIsland ? 32 : 42);
  const bh = isAnchor ? 38 : (isIsland ? 24 : 30);
  const rx = isAnchor ? 10 : (isIsland ? 6 : 8);
  const padX = isAnchor ? 6 : (isIsland ? 3.5 : 4.5);
  const padY = isAnchor ? 5 : (isIsland ? 3 : 3.5);
  const logoW = bw - (padX * 2);
  const logoH = bh - (padY * 2);
  const logoX = posX - (bw / 2) + padX;
  const logoY = posY - (bh / 2) + padY;

  const shadowRect = g.querySelector('rect:nth-of-type(1)');
  const bgRect = g.querySelector('rect:nth-of-type(2)');
  const imgEl = g.querySelector('image');
  const hitArea = g.querySelector('circle');

  if (shadowRect) {
    shadowRect.setAttribute('x', posX - bw / 2 + 1.2);
    shadowRect.setAttribute('y', posY - bh / 2 + 2);
  }
  if (bgRect) {
    bgRect.setAttribute('x', posX - bw / 2);
    bgRect.setAttribute('y', posY - bh / 2);
    bgRect.setAttribute('stroke', '#f59e0b');
    bgRect.setAttribute('stroke-width', '2.5');
  }
  if (imgEl) {
    imgEl.setAttribute('x', logoX);
    imgEl.setAttribute('y', logoY);
  }
  if (hitArea) {
    hitArea.setAttribute('cx', posX);
    hitArea.setAttribute('cy', posY);
  }

  if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
    g.setAttribute('transform', `rotate(90, ${posX}, ${posY})`);
  }

  // Update tether line in editor overlay
  updateEditorTetherLine(node, posX, posY);
}

function updateEditorTetherLine(node, logoX, logoY) {
  let tetherLayer = document.getElementById('svg-editor-tether-layer');
  if (!tetherLayer) {
    const svgOverlay = document.getElementById('map-svg-overlay');
    if (!svgOverlay) return;
    tetherLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tetherLayer.id = 'svg-editor-tether-layer';
    svgOverlay.insertBefore(tetherLayer, document.getElementById('svg-nodes-layer'));
  }

  let line = document.getElementById(`tether-${node.id}`);
  if (!line) {
    line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.id = `tether-${node.id}`;
    line.setAttribute('stroke', '#f59e0b');
    line.setAttribute('stroke-width', '1.8');
    line.setAttribute('stroke-dasharray', '4 3');
    tetherLayer.appendChild(line);
  }

  line.setAttribute('x1', node.coordinates.x);
  line.setAttribute('y1', node.coordinates.y);
  line.setAttribute('x2', logoX);
  line.setAttribute('y2', logoY);
}

function updateEditorHudInfo(node, pos) {
  const titleEl = document.getElementById('editor-hud-title');
  const coordsEl = document.getElementById('editor-hud-coords');
  const deltaEl = document.getElementById('editor-hud-delta');

  if (titleEl) titleEl.innerText = `${node.name || node.id}`;
  if (coordsEl) coordsEl.innerText = `X: ${pos.x}, Y: ${pos.y}`;
  
  const dx = pos.x - node.coordinates.x;
  const dy = pos.y - node.coordinates.y;
  const signX = dx >= 0 ? `+${dx}` : `${dx}`;
  const signY = dy >= 0 ? `+${dy}` : `${dy}`;
  if (deltaEl) deltaEl.innerText = `Offset: (ΔX: ${signX}, ΔY: ${signY})`;
}

function resetCurrentFloorLogoPositions() {
  const currentFloorNodes = levelNodes[currentLevel] || {};
  Object.keys(currentFloorNodes).forEach(id => {
    delete customLogoPositions[id];
  });
  saveLogoPositionsToStorage();
  renderMapOverlay();
  triggerHaptic('medium');
}

function resetAllLogoPositions() {
  customLogoPositions = {};
  AltozanoState.customLogoPositions = {};
  saveLogoPositionsToStorage();
  renderMapOverlay();
  triggerHaptic('medium');
}

function openExportLogoPositionsModal() {
  const modal = document.getElementById('editor-export-modal');
  const textarea = document.getElementById('editor-export-json');
  if (!modal || !textarea) return;

  const exportData = {};
  [1, 2, 3].forEach(lvl => {
    exportData[`nivel_${lvl}`] = {};
    const nodes = levelNodes[lvl] || {};
    Object.values(nodes).forEach(n => {
      if (customLogoPositions[n.id]) {
        exportData[`nivel_${lvl}`][n.id] = {
          name: n.name,
          node_coordinates: n.coordinates,
          custom_logo_position: customLogoPositions[n.id],
          offset: {
            dx: customLogoPositions[n.id].x - n.coordinates.x,
            dy: customLogoPositions[n.id].y - n.coordinates.y
          }
        };
      }
    });
  });

  textarea.value = JSON.stringify(exportData, null, 2);
  modal.classList.remove('hidden');
}

function closeExportLogoPositionsModal() {
  const modal = document.getElementById('editor-export-modal');
  if (modal) modal.classList.add('hidden');
}

function copyExportedJson() {
  const textarea = document.getElementById('editor-export-json');
  if (!textarea) return;
  navigator.clipboard.writeText(textarea.value).then(() => {
    const btn = document.getElementById('btn-copy-export-json');
    if (btn) {
      btn.innerText = "¡JSON Copiado!";
      setTimeout(() => { btn.innerText = "Copiar JSON"; }, 2000);
    }
  });
}

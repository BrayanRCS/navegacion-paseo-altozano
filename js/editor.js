/**
 * Paseo Altozano · Visual Graph & Logo Studio (Interactive Graph & Placement Editor)
 */

let activeDraggedNodeId = null;
let dragOffsetSvgX = 0;
let dragOffsetSvgY = 0;
let editorDragType = 'node'; // 'node' | 'logo'

function initCustomGraph() {
  try {
    const saved = localStorage.getItem('altozano_custom_mall_graph');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        // Seamlessly merge any new server portal/anchor nodes that might not be in the local copy
        if (mallGraph && Array.isArray(mallGraph.nodes)) {
          const localNodeIds = new Set(parsed.nodes.map(n => n.id));
          mallGraph.nodes.forEach(serverNode => {
            if (!localNodeIds.has(serverNode.id)) {
              parsed.nodes.push(serverNode);
            }
          });
        }
        mallGraph = parsed;
        AltozanoState.mallGraph = mallGraph;
        if (typeof buildFloorSubgraphs === 'function') buildFloorSubgraphs();
        console.log("Loaded custom user mall graph from localStorage with merged portals. Total nodes:", mallGraph.nodes.length);
      }
    }
  } catch (e) {
    console.warn("Could not load custom mall graph from localStorage:", e);
  }
}

function saveCustomGraphToStorage() {
  try {
    if (mallGraph) {
      mallGraph.total_nodes = mallGraph.nodes.length;
      mallGraph.total_edges = mallGraph.edges.length;
      localStorage.setItem('altozano_custom_mall_graph', JSON.stringify(mallGraph));
      AltozanoState.mallGraph = mallGraph;
      if (typeof buildFloorSubgraphs === 'function') buildFloorSubgraphs();
    }
  } catch (e) {
    console.warn("Could not save custom mall graph:", e);
  }
}

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
    if (btnText) btnText.innerText = "Modo Estudio ACTIVO";
    if (hud) hud.classList.remove('hidden');
    triggerHaptic('medium');
  } else {
    if (btn) btn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md border border-slate-700";
    if (btnText) btnText.innerText = "Editar Grafo y Logos";
    if (hud) hud.classList.add('hidden');
    isConnectMode = false;
    AltozanoState.isConnectMode = false;
    editorConnectSourceNodeId = null;
    triggerHaptic('light');
  }

  renderMapOverlay();
}

function setEditorSubMode(subMode) {
  editorSubMode = subMode;
  AltozanoState.editorSubMode = subMode;

  const tabGraph = document.getElementById('tab-editor-graph');
  const tabLogos = document.getElementById('tab-editor-logos');
  const graphActions = document.getElementById('editor-graph-actions');
  const logoActions = document.getElementById('editor-logo-actions');
  const modeBadge = document.getElementById('editor-hud-submode-badge');

  if (subMode === 'graph') {
    if (tabGraph) tabGraph.className = "px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs shadow-sm transition-all";
    if (tabLogos) tabLogos.className = "px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all";
    if (graphActions) graphActions.classList.remove('hidden');
    if (logoActions) logoActions.classList.add('hidden');
    if (modeBadge) {
      modeBadge.innerText = "NODOS Y ARISTAS";
      modeBadge.className = "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950";
    }
  } else {
    if (tabGraph) tabGraph.className = "px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all";
    if (tabLogos) tabLogos.className = "px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-sm transition-all";
    if (graphActions) graphActions.classList.add('hidden');
    if (logoActions) logoActions.classList.remove('hidden');
    if (modeBadge) {
      modeBadge.innerText = "POSICIÓN LOGOS";
      modeBadge.className = "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-slate-950";
    }
    isConnectMode = false;
    AltozanoState.isConnectMode = false;
    editorConnectSourceNodeId = null;
  }

  renderMapOverlay();
  triggerHaptic('light');
}

function toggleConnectMode() {
  isConnectMode = !isConnectMode;
  AltozanoState.isConnectMode = isConnectMode;

  const btn = document.getElementById('btn-editor-connect-mode');
  if (isConnectMode) {
    if (btn) btn.className = "px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-1.5 border border-emerald-300 animate-pulse";
    triggerHaptic('medium');
  } else {
    if (btn) btn.className = "px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5";
    editorConnectSourceNodeId = null;
    AltozanoState.editorConnectSourceNodeId = null;
    triggerHaptic('light');
  }

  renderMapOverlay();
}

function handleNodeClickInEditor(node) {
  if (!node) return;
  selectedEditorNodeId = node.id;
  AltozanoState.selectedEditorNodeId = node.id;

  if (editorSubMode === 'graph' && isConnectMode) {
    if (!editorConnectSourceNodeId) {
      editorConnectSourceNodeId = node.id;
      AltozanoState.editorConnectSourceNodeId = node.id;
      triggerHaptic('medium');
      renderMapOverlay();
      updateEditorHudInfo(node, node.coordinates, `🟢 Punto 1 seleccionado. Toca el punto 2 para unir.`);
    } else if (editorConnectSourceNodeId === node.id) {
      editorConnectSourceNodeId = null;
      AltozanoState.editorConnectSourceNodeId = null;
      triggerHaptic('light');
      renderMapOverlay();
      updateEditorHudInfo(node, node.coordinates, `Selección de enlace cancelada.`);
    } else {
      // Toggle edge between source and target
      const srcId = editorConnectSourceNodeId;
      const dstId = node.id;
      const existingIdx = mallGraph.edges.findIndex(e => (e.from === srcId && e.to === dstId) || (e.from === dstId && e.to === srcId));

      if (existingIdx >= 0) {
        // Remove edge (both directions)
        mallGraph.edges = mallGraph.edges.filter(e => !((e.from === srcId && e.to === dstId) || (e.from === dstId && e.to === srcId)));
        triggerHaptic('medium');
        updateEditorHudInfo(node, node.coordinates, `❌ Arista eliminada entre ${srcId} y ${dstId}`);
      } else {
        // Add bidirectional edge
        mallGraph.edges.push({ from: srcId, to: dstId, bidirectional: true });
        mallGraph.edges.push({ from: dstId, to: srcId, bidirectional: true });
        triggerHaptic('medium');
        updateEditorHudInfo(node, node.coordinates, `✅ Arista conectada entre ${srcId} y ${dstId}`);
      }

      saveCustomGraphToStorage();
      editorConnectSourceNodeId = dstId; // Chain to next point effortlessly
      AltozanoState.editorConnectSourceNodeId = dstId;
      renderMapOverlay();
    }
  } else {
    const pos = editorSubMode === 'logos' ? getNodeLogoPosition(node) : node.coordinates;
    updateEditorHudInfo(node, pos);
    renderMapOverlay();
    triggerHaptic('light');
  }
}

function createNewWaypoint(svgX, svgY) {
  if (!mallGraph) return;
  const uniqueId = `n_lvl${currentLevel}_c_wp_${Date.now().toString(36)}`;
  const count = mallGraph.nodes.filter(n => n.level === currentLevel && n.type === 'corridor_waypoint').length + 1;

  const newNode = {
    id: uniqueId,
    level: currentLevel,
    type: "corridor_waypoint",
    name: `Paso Guía ${count}`,
    coordinates: { x: svgX, y: svgY }
  };

  mallGraph.nodes.push(newNode);
  saveCustomGraphToStorage();

  selectedEditorNodeId = uniqueId;
  AltozanoState.selectedEditorNodeId = uniqueId;
  
  if (isConnectMode) {
    if (editorConnectSourceNodeId) {
      // Auto-connect from previous source to this new node
      mallGraph.edges.push({ from: editorConnectSourceNodeId, to: uniqueId, bidirectional: true });
      mallGraph.edges.push({ from: uniqueId, to: editorConnectSourceNodeId, bidirectional: true });
      saveCustomGraphToStorage();
    }
    editorConnectSourceNodeId = uniqueId;
    AltozanoState.editorConnectSourceNodeId = uniqueId;
  }

  renderMapOverlay();
  updateEditorHudInfo(newNode, newNode.coordinates, `✨ Nodo creado: ${newNode.name}`);
  triggerHaptic('medium');
}

function createNewWaypointAtCenter() {
  const vp = getMapViewport();
  const centerX = Math.round(vp.spec.width / 2);
  const centerY = Math.round(vp.spec.height / 2);
  createNewWaypoint(centerX, centerY);
}

function deleteSelectedNode() {
  if (!selectedEditorNodeId || !mallGraph) return;

  const node = mallGraph.nodes.find(n => n.id === selectedEditorNodeId);
  if (!node) return;

  if (node.type === 'anchor_store' || node.type === 'totem') {
    if (!confirm(`¿Seguro que deseas eliminar el nodo clave "${node.name}" (${node.id})?`)) return;
  }

  // Remove node
  mallGraph.nodes = mallGraph.nodes.filter(n => n.id !== selectedEditorNodeId);
  // Remove attached edges
  mallGraph.edges = mallGraph.edges.filter(e => e.from !== selectedEditorNodeId && e.to !== selectedEditorNodeId);
  
  // Remove custom logo position if any
  delete customLogoPositions[selectedEditorNodeId];
  saveLogoPositionsToStorage();

  saveCustomGraphToStorage();

  const deletedId = selectedEditorNodeId;
  selectedEditorNodeId = null;
  AltozanoState.selectedEditorNodeId = null;
  editorConnectSourceNodeId = null;
  AltozanoState.editorConnectSourceNodeId = null;

  renderMapOverlay();
  triggerHaptic('medium');

  const titleEl = document.getElementById('editor-hud-title');
  if (titleEl) titleEl.innerText = `Nodo ${deletedId} eliminado`;
}

function setupEditorDragListeners() {
  const container = document.getElementById('map-container');
  if (!container) return;

  function handleDragStart(clientX, clientY, target) {
    if (!isEditorMode) return;

    // Check if dragging a graph node handle (Graph Mode)
    const graphNodeEl = target.closest('[data-graph-node-id]');
    // Check if dragging a logo badge (Logo Mode)
    const logoGroup = target.closest('[data-logo-node-id]');

    let targetNodeId = null;
    if (editorSubMode === 'graph' && graphNodeEl) {
      targetNodeId = graphNodeEl.getAttribute('data-graph-node-id');
      editorDragType = 'node';
    } else if (editorSubMode === 'logos' && logoGroup) {
      targetNodeId = logoGroup.getAttribute('data-logo-node-id');
      editorDragType = 'logo';
    } else if (graphNodeEl) {
      targetNodeId = graphNodeEl.getAttribute('data-graph-node-id');
      editorDragType = 'node';
    } else if (logoGroup) {
      targetNodeId = logoGroup.getAttribute('data-logo-node-id');
      editorDragType = 'logo';
    }

    if (!targetNodeId) return;

    const node = levelNodes[currentLevel] && levelNodes[currentLevel][targetNodeId];
    if (!node) return;

    // If connect mode is on and we just tapped a node, don't drag; handle click
    if (isConnectMode && editorSubMode === 'graph') {
      handleNodeClickInEditor(node);
      return true;
    }

    activeDraggedNodeId = targetNodeId;
    selectedEditorNodeId = targetNodeId;
    AltozanoState.selectedEditorNodeId = targetNodeId;
    container.classList.add('is-logo-dragging');

    const rect = container.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const svgPoint = screenToSvgCoordinates(screenX, screenY);
    
    const currentPos = editorDragType === 'logo' ? getNodeLogoPosition(node) : node.coordinates;

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

    const newX = Math.round(svgPoint.x - dragOffsetSvgX);
    const newY = Math.round(svgPoint.y - dragOffsetSvgY);

    if (editorDragType === 'logo') {
      customLogoPositions[activeDraggedNodeId] = { x: newX, y: newY };
      AltozanoState.customLogoPositions = customLogoPositions;
      updateLogoElementTransform(node, newX, newY);
      updateEditorHudInfo(node, { x: newX, y: newY });
    } else {
      // Move Graph Navigation Node Live!
      node.coordinates.x = newX;
      node.coordinates.y = newY;
      
      // Update the node object in mallGraph
      const rawNode = mallGraph.nodes.find(n => n.id === activeDraggedNodeId);
      if (rawNode) {
        rawNode.coordinates.x = newX;
        rawNode.coordinates.y = newY;
      }

      updateLiveNodeAndEdgesSvg(node, newX, newY);
      updateEditorHudInfo(node, { x: newX, y: newY });
    }
  }

  function handleDragEnd() {
    if (!activeDraggedNodeId) return;
    container.classList.remove('is-logo-dragging');
    
    if (editorDragType === 'logo') {
      saveLogoPositionsToStorage();
    } else {
      saveCustomGraphToStorage();
    }

    activeDraggedNodeId = null;
    renderMapOverlay();
    triggerHaptic('light');
  }

  // Double click to add waypoint in graph mode
  container.addEventListener('dblclick', (e) => {
    if (!isEditorMode || editorSubMode !== 'graph') return;
    if (e.target.closest('#map-node-popup') || e.target.closest('#editor-hud-bar')) return;
    
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const svgPoint = screenToSvgCoordinates(screenX, screenY);
    createNewWaypoint(svgPoint.x, svgPoint.y);
  });

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('#map-node-popup') || e.target.closest('#editor-hud-bar')) return;
    if (isEditorMode && (e.target.closest('[data-logo-node-id]') || e.target.closest('[data-graph-node-id]'))) {
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
      if (isEditorMode && (e.touches[0].target.closest('[data-logo-node-id]') || e.touches[0].target.closest('[data-graph-node-id]'))) {
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

function updateLiveNodeAndEdgesSvg(node, posX, posY) {
  // 1. Update node element
  const nodeEl = document.querySelector(`[data-graph-node-id="${node.id}"]`);
  if (nodeEl) {
    if (nodeEl.tagName.toLowerCase() === 'circle') {
      nodeEl.setAttribute('cx', posX);
      nodeEl.setAttribute('cy', posY);
    } else {
      nodeEl.setAttribute('transform', `translate(${posX}, ${posY})`);
    }
  }

  // 2. Update connected edges in svg-edges-layer
  const edgesLayer = document.getElementById('svg-edges-layer');
  if (edgesLayer) {
    const lines = edgesLayer.querySelectorAll(`[data-edge-u="${node.id}"], [data-edge-v="${node.id}"]`);
    lines.forEach(line => {
      if (line.getAttribute('data-edge-u') === node.id) {
        line.setAttribute('x1', posX);
        line.setAttribute('y1', posY);
      }
      if (line.getAttribute('data-edge-v') === node.id) {
        line.setAttribute('x2', posX);
        line.setAttribute('y2', posY);
      }
    });
  }

  // 3. If node also has a logo and not moved separately, move logo badge too
  if (!customLogoPositions[node.id]) {
    updateLogoElementTransform(node, posX, posY);
  }
}

function updateLogoElementTransform(node, posX, posY) {
  const g = document.querySelector(`[data-logo-node-id="${node.id}"]`);
  if (!g) return;

  const isAnchor = node.type === 'anchor_store';
  const isIsland = node.type === 'island';
  const bw = isAnchor ? 54 : (isIsland ? 32 : 42);
  const bh = isAnchor ? 38 : (isIsland ? 24 : 30);
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

function updateEditorHudInfo(node, pos, customMsg = null) {
  const titleEl = document.getElementById('editor-hud-title');
  const coordsEl = document.getElementById('editor-hud-coords');
  const deltaEl = document.getElementById('editor-hud-delta');

  if (titleEl) {
    if (customMsg) {
      titleEl.innerText = customMsg;
    } else {
      titleEl.innerText = `${node.name || node.id} (${node.type || 'nodo'})`;
    }
  }
  if (coordsEl) coordsEl.innerText = `X: ${pos.x}, Y: ${pos.y}`;
  
  if (deltaEl) {
    const neighbors = (levelGraphs[currentLevel] && levelGraphs[currentLevel][node.id]) || [];
    deltaEl.innerText = `Aristas conectadas: ${neighbors.length} | ID: ${node.id}`;
  }
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

function resetEntireGraphToFactory() {
  if (!confirm("¿Deseas restablecer el grafo completo y los logotipos a su versión original de fábrica?")) return;
  localStorage.removeItem('altozano_custom_mall_graph');
  localStorage.removeItem('altozano_custom_logo_positions');
  customLogoPositions = {};
  AltozanoState.customLogoPositions = {};
  
  // Reload fresh from server
  fetch(`mall_graph.json?v=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
      mallGraph = data;
      AltozanoState.mallGraph = mallGraph;
      buildFloorSubgraphs();
      renderMapOverlay();
      alert("¡Grafo original restablecido con éxito!");
    })
    .catch(() => {
      window.location.reload();
    });
}

function openExportLogoPositionsModal() {
  const modal = document.getElementById('editor-export-modal');
  const textarea = document.getElementById('editor-export-json');
  if (!modal || !textarea) return;

  // Format full clean mall_graph.json
  const exportGraph = {
    mall: mallGraph.mall || "Paseo Altozano",
    total_nodes: mallGraph.nodes.length,
    total_edges: mallGraph.edges.length,
    nodes: mallGraph.nodes,
    edges: mallGraph.edges
  };

  textarea.value = JSON.stringify(exportGraph, null, 2);
  modal.classList.remove('hidden');
}

function downloadMallGraphJsonFile() {
  const exportGraph = {
    mall: mallGraph.mall || "Paseo Altozano",
    total_nodes: mallGraph.nodes.length,
    total_edges: mallGraph.edges.length,
    nodes: mallGraph.nodes,
    edges: mallGraph.edges
  };
  const jsonStr = JSON.stringify(exportGraph, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mall_graph.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

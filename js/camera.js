/**
 * Paseo Altozano · High-Performance Hardware-Accelerated Camera Engine
 * Unified Kinetic Loop, Lerp Smooth Interpolation & Momentum Inertia Physics
 */

// 1. Dynamic Viewport & Zoom Calculations
function getDynamicZoomLevel(isSim = false) {
  const isMobile = document.body.classList.contains('mobile-navigation-mode') || window.innerWidth < 768;
  if (isMobile) {
    return isSim ? 1.35 : 1.2;
  }
  return isSim ? 1.25 : 1.1;
}

function getMapViewport(forceRefresh = false) {
  const container = document.getElementById('map-container');
  const cw = container ? container.clientWidth : 0;
  const ch = container ? container.clientHeight : 0;

  if (cw === 0 || ch === 0) {
    const spec = FLOOR_SPECS[currentLevel] || { width: 1536, height: 718 };
    return { cw: window.innerWidth || 1536, ch: (window.innerHeight || 800) * 0.8, renderW: 1536, renderH: 718, offsetX: 0, offsetY: 0, spec, lvl: currentLevel };
  }

  if (cachedViewport && !forceRefresh && cachedViewport.cw === cw && cachedViewport.ch === ch && cachedViewport.lvl === currentLevel) {
    return cachedViewport;
  }

  const spec = FLOOR_SPECS[currentLevel] || { width: 1536, height: 718 };
  const imgAspect = spec.width / spec.height;
  const containerAspect = cw / ch;

  let renderW, renderH, offsetX, offsetY;
  if (containerAspect > imgAspect) {
    renderH = ch;
    renderW = ch * imgAspect;
    offsetX = (cw - renderW) / 2;
    offsetY = 0;
  } else {
    renderW = cw;
    renderH = cw / imgAspect;
    offsetX = 0;
    offsetY = (ch - renderH) / 2;
  }
  cachedViewport = { cw, ch, renderW, renderH, offsetX, offsetY, spec, lvl: currentLevel };
  return cachedViewport;
}

window.addEventListener('resize', () => { cachedViewport = null; });

// 2. Camera Physics & Target State
const cameraTarget = {
  panX: 0,
  panY: 0,
  scale: 1.0,
  rotation: -90
};

const cameraPhysics = {
  velocityX: 0,
  velocityY: 0,
  isDragging: false,
  friction: 0.92,       // Inertial decay factor per frame
  minVelocity: 0.05,    // Stopping threshold
  lerpPan: 0.20,        // Smooth tracking speed for panning (0 < factor <= 1)
  lerpScale: 0.16,      // Smooth tracking speed for zoom
  lerpRot: 0.15         // Smooth tracking speed for rotation
};

// Pointer tracking for release velocity estimation
const pointerHistory = [];
const POINTER_HISTORY_MAX_AGE_MS = 100;

function recordPointerPosition(x, y) {
  const now = performance.now();
  pointerHistory.push({ x, y, time: now });
  while (pointerHistory.length > 0 && (now - pointerHistory[0].time) > POINTER_HISTORY_MAX_AGE_MS) {
    pointerHistory.shift();
  }
}

function calculateReleaseVelocity() {
  if (pointerHistory.length < 2) return { vx: 0, vy: 0 };
  const last = pointerHistory[pointerHistory.length - 1];
  const first = pointerHistory[0];
  const dt = last.time - first.time;
  if (dt <= 8) return { vx: 0, vy: 0 };

  // Calculate velocity in pixels per standard 60fps frame (16.67ms)
  const vx = ((last.x - first.x) / dt) * 16.67;
  const vy = ((last.y - first.y) / dt) * 16.67;

  // Clamp velocity to comfortable max impulse
  const maxImpulse = 42;
  const speed = Math.hypot(vx, vy);
  if (speed > maxImpulse) {
    const factor = maxImpulse / speed;
    return { vx: vx * factor, vy: vy * factor };
  }
  return { vx, vy };
}

// 3. Hardware-Accelerated GPU Transform Engine
function updateCameraTransform() {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;
  const rot = currentCamera.rotation || 0;
  stage.style.transform = `translate3d(${currentCamera.panX.toFixed(2)}px, ${currentCamera.panY.toFixed(2)}px, 0) scale(${currentCamera.scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
}

// 4. Unified CinemaKinetic Loop (Single persistent requestAnimationFrame)
let isKineticLoopActive = false;

function startCameraKineticLoop() {
  if (isKineticLoopActive) return;
  isKineticLoopActive = true;
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(cameraKineticTick);
  }
}

function cameraKineticTick() {
  // A. Apply Inertial Momentum when released
  if (!cameraPhysics.isDragging) {
    if (Math.abs(cameraPhysics.velocityX) > cameraPhysics.minVelocity || Math.abs(cameraPhysics.velocityY) > cameraPhysics.minVelocity) {
      cameraTarget.panX += cameraPhysics.velocityX;
      cameraTarget.panY += cameraPhysics.velocityY;
      cameraPhysics.velocityX *= cameraPhysics.friction;
      cameraPhysics.velocityY *= cameraPhysics.friction;
    } else {
      cameraPhysics.velocityX = 0;
      cameraPhysics.velocityY = 0;
    }
  }

  // B. Linear Interpolation (Lerp) towards Target State
  const prevPanX = currentCamera.panX;
  const prevPanY = currentCamera.panY;
  const prevScale = currentCamera.scale;
  const prevRot = currentCamera.rotation || 0;

  currentCamera.panX += (cameraTarget.panX - currentCamera.panX) * cameraPhysics.lerpPan;
  currentCamera.panY += (cameraTarget.panY - currentCamera.panY) * cameraPhysics.lerpPan;
  currentCamera.scale += (cameraTarget.scale - currentCamera.scale) * cameraPhysics.lerpScale;
  currentCamera.rotation += (cameraTarget.rotation - prevRot) * cameraPhysics.lerpRot;

  // C. Apply Transform only when values actually change
  const dPanX = Math.abs(currentCamera.panX - prevPanX);
  const dPanY = Math.abs(currentCamera.panY - prevPanY);
  const dScale = Math.abs(currentCamera.scale - prevScale);
  const dRot = Math.abs((currentCamera.rotation || 0) - prevRot);

  if (dPanX > 0.001 || dPanY > 0.001 || dScale > 0.0001 || dRot > 0.01) {
    updateCameraTransform();
    if (typeof updatePopupPosition === 'function') {
      updatePopupPosition();
    }
  }

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(cameraKineticTick);
  }
}

// 5. Compass & Orientation UI
function resetCameraRotation() {
  const baseRot = isVerticalMode ? -90 : 0;
  cameraPhysics.velocityX = 0;
  cameraPhysics.velocityY = 0;
  cameraTarget.rotation = baseRot;
  triggerHaptic('light');
  updateCompassUI();
}

function updateCompassUI() {
  const compassBtn = document.getElementById('btn-compass');
  const compassNeedle = document.getElementById('compass-needle');
  if (!compassBtn) return;
  const baseRot = isVerticalMode ? -90 : 0;
  const rot = cameraTarget.rotation || 0;
  const isVisible = Math.abs(rot - baseRot) > 2;

  if (isVisible) {
    compassBtn.classList.remove('hidden');
    if (compassNeedle) {
      compassNeedle.style.transform = `rotate(${-rot}deg)`;
    }
  } else {
    compassBtn.classList.add('hidden');
  }
}

function getNodeHeading(curr, next) {
  if (!curr || !next) return 0;
  if (next.coordinates.x === curr.coordinates.x && next.coordinates.y === curr.coordinates.y) return 0;
  const dx = next.coordinates.x - curr.coordinates.x;
  const dy = next.coordinates.y - curr.coordinates.y;
  return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
}

// 6. Programmatic Camera Actions (Targets assigned to Lerp Engine)
function zoomToCoordinates(x, y, targetScale = null, animate = true, duration = 450) {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;

  if (targetScale === null) {
    targetScale = getDynamicZoomLevel(isSimulating);
  }

  const vp = getMapViewport();
  const u = x / vp.spec.width;
  const v = y / vp.spec.height;
  const pixelX = vp.offsetX + u * vp.renderW;
  const pixelY = vp.offsetY + v * vp.renderH;

  const finalRot = isVerticalMode ? -90 : 0;
  const rad = finalRot * Math.PI / 180;
  const rx = (pixelX * targetScale) * Math.cos(rad) - (pixelY * targetScale) * Math.sin(rad);
  const ry = (pixelX * targetScale) * Math.sin(rad) + (pixelY * targetScale) * Math.cos(rad);

  const targetScreenX = vp.cw / 2;
  const targetScreenY = vp.ch / 2;

  const panX = targetScreenX - rx;
  const panY = targetScreenY - ry;

  cameraPhysics.velocityX = 0;
  cameraPhysics.velocityY = 0;

  if (animate) {
    cameraTarget.panX = panX;
    cameraTarget.panY = panY;
    cameraTarget.scale = targetScale;
    cameraTarget.rotation = finalRot;
    currentCamera.isZoomed = targetScale > 1.05;
    updateZoomButtonUI();
    updateCompassUI();
  } else {
    cameraTarget.panX = panX;
    cameraTarget.panY = panY;
    cameraTarget.scale = targetScale;
    cameraTarget.rotation = finalRot;

    currentCamera.panX = panX;
    currentCamera.panY = panY;
    currentCamera.scale = targetScale;
    currentCamera.rotation = finalRot;
    currentCamera.isZoomed = targetScale > 1.05;

    updateCameraTransform();
    updateZoomButtonUI();
    updateCompassUI();
  }
}

function zoomToRouteBoundingBox(pathNodes, duration = 500) {
  const stage = document.getElementById('map-camera-stage');
  if (!stage || !pathNodes || pathNodes.length === 0) return;

  const vp = getMapViewport();
  const spec = vp.spec;
  const finalRot = isVerticalMode ? -90 : 0;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pathNodes.forEach(n => {
    const coords = n.coordinates || n;
    if (coords.x < minX) minX = coords.x;
    if (coords.x > maxX) maxX = coords.x;
    if (coords.y < minY) minY = coords.y;
    if (coords.y > maxY) maxY = coords.y;
  });

  const routeW = Math.max(maxX - minX, 120);
  const routeH = Math.max(maxY - minY, 90);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const paddedW = Math.max(routeW + 320, 520);
  const paddedH = Math.max(routeH + 260, 380);

  const routePixelW = (paddedW / spec.width) * vp.renderW;
  const routePixelH = (paddedH / spec.height) * vp.renderH;

  const scaleX = vp.cw / routePixelW;
  const scaleY = vp.ch / routePixelH;
  let targetScale = Math.min(scaleX, scaleY);

  const isMobile = document.body.classList.contains('mobile-navigation-mode') || window.innerWidth < 768;
  const maxAllowScale = isMobile ? 1.4 : 1.32;
  const minAllowScale = 1.02;
  targetScale = Math.min(maxAllowScale, Math.max(minAllowScale, targetScale));

  const u = midX / spec.width;
  const v = midY / spec.height;
  const pixelX = vp.offsetX + u * vp.renderW;
  const pixelY = vp.offsetY + v * vp.renderH;

  const rad = finalRot * Math.PI / 180;
  const rx = (pixelX * targetScale) * Math.cos(rad) - (pixelY * targetScale) * Math.sin(rad);
  const ry = (pixelX * targetScale) * Math.sin(rad) + (pixelY * targetScale) * Math.cos(rad);

  const targetScreenX = vp.cw / 2;
  const targetScreenY = vp.ch / 2;

  const panX = targetScreenX - rx;
  const panY = targetScreenY - ry;

  cameraPhysics.velocityX = 0;
  cameraPhysics.velocityY = 0;

  cameraTarget.panX = panX;
  cameraTarget.panY = panY;
  cameraTarget.scale = targetScale;
  cameraTarget.rotation = finalRot;
  currentCamera.isZoomed = targetScale > 1.05;

  updateZoomButtonUI();
  updateCompassUI();
}

function zoomToOverview(animate = true) {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;

  const vp = getMapViewport();
  const spec = vp.spec;
  const baseRot = isVerticalMode ? -90 : 0;

  let targetScale = 1.0;
  if (isVerticalMode && !document.body.classList.contains('mobile-navigation-mode')) {
    const scaleX = vp.cw / spec.height;
    const scaleY = vp.ch / spec.width;
    targetScale = Math.min(scaleX, scaleY) * 0.98;
  } else {
    targetScale = 1.0;
  }

  const midX = spec.width / 2;
  const midY = spec.height / 2;
  const pixelX = vp.offsetX + (midX / spec.width) * vp.renderW;
  const pixelY = vp.offsetY + (midY / spec.height) * vp.renderH;

  const rad = baseRot * Math.PI / 180;
  const rx = (pixelX * targetScale) * Math.cos(rad) - (pixelY * targetScale) * Math.sin(rad);
  const ry = (pixelX * targetScale) * Math.sin(rad) + (pixelY * targetScale) * Math.cos(rad);

  const panX = (vp.cw / 2) - rx;
  const panY = (vp.ch / 2) - ry;

  cameraPhysics.velocityX = 0;
  cameraPhysics.velocityY = 0;

  if (animate) {
    cameraTarget.panX = panX;
    cameraTarget.panY = panY;
    cameraTarget.scale = targetScale;
    cameraTarget.rotation = baseRot;
    currentCamera.isZoomed = false;
    updateZoomButtonUI();
    updateCompassUI();
  } else {
    cameraTarget.panX = panX;
    cameraTarget.panY = panY;
    cameraTarget.scale = targetScale;
    cameraTarget.rotation = baseRot;

    currentCamera.panX = panX;
    currentCamera.panY = panY;
    currentCamera.scale = targetScale;
    currentCamera.rotation = baseRot;
    currentCamera.isZoomed = false;

    updateCameraTransform();
    updateZoomButtonUI();
    updateCompassUI();
  }
}

function toggleZoomOverview() {
  if (currentCamera.isZoomed) {
    isFollowingGPS = false;
    zoomToOverview(true);
  } else {
    isFollowingGPS = true;
    centerOnNavArrow();
  }
}

function centerOnNavArrow() {
  isFollowingGPS = true;
  let targetNode = null;
  let nextNode = null;
  let targetLevel = currentLevel;

  if (isSimulating && routeSegments[simSegIndex] && routeSegments[simSegIndex].path[simNodeIndex]) {
    targetNode = routeSegments[simSegIndex].path[simNodeIndex];
    const path = routeSegments[simSegIndex].path;
    nextNode = path[Math.min(path.length - 1, simNodeIndex + 1)];
    targetLevel = routeSegments[simSegIndex].level;
  } else if (currentSteps.length > 0 && currentSteps[currentStepIndex] && currentSteps[currentStepIndex].node) {
    targetNode = currentSteps[currentStepIndex].node;
    nextNode = currentSteps[currentStepIndex].nextNode;
    targetLevel = targetNode.level;
  } else if (routeSegments.length > 0 && routeSegments[0].start) {
    targetNode = routeSegments[0].start;
    const p = routeSegments[0].path;
    nextNode = p.length > 1 ? p[1] : p[0];
    targetLevel = targetNode.level;
  } else if (levelNodes[2] && levelNodes[2][TOTEM_NODE_ID]) {
    targetNode = levelNodes[2][TOTEM_NODE_ID];
    targetLevel = 2;
  }

  if (!targetNode) return;

  if (currentLevel !== targetLevel) {
    switchLevel(targetLevel, false);
    setTimeout(() => {
      zoomToCoordinates(targetNode.coordinates.x, targetNode.coordinates.y, getDynamicZoomLevel(isSimulating), true, 600);
    }, 80);
  } else {
    zoomToCoordinates(targetNode.coordinates.x, targetNode.coordinates.y, getDynamicZoomLevel(isSimulating), true, 600);
  }
}

function manualZoom(factor) {
  const container = document.getElementById('map-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotRad = (cameraTarget.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(-rotRad);
  const sin = Math.sin(-rotRad);
  const dx = centerX - cameraTarget.panX;
  const dy = centerY - cameraTarget.panY;
  const localX = (dx * cos - dy * sin) / cameraTarget.scale;
  const localY = (dx * sin + dy * cos) / cameraTarget.scale;

  const newScale = Math.min(8.0, Math.max(0.65, cameraTarget.scale * factor));
  const newDx = (localX * newScale) * Math.cos(rotRad) - (localY * newScale) * Math.sin(rotRad);
  const newDy = (localX * newScale) * Math.sin(rotRad) + (localY * newScale) * Math.cos(rotRad);

  cameraPhysics.velocityX = 0;
  cameraPhysics.velocityY = 0;
  cameraTarget.panX = centerX - newDx;
  cameraTarget.panY = centerY - newDy;
  cameraTarget.scale = newScale;
  currentCamera.isZoomed = newScale > 1.1;

  updateZoomButtonUI();
  triggerHaptic('light');
}

// 7. Interactive Event Listeners (Drag, Wheel, Touch, Pinch & Inertia Momentum)
function setupInteractiveCameraPan() {
  const container = document.getElementById('map-container');
  if (!container) return;

  // Start persistent cinema-kinetic loop
  startCameraKineticLoop();

  let isMouseDown = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startTargetPanX = 0;
  let startTargetPanY = 0;
  let hasDraggedMap = false;
  const DRAG_THRESHOLD = 5;

  // --- MOUSE DRAG & INERTIA ---
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('#map-node-popup') || e.target.closest('#editor-hud-bar')) return;
    if (isEditorMode && (e.target.closest('[data-logo-node-id]') || e.target.closest('[data-graph-node-id]'))) return;
    if (typeof activeDraggedNodeId !== 'undefined' && activeDraggedNodeId) return;

    isMouseDown = true;
    hasDraggedMap = false;
    cameraPhysics.isDragging = true;
    cameraPhysics.velocityX = 0;
    cameraPhysics.velocityY = 0;

    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startTargetPanX = cameraTarget.panX;
    startTargetPanY = cameraTarget.panY;

    pointerHistory.length = 0;
    recordPointerPosition(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (typeof activeDraggedNodeId !== 'undefined' && activeDraggedNodeId) {
      isMouseDown = false;
      cameraPhysics.isDragging = false;
      return;
    }
    if (!isMouseDown) return;

    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    if (!hasDraggedMap && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      hasDraggedMap = true;
      container.classList.add('is-dragging');
    }

    if (hasDraggedMap) {
      cameraTarget.panX = startTargetPanX + dx;
      cameraTarget.panY = startTargetPanY + dy;
      recordPointerPosition(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      cameraPhysics.isDragging = false;
      container.classList.remove('is-dragging');

      if (hasDraggedMap) {
        const vel = calculateReleaseVelocity();
        cameraPhysics.velocityX = vel.vx;
        cameraPhysics.velocityY = vel.vy;
      }

      setTimeout(() => {
        hasDraggedMap = false;
      }, 80);
    }
  });

  // --- MOUSE WHEEL ZOOM WITH FOCAL POINT ANCHORING ---
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraPhysics.velocityX = 0;
    cameraPhysics.velocityY = 0;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let delta = -e.deltaY;
    if (e.ctrlKey) delta *= 2.5;

    const zoomFactor = Math.exp(delta * 0.0018);
    const newTargetScale = Math.min(8.0, Math.max(0.65, cameraTarget.scale * zoomFactor));

    const rotRad = (cameraTarget.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(-rotRad);
    const sin = Math.sin(-rotRad);
    const dx = mouseX - cameraTarget.panX;
    const dy = mouseY - cameraTarget.panY;
    const localX = (dx * cos - dy * sin) / cameraTarget.scale;
    const localY = (dx * sin + dy * cos) / cameraTarget.scale;

    const newDx = (localX * newTargetScale) * Math.cos(rotRad) - (localY * newTargetScale) * Math.sin(rotRad);
    const newDy = (localX * newTargetScale) * Math.sin(rotRad) + (localY * newTargetScale) * Math.cos(rotRad);

    cameraTarget.panX = mouseX - newDx;
    cameraTarget.panY = mouseY - newDy;
    cameraTarget.scale = newTargetScale;
    currentCamera.isZoomed = newTargetScale > 1.1;

    updateZoomButtonUI();
  }, { passive: false });

  // --- TOUCH, PINCH-TO-ZOOM & MOBILE INERTIA ---
  let initialTouchDist = 0;
  let startPinchScale = 1;
  let touchStartMidX = 0;
  let touchStartMidY = 0;
  let startPinchPanX = 0;
  let startPinchPanY = 0;

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      if (e.touches[0].target.closest('#map-node-popup') || e.touches[0].target.closest('#editor-hud-bar')) return;
      if (isEditorMode && e.touches[0].target.closest('[data-logo-node-id]')) return;
      if (typeof activeDraggedNodeId !== 'undefined' && activeDraggedNodeId) return;

      isMouseDown = true;
      hasDraggedMap = false;
      cameraPhysics.isDragging = true;
      cameraPhysics.velocityX = 0;
      cameraPhysics.velocityY = 0;

      startMouseX = e.touches[0].clientX;
      startMouseY = e.touches[0].clientY;
      startTargetPanX = cameraTarget.panX;
      startTargetPanY = cameraTarget.panY;

      pointerHistory.length = 0;
      recordPointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isMouseDown = false;
      hasDraggedMap = true;
      cameraPhysics.isDragging = true;
      cameraPhysics.velocityX = 0;
      cameraPhysics.velocityY = 0;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      startPinchScale = cameraTarget.scale;

      const rect = container.getBoundingClientRect();
      touchStartMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
      touchStartMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
      startPinchPanX = cameraTarget.panX;
      startPinchPanY = cameraTarget.panY;

      pointerHistory.length = 0;
      recordPointerPosition(touchStartMidX, touchStartMidY);
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (typeof activeDraggedNodeId !== 'undefined' && activeDraggedNodeId) {
      isMouseDown = false;
      cameraPhysics.isDragging = false;
      return;
    }

    if (e.touches.length === 1 && isMouseDown) {
      const dx = e.touches[0].clientX - startMouseX;
      const dy = e.touches[0].clientY - startMouseY;

      if (!hasDraggedMap && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        hasDraggedMap = true;
        container.classList.add('is-dragging');
      }

      if (hasDraggedMap) {
        cameraTarget.panX = startTargetPanX + dx;
        cameraTarget.panY = startTargetPanY + dy;
        recordPointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (initialTouchDist > 0) {
        const factor = currentDist / initialTouchDist;
        const newTargetScale = Math.min(8.0, Math.max(0.65, startPinchScale * factor));

        const rotRad = (cameraTarget.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);
        const dx = touchStartMidX - startPinchPanX;
        const dy = touchStartMidY - startPinchPanY;
        const localX = (dx * cos - dy * sin) / startPinchScale;
        const localY = (dx * sin + dy * cos) / startPinchScale;

        const newDx = (localX * newTargetScale) * Math.cos(rotRad) - (localY * newTargetScale) * Math.sin(rotRad);
        const newDy = (localX * newTargetScale) * Math.sin(rotRad) + (localY * newTargetScale) * Math.cos(rotRad);

        cameraTarget.scale = newTargetScale;
        cameraTarget.panX = touchStartMidX - newDx;
        cameraTarget.panY = touchStartMidY - newDy;
        currentCamera.isZoomed = newTargetScale > 1.1;

        updateZoomButtonUI();
      }
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      isMouseDown = false;
      cameraPhysics.isDragging = false;
      container.classList.remove('is-dragging');

      if (hasDraggedMap) {
        const vel = calculateReleaseVelocity();
        cameraPhysics.velocityX = vel.vx;
        cameraPhysics.velocityY = vel.vy;
      }

      setTimeout(() => { hasDraggedMap = false; }, 100);
    } else if (e.touches.length === 1) {
      startMouseX = e.touches[0].clientX;
      startMouseY = e.touches[0].clientY;
      startTargetPanX = cameraTarget.panX;
      startTargetPanY = cameraTarget.panY;
      pointerHistory.length = 0;
      recordPointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
}

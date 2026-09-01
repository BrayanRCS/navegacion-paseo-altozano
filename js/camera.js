/**
 * Paseo Altozano · Camera & Viewport Engine
 */

function getDynamicZoomLevel(isSim = false) {
  const isMobile = document.body.classList.contains('mobile-navigation-mode') || window.innerWidth < 768;
  if (isMobile) {
    return isSim ? 2.95 : 2.25;
  }
  return isSim ? 2.15 : 1.6;
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

function updateCameraTransform() {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;
  const rot = currentCamera.rotation || 0;
  stage.style.transform = `translate3d(${currentCamera.panX.toFixed(2)}px, ${currentCamera.panY.toFixed(2)}px, 0) scale(${currentCamera.scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
}

function resetCameraRotation() {
  const baseRot = isVerticalMode ? -90 : 0;
  if (typeof anime !== 'undefined') {
    anime({
      targets: currentCamera,
      rotation: baseRot,
      duration: 350,
      easing: 'easeInOutSine',
      update: () => {
        updateCameraTransform();
        updateCompassUI();
      }
    });
  } else {
    currentCamera.rotation = baseRot;
    updateCameraTransform();
    updateCompassUI();
  }
  triggerHaptic('light');
}

function updateCompassUI() {
  const compassBtn = document.getElementById('btn-compass');
  const compassNeedle = document.getElementById('compass-needle');
  if (!compassBtn) return;
  const baseRot = isVerticalMode ? -90 : 0;
  const rot = currentCamera.rotation || 0;
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
  if (!curr || !next) return null;
  if (next.coordinates.x === curr.coordinates.x && next.coordinates.y === curr.coordinates.y) return null;
  const dx = next.coordinates.x - curr.coordinates.x;
  const dy = next.coordinates.y - curr.coordinates.y;
  return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
}

function zoomToCoordinates(x, y, targetScale = null, animate = true, duration = 600, targetHeadingDeg = null) {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;

  const isMobile = document.body.classList.contains('mobile-navigation-mode') || window.innerWidth < 768;

  if (targetScale === null) {
    targetScale = getDynamicZoomLevel(isSimulating);
  }

  const vp = getMapViewport();
  const u = x / vp.spec.width;
  const v = y / vp.spec.height;
  const pixelX = vp.offsetX + u * vp.renderW;
  const pixelY = vp.offsetY + v * vp.renderH;

  // Target rotation
  let targetRot = isVerticalMode ? -90 : 0;
  if (isMobile && targetHeadingDeg !== null) {
    targetRot = -targetHeadingDeg;
  }

  let currentRot = currentCamera.rotation || (isVerticalMode ? -90 : 0);
  if (!isMobile) currentRot = isVerticalMode ? -90 : 0;

  let diffAngle = (targetRot - (currentRot % 360));
  while (diffAngle < -180) diffAngle += 360;
  while (diffAngle > 180) diffAngle -= 360;
  const finalRot = isMobile ? (currentRot + diffAngle) : (isVerticalMode ? -90 : 0);

  const rad = finalRot * Math.PI / 180;
  const rx = (pixelX * targetScale) * Math.cos(rad) - (pixelY * targetScale) * Math.sin(rad);
  const ry = (pixelX * targetScale) * Math.sin(rad) + (pixelY * targetScale) * Math.cos(rad);

  const targetScreenX = vp.cw / 2;
  const targetScreenY = vp.ch / 2;

  const panX = targetScreenX - rx;
  const panY = targetScreenY - ry;

  if (animate) {
    NavAnimator.animateCameraTo(panX, panY, targetScale, duration, finalRot);
  } else {
    currentCamera.scale = targetScale;
    currentCamera.panX = panX;
    currentCamera.panY = panY;
    currentCamera.rotation = finalRot;
    currentCamera.isZoomed = targetScale > 1.1;
    updateCameraTransform();
    updateZoomButtonUI();
    updateCompassUI();
  }
}

function zoomToOverview(animate = true) {
  const stage = document.getElementById('map-camera-stage');
  if (!stage) return;

  const vp = getMapViewport();
  const spec = vp.spec;
  const baseRot = isVerticalMode ? -90 : 0;
  currentCamera.rotation = baseRot;
  updateCompassUI();

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

  if (animate) {
    NavAnimator.animateCameraTo(panX, panY, targetScale, 450, baseRot);
  } else {
    currentCamera.scale = targetScale;
    currentCamera.panX = panX;
    currentCamera.panY = panY;
    currentCamera.rotation = baseRot;
    currentCamera.isZoomed = false;
    updateCameraTransform();
    updateZoomButtonUI();
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

  const heading = getNodeHeading(targetNode, nextNode);

  if (currentLevel !== targetLevel) {
    switchLevel(targetLevel, false);
    setTimeout(() => {
      zoomToCoordinates(targetNode.coordinates.x, targetNode.coordinates.y, getDynamicZoomLevel(isSimulating), true, 600, heading);
    }, 80);
  } else {
    zoomToCoordinates(targetNode.coordinates.x, targetNode.coordinates.y, getDynamicZoomLevel(isSimulating), true, 600, heading);
  }
}

function manualZoom(factor) {
  const container = document.getElementById('map-container');
  const stage = document.getElementById('map-camera-stage');
  if (!container || !stage) return;
  if (NavAnimator.activeCameraAnim) NavAnimator.activeCameraAnim.pause();

  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotRad = (currentCamera.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(-rotRad);
  const sin = Math.sin(-rotRad);
  const dx = centerX - currentCamera.panX;
  const dy = centerY - currentCamera.panY;
  const localX = (dx * cos - dy * sin) / currentCamera.scale;
  const localY = (dx * sin + dy * cos) / currentCamera.scale;

  const newScale = Math.min(8.0, Math.max(0.65, currentCamera.scale * factor));
  const newDx = (localX * newScale) * Math.cos(rotRad) - (localY * newScale) * Math.sin(rotRad);
  const newDy = (localX * newScale) * Math.sin(rotRad) + (localY * newScale) * Math.cos(rotRad);

  const targetPanX = centerX - newDx;
  const targetPanY = centerY - newDy;

  NavAnimator.animateCameraTo(targetPanX, targetPanY, newScale, 220);
  triggerHaptic('light');
}

function setupInteractiveCameraPan() {
  const container = document.getElementById('map-container');
  if (!container) return;

  let isMouseDown = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let origPanX = 0;
  let origPanY = 0;
  let hasDraggedMap = false;
  const DRAG_THRESHOLD = 5;

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('#map-node-popup')) return;
    isMouseDown = true;
    hasDraggedMap = false;
    if (NavAnimator.activeCameraAnim) NavAnimator.activeCameraAnim.pause();
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    origPanX = currentCamera.panX;
    origPanY = currentCamera.panY;
  });

  let panRafScheduled = false;
  function requestPanUpdate() {
    if (!panRafScheduled) {
      panRafScheduled = true;
      requestAnimationFrame(() => {
        updateCameraTransform();
        updatePopupPosition();
        panRafScheduled = false;
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    if (!hasDraggedMap && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      hasDraggedMap = true;
      container.classList.add('is-dragging');
    }

    if (hasDraggedMap) {
      currentCamera.panX = origPanX + dx;
      currentCamera.panY = origPanY + dy;
      requestPanUpdate();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      container.classList.remove('is-dragging');
      setTimeout(() => {
        hasDraggedMap = false;
      }, 80);
    }
  });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (NavAnimator.activeCameraAnim) NavAnimator.activeCameraAnim.pause();

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let delta = -e.deltaY;
    if (e.ctrlKey) delta *= 2.5;

    const zoomFactor = Math.exp(delta * 0.002);
    const newScale = Math.min(8.0, Math.max(0.65, currentCamera.scale * zoomFactor));

    const rotRad = (currentCamera.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(-rotRad);
    const sin = Math.sin(-rotRad);
    const dx = mouseX - currentCamera.panX;
    const dy = mouseY - currentCamera.panY;
    const localX = (dx * cos - dy * sin) / currentCamera.scale;
    const localY = (dx * sin + dy * cos) / currentCamera.scale;

    const newDx = (localX * newScale) * Math.cos(rotRad) - (localY * newScale) * Math.sin(rotRad);
    const newDy = (localX * newScale) * Math.sin(rotRad) + (localY * newScale) * Math.cos(rotRad);

    currentCamera.panX = mouseX - newDx;
    currentCamera.panY = mouseY - newDy;
    currentCamera.scale = newScale;
    currentCamera.isZoomed = newScale > 1.1;

    requestPanUpdate();
    updateZoomButtonUI();
  }, { passive: false });

  let initialTouchDist = 0;
  let initialScale = 1;
  let initialTouchAngle = 0;
  let initialRotation = 0;
  let touchStartMidX = 0;
  let touchStartMidY = 0;
  let touchStartPanX = 0;
  let touchStartPanY = 0;

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      if (e.touches[0].target.closest('#map-node-popup')) return;
      isMouseDown = true;
      hasDraggedMap = false;
      if (NavAnimator.activeCameraAnim) NavAnimator.activeCameraAnim.pause();
      startMouseX = e.touches[0].clientX;
      startMouseY = e.touches[0].clientY;
      origPanX = currentCamera.panX;
      origPanY = currentCamera.panY;
    } else if (e.touches.length === 2) {
      isMouseDown = false;
      hasDraggedMap = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialScale = currentCamera.scale;
      initialTouchAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
      initialRotation = currentCamera.rotation || 0;
      
      const rect = container.getBoundingClientRect();
      touchStartMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
      touchStartMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
      touchStartPanX = currentCamera.panX;
      touchStartPanY = currentCamera.panY;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isMouseDown) {
      const dx = e.touches[0].clientX - startMouseX;
      const dy = e.touches[0].clientY - startMouseY;
      if (!hasDraggedMap && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        hasDraggedMap = true;
        container.classList.add('is-dragging');
      }
      if (hasDraggedMap) {
        currentCamera.panX = origPanX + dx;
        currentCamera.panY = origPanY + dy;
        requestPanUpdate();
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;

      if (initialTouchDist > 0) {
        const factor = currentDist / initialTouchDist;
        const newScale = Math.min(8.0, Math.max(0.65, initialScale * factor));
        
        const rotRad = (currentCamera.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);
        const dx = touchStartMidX - touchStartPanX;
        const dy = touchStartMidY - touchStartPanY;
        const localX = (dx * cos - dy * sin) / initialScale;
        const localY = (dx * sin + dy * cos) / initialScale;

        const newDx = (localX * newScale) * Math.cos(rotRad) - (localY * newScale) * Math.sin(rotRad);
        const newDy = (localX * newScale) * Math.sin(rotRad) + (localY * newScale) * Math.cos(rotRad);

        currentCamera.scale = newScale;
        currentCamera.panX = touchStartMidX - newDx;
        currentCamera.panY = touchStartMidY - newDy;
        currentCamera.isZoomed = newScale > 1.1;

        let deltaAngle = currentAngle - initialTouchAngle;
        currentCamera.rotation = (initialRotation + deltaAngle) % 360;

        requestPanUpdate();
        updateZoomButtonUI();
        updateCompassUI();
      }
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      isMouseDown = false;
      container.classList.remove('is-dragging');
      setTimeout(() => { hasDraggedMap = false; }, 100);
    }
  });
}

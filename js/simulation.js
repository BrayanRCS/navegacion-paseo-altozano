/**
 * Paseo Altozano · High-Performance Continuous Navigation Engine
 * 60 FPS Continuous Polyline Progression, Slerp Angle & Stable Camera Follow
 */

let activeSimAnim = null;
let activeSimTimeout = null;

function toggleWalkSimulation() {
  triggerHaptic('light');
  if (isSimulating) {
    stopWalkSimulation();
  } else {
    startWalkSimulation();
  }
}

function normalizeAngle(a) {
  while (a < -180) a += 360;
  while (a > 180) a -= 360;
  return a;
}

function slerpAngle(a1, a2, t) {
  const diff = normalizeAngle(a2 - a1);
  return a1 + diff * t;
}

function startWalkSimulation() {
  if (routeSegments.length === 0) return;
  triggerHaptic('medium');
  isFollowingGPS = true;

  stopWalkSimulation();

  isSimulating = true;
  isTransitioningFloor = false;

  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-pause";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "Pausar Recorrido";
  const floatIcon = document.getElementById('btn-floating-nav-icon');
  if (floatIcon) floatIcon.className = "fa-solid fa-pause text-base";
  const floatText = document.getElementById('btn-floating-nav-text');
  if (floatText) floatText.innerText = "Pausar";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-pause";

  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';

  simSegIndex = 0;
  simNodeIndex = 0;
  currentStepIndex = 0;

  if (currentLevel !== routeSegments[0].level) {
    switchLevel(routeSegments[0].level, false);
  }

  playCurrentFloorSegment();
}

function playCurrentFloorSegment() {
  if (!isSimulating || simSegIndex >= routeSegments.length) {
    stopWalkSimulation();
    return;
  }

  const seg = routeSegments[simSegIndex];
  if (!seg || !seg.path || seg.path.length === 0) {
    stopWalkSimulation();
    return;
  }

  if (currentLevel !== seg.level) {
    switchLevel(seg.level, false);
  }

  const points = seg.path.map(n => ({
    x: n.coordinates.x,
    y: n.coordinates.y,
    node: n
  }));

  if (points.length <= 1) {
    positionNavArrowOnNode(points[0].node, points[0].node, false);
    handleSegmentComplete();
    return;
  }

  // 1. Calculate cumulative distances along the polyline
  const cumDist = [0];
  const segHeadings = [];

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const d = Math.hypot(dx, dy);
    cumDist.push(cumDist[i] + d);
    const heading = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    segHeadings.push(heading);
  }

  const totalDist = cumDist[cumDist.length - 1];
  if (totalDist <= 0) {
    handleSegmentComplete();
    return;
  }

  // Natural walking velocity: ~55 px/second (calm, readable, smooth progression)
  const walkingSpeed = 55;
  const totalDurationMs = Math.max(1800, Math.round((totalDist / walkingSpeed) * 1000));

  // Initialize arrow at segment start
  const arrowEl = document.getElementById('svg-nav-arrow-cursor');
  if (arrowEl) {
    arrowEl.style.display = 'block';
    arrowEl.setAttribute('transform', `translate(${points[0].x.toFixed(2)}, ${points[0].y.toFixed(2)}) rotate(${segHeadings[0].toFixed(2)})`);
  }

  if (typeof NavAnimator !== 'undefined') {
    NavAnimator.arrowState = { x: points[0].x, y: points[0].y, angle: segHeadings[0] };
  }

  // Frame the entire route segment cleanly so the map stays completely rock-solid
  if (isFollowingGPS && seg.path && seg.path.length > 0) {
    if (typeof zoomToRouteBoundingBox === 'function') {
      zoomToRouteBoundingBox(seg.path, 550);
    } else {
      zoomToCoordinates(points[0].x, points[0].y, getDynamicZoomLevel(true), true, 450);
    }
  }

  updatePlaceCard(points[0].node);

  // 2. Animate continuously from distance 0 to totalDist
  const progressObj = { dist: 0 };
  let lastReportedStepIdx = -1;
  let lastHeading = segHeadings[0];

  if (activeSimAnim) anime.remove(progressObj);

  activeSimAnim = anime({
    targets: progressObj,
    dist: totalDist,
    duration: totalDurationMs,
    easing: 'linear',
    update: function() {
      if (!isSimulating) return;

      const s = progressObj.dist;

      // Find current polyline segment
      let i = 0;
      while (i < cumDist.length - 2 && cumDist[i + 1] < s) {
        i++;
      }

      const segLen = cumDist[i + 1] - cumDist[i];
      const u = segLen > 0 ? (s - cumDist[i]) / segLen : 0;
      const currentHeading = segHeadings[i];

      // Smooth turn slerp near corners (within 16px radius of vertex)
      let displayAngle = currentHeading;
      const distFromStart = s - cumDist[i];
      const distToEnd = cumDist[i + 1] - s;

      if (distFromStart < 16 && i > 0) {
        const t = distFromStart / 16;
        displayAngle = slerpAngle(segHeadings[i - 1], currentHeading, (t + 1) / 2);
      } else if (distToEnd < 16 && i < segHeadings.length - 1) {
        const t = (16 - distToEnd) / 16;
        displayAngle = slerpAngle(currentHeading, segHeadings[i + 1], t / 2);
      }

      const curX = points[i].x + u * (points[i + 1].x - points[i].x);
      const curY = points[i].y + u * (points[i + 1].y - points[i].y);

      if (arrowEl) {
        arrowEl.setAttribute('transform', `translate(${curX.toFixed(2)}, ${curY.toFixed(2)}) rotate(${displayAngle.toFixed(2)})`);
      }

      if (typeof NavAnimator !== 'undefined') {
        NavAnimator.arrowState.x = curX;
        NavAnimator.arrowState.y = curY;
        NavAnimator.arrowState.angle = displayAngle;
      }

      // Active place card and steps update
      const activeNode = u > 0.5 ? points[i + 1].node : points[i].node;
      const matchingStepIdx = currentSteps.findIndex((st) => st.node && st.node.id === activeNode.id && st.level === seg.level);
      if (matchingStepIdx !== -1 && matchingStepIdx !== lastReportedStepIdx) {
        lastReportedStepIdx = matchingStepIdx;
        currentStepIndex = matchingStepIdx;
        updateTotemUI(false);
        updatePlaceCard(activeNode);
      }
    },
    complete: function() {
      if (!isSimulating) return;
      handleSegmentComplete();
    }
  });
}

function handleSegmentComplete() {
  if (!isSimulating) return;

  const seg = routeSegments[simSegIndex];
  const isFinalSeg = simSegIndex >= routeSegments.length - 1;

  if (!isFinalSeg) {
    // Cross-floor transition
    isTransitioningFloor = true;
    const nextSeg = routeSegments[simSegIndex + 1];
    triggerHaptic('medium');

    const transNode = seg.path[seg.path.length - 1];
    const transStepIdx = currentSteps.findIndex(s => s.isTransition && s.level === seg.level);
    if (transStepIdx !== -1) {
      currentStepIndex = transStepIdx;
      updateTotemUI(false);
    }

    // Show Animated Floor Transition HUD
    if (typeof showFloorTransitionHUD === 'function') {
      showFloorTransitionHUD(seg.level, nextSeg.level, transNode);
    }

    activeSimTimeout = setTimeout(() => {
      if (!isSimulating) {
        if (typeof hideFloorTransitionHUD === 'function') hideFloorTransitionHUD();
        return;
      }
      simSegIndex++;
      isTransitioningFloor = false;
      switchLevel(nextSeg.level, false);
      
      activeSimTimeout = setTimeout(() => {
      if (typeof hideFloorTransitionHUD === 'function') hideFloorTransitionHUD();
      if (isSimulating) playCurrentFloorSegment();
    }, 600);
  }, 1400);
} else {
  // Destination reached!
  if (typeof hideFloorTransitionHUD === 'function') hideFloorTransitionHUD();
  currentStepIndex = currentSteps.length - 1;
  const destNode = seg.path[seg.path.length - 1];
  updatePlaceCard(destNode, true);
  updateTotemUI(false);
  triggerHaptic('success');

  // Terminate simulation cleanly - NO automatic restart loop!
  isSimulating = false;
  isTransitioningFloor = false;

  if (activeSimAnim) {
    activeSimAnim.pause();
    activeSimAnim = null;
  }
  if (activeSimTimeout) {
    clearTimeout(activeSimTimeout);
    activeSimTimeout = null;
  }

  // Update button to prompt user: "¿Reiniciar ruta?"
  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-rotate-right text-base text-emerald-400";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "¿Reiniciar ruta?";
  const floatIcon = document.getElementById('btn-floating-nav-icon');
  if (floatIcon) floatIcon.className = "fa-solid fa-rotate-right text-base text-emerald-400";
  const floatText = document.getElementById('btn-floating-nav-text');
  if (floatText) floatText.innerText = "¿Reiniciar ruta?";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-rotate-right text-emerald-400";
  const mSimText = document.getElementById('mobile-sim-btn-text');
  if (mSimText) mSimText.innerText = "¿Reiniciar?";
}
}

function stopWalkSimulation() {
  isSimulating = false;
  isTransitioningFloor = false;

  if (typeof hideFloorTransitionHUD === 'function') {
    hideFloorTransitionHUD();
  }

  if (activeSimAnim) {
    activeSimAnim.pause();
    activeSimAnim = null;
  }
  if (activeSimTimeout) {
    clearTimeout(activeSimTimeout);
    activeSimTimeout = null;
  }
  if (typeof NavAnimator !== 'undefined' && NavAnimator.activeArrowAnim) {
    NavAnimator.activeArrowAnim.pause();
  }

  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-location-arrow text-base";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "Recorrer con Flecha GPS";
  const floatIcon = document.getElementById('btn-floating-nav-icon');
  if (floatIcon) floatIcon.className = "fa-solid fa-location-arrow text-base";
  const floatText = document.getElementById('btn-floating-nav-text');
  if (floatText) floatText.innerText = "Llevar en el Mapa (GPS)";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-location-arrow";
  const mSimText = document.getElementById('mobile-sim-btn-text');
  if (mSimText) mSimText.innerText = "Simular";

  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';
}

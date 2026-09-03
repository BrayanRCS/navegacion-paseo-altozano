/**
 * Paseo Altozano · GPS Walkthrough Simulation Engine
 * High-performance 60fps Continuous Motion & Tangent Rotation
 */

let activeSimTimeout = null;

function toggleWalkSimulation() {
  triggerHaptic('light');
  if (isSimulating) {
    stopWalkSimulation();
  } else {
    startWalkSimulation();
  }
}

function startWalkSimulation() {
  if (routeSegments.length === 0) return;
  triggerHaptic('medium');
  isFollowingGPS = true;

  // Clear any existing simulation timer
  if (activeSimTimeout) clearTimeout(activeSimTimeout);
  if (typeof NavAnimator !== 'undefined' && NavAnimator.activeArrowAnim) {
    NavAnimator.activeArrowAnim.pause();
  }

  // If already at the end of the route, restart cleanly from step 0
  const isAtEnd = currentStepIndex >= currentSteps.length - 1 || 
                  (simSegIndex >= routeSegments.length - 1 && simNodeIndex >= (routeSegments[simSegIndex]?.path?.length || 0) - 1);
  
  if (isAtEnd) {
    simSegIndex = 0;
    simNodeIndex = 0;
    currentStepIndex = 0;
    if (currentLevel !== routeSegments[0].level) {
      switchLevel(routeSegments[0].level, false);
    }
  }

  isSimulating = true;
  isTransitioningFloor = false;

  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-pause";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "Pausar";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-pause";

  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';

  if (currentLevel !== routeSegments[simSegIndex].level) {
    switchLevel(routeSegments[simSegIndex].level, false);
  }

  const seg = routeSegments[simSegIndex];
  if (seg && seg.path.length > 0) {
    const startNode = seg.path[Math.min(simNodeIndex, seg.path.length - 1)];
    const nextNode = seg.path[Math.min(simNodeIndex + 1, seg.path.length - 1)];
    const heading = getNodeHeading(startNode, nextNode);
    positionNavArrowOnNode(startNode, nextNode, false);
    if (isFollowingGPS) {
      zoomToCoordinates(startNode.coordinates.x, startNode.coordinates.y, getDynamicZoomLevel(true), true, 400, heading);
    }
  }

  // Start continuous sequential stepping
  stepToNextNode();
}

function stepToNextNode() {
  if (!isSimulating || isTransitioningFloor) return;

  if (simSegIndex >= routeSegments.length) {
    stopWalkSimulation();
    simSegIndex = 0;
    simNodeIndex = 0;
    return;
  }

  const seg = routeSegments[simSegIndex];
  const pathNodes = seg.path;

  // Reached the end of current floor path!
  if (simNodeIndex >= pathNodes.length - 1) {
    if (simSegIndex < routeSegments.length - 1) {
      // Cross-floor transition (Escalator / Elevator)
      isTransitioningFloor = true;
      const nextSeg = routeSegments[simSegIndex + 1];
      triggerHaptic('medium');

      const transStepIdx = currentSteps.findIndex(s => s.isTransition && s.level === seg.level);
      if (transStepIdx !== -1) {
        currentStepIndex = transStepIdx;
        updateTotemUI(false);
      }

      activeSimTimeout = setTimeout(() => {
        if (!isSimulating) return;
        simSegIndex++;
        simNodeIndex = 0;
        isTransitioningFloor = false;
        switchLevel(nextSeg.level, false);

        if (nextSeg.path.length > 0) {
          const startN = nextSeg.path[0];
          const nextN = nextSeg.path.length > 1 ? nextSeg.path[1] : startN;
          const heading = getNodeHeading(startN, nextN);
          positionNavArrowOnNode(startN, nextN, false);
          updatePlaceCard(startN);
          if (isFollowingGPS) {
            zoomToCoordinates(startN.coordinates.x, startN.coordinates.y, getDynamicZoomLevel(true), true, 450, heading);
          }
          activeSimTimeout = setTimeout(() => {
            if (isSimulating) stepToNextNode();
          }, 350);
        }
      }, 700);
      return;
    } else {
      // Reached final destination!
      currentStepIndex = currentSteps.length - 1;
      const destN = seg.path[seg.path.length - 1];
      updatePlaceCard(destN, true);
      updateTotemUI(false);
      isTransitioningFloor = true;
      triggerHaptic('success');

      activeSimTimeout = setTimeout(() => {
        if (!isSimulating) return;
        simSegIndex = 0;
        simNodeIndex = 0;
        currentStepIndex = 0;
        isTransitioningFloor = false;

        if (currentLevel !== routeSegments[0].level) {
          switchLevel(routeSegments[0].level, false);
        }
        updateTotemUI(false);

        if (routeSegments[0] && routeSegments[0].path.length > 0) {
          const startNode = routeSegments[0].path[0];
          const nextNode = routeSegments[0].path.length > 1 ? routeSegments[0].path[1] : startNode;
          const heading = getNodeHeading(startNode, nextNode);
          positionNavArrowOnNode(startNode, nextNode, false);
          updatePlaceCard(startNode);
          if (isFollowingGPS) {
            zoomToCoordinates(startNode.coordinates.x, startNode.coordinates.y, getDynamicZoomLevel(true), true, 450, heading);
          }
          activeSimTimeout = setTimeout(() => {
            if (isSimulating) stepToNextNode();
          }, 600);
        }
      }, 1500);
      return;
    }
  }

  const curr = pathNodes[simNodeIndex];
  const next = pathNodes[simNodeIndex + 1];
  const heading = getNodeHeading(curr, next);

  const dist = Math.hypot(next.coordinates.x - curr.coordinates.x, next.coordinates.y - curr.coordinates.y);
  // Natural human walking velocity (~110 px/s) gives 100% fluid, uniform camera & arrow movement
  const stepDuration = Math.max(280, Math.min(800, Math.round(dist * 7.5)));
  const isDestinationNode = (simSegIndex === routeSegments.length - 1) && (simNodeIndex + 1 === pathNodes.length - 1);

  // Smooth continuous vector motion
  if (typeof NavAnimator !== 'undefined' && NavAnimator.animateArrowTo) {
    NavAnimator.animateArrowTo(next.coordinates.x, next.coordinates.y, heading, stepDuration, 'linear', () => {
      if (!isSimulating) return;
      simNodeIndex++;
      updatePlaceCard(next, isDestinationNode);

      const matchingStepIdx = currentSteps.findIndex((s) => s.node && s.node.id === next.id && s.level === seg.level);
      if (matchingStepIdx !== -1 && matchingStepIdx !== currentStepIndex) {
        currentStepIndex = matchingStepIdx;
        updateTotemUI(false);
        triggerHaptic('light');
      }

      stepToNextNode();
    });
  } else {
    positionNavArrowOnNode(next, next, false);
    simNodeIndex++;
    stepToNextNode();
  }

  if (isFollowingGPS) {
    zoomToCoordinates(next.coordinates.x, next.coordinates.y, getDynamicZoomLevel(true), true, stepDuration, heading);
  }
}

function stopWalkSimulation() {
  isSimulating = false;
  isTransitioningFloor = false;
  if (activeSimTimeout) {
    clearTimeout(activeSimTimeout);
    activeSimTimeout = null;
  }
  if (typeof NavAnimator !== 'undefined' && NavAnimator.activeArrowAnim) {
    NavAnimator.activeArrowAnim.pause();
  }

  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-location-arrow";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "Recorrer con Flecha GPS";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-location-arrow";

  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';
}

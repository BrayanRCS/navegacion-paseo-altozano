/**
 * Paseo Altozano · GPS Walkthrough Simulation Engine
 */

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

  // If already at the end of the route, restart cleanly from step 0
  const isAtEnd = currentStepIndex >= currentSteps.length - 1 || 
                  (simSegIndex >= routeSegments.length - 1 && simNodeIndex >= (routeSegments[simSegIndex]?.path?.length || 0));
  
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
    zoomToCoordinates(startNode.coordinates.x, startNode.coordinates.y, getDynamicZoomLevel(true), true, WALK_STEP_DURATION, heading);
  }

  clearInterval(simInterval);
  runSimulationStep();
  simInterval = setInterval(runSimulationStep, WALK_STEP_DURATION);
}

function runSimulationStep() {
  if (!isSimulating || isTransitioningFloor) return;

  if (simSegIndex >= routeSegments.length) {
    stopWalkSimulation();
    simSegIndex = 0;
    simNodeIndex = 0;
    return;
  }

  const seg = routeSegments[simSegIndex];
  const pathNodes = seg.path;

  if (simNodeIndex >= pathNodes.length) {
    // Reached end of current floor segment!
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

      setTimeout(() => {
        if (!isSimulating) return;
        simSegIndex++;
        simNodeIndex = 0;
        isTransitioningFloor = false;
        switchLevel(nextSeg.level, false);
        if (nextSeg.path.length > 0) {
          const startN = nextSeg.path[0];
          const nextN = nextSeg.path.length > 1 ? nextSeg.path[1] : startN;
          const heading = getNodeHeading(startN, nextN);
          updatePlaceCard(startN);
          if (isFollowingGPS) {
            zoomToCoordinates(startN.coordinates.x, startN.coordinates.y, getDynamicZoomLevel(true), true, WALK_STEP_DURATION, heading);
          }
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

      setTimeout(() => {
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
          updatePlaceCard(startNode);
          if (isFollowingGPS) {
            zoomToCoordinates(startNode.coordinates.x, startNode.coordinates.y, getDynamicZoomLevel(true), true, WALK_STEP_DURATION, heading);
          }
        }
      }, 1200);
      return;
    }
  }

  const curr = pathNodes[simNodeIndex];
  const next = pathNodes[Math.min(pathNodes.length - 1, simNodeIndex + 1)];
  const heading = getNodeHeading(curr, next);

  let dist = 30;
  if (next && curr) {
    dist = Math.hypot(next.coordinates.x - curr.coordinates.x, next.coordinates.y - curr.coordinates.y);
  }
  const stepDuration = Math.max(450, Math.min(750, dist * 7.5));
  const isDestinationNode = (simSegIndex === routeSegments.length - 1) && (simNodeIndex === pathNodes.length - 1);

  positionNavArrowOnNode(curr, next, true, stepDuration, isDestinationNode ? 'easeOutCubic' : 'linear');

  if (isFollowingGPS) {
    zoomToCoordinates(curr.coordinates.x, curr.coordinates.y, getDynamicZoomLevel(true), true, stepDuration, heading);
  }

  updatePlaceCard(curr, isDestinationNode);

  const matchingStepIdx = currentSteps.findIndex((s, idx) => s.node && s.node.id === curr.id && s.level === seg.level);
  if (matchingStepIdx !== -1 && matchingStepIdx !== currentStepIndex) {
    currentStepIndex = matchingStepIdx;
    updateTotemUI(false);
    triggerHaptic('light');
  }

  simNodeIndex++;
}

function stopWalkSimulation() {
  isSimulating = false;
  isTransitioningFloor = false;
  clearInterval(simInterval);
  const hudIcon = document.getElementById('hud-sim-icon');
  if (hudIcon) hudIcon.className = "fa-solid fa-location-arrow";
  const hudText = document.getElementById('hud-sim-btn-text');
  if (hudText) hudText.innerText = "Recorrer con Flecha GPS";
  const mSimIcon = document.getElementById('mobile-sim-icon');
  if (mSimIcon) mSimIcon.className = "fa-solid fa-location-arrow";

  const nodesLayer = document.getElementById('svg-nodes-layer');
  if (nodesLayer) nodesLayer.style.display = showStoresAndRestaurants ? 'block' : 'none';
}

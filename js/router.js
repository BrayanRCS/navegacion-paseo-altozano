/**
 * Paseo Altozano · Routing & A* Pathfinding Engine
 */

function buildFloorSubgraphs() {
  levelGraphs = { 1: {}, 2: {}, 3: {} };
  levelNodes = { 1: {}, 2: {}, 3: {} };

  if (!mallGraph) return;

  mallGraph.nodes.forEach(n => {
    if (levelNodes[n.level]) {
      levelNodes[n.level][n.id] = n;
      levelGraphs[n.level][n.id] = [];
    }
  });

  mallGraph.edges.forEach(e => {
    const fromLvl = levelNodes[1][e.from] ? 1 : (levelNodes[2][e.from] ? 2 : (levelNodes[3][e.from] ? 3 : null));
    const toLvl = levelNodes[1][e.to] ? 1 : (levelNodes[2][e.to] ? 2 : (levelNodes[3][e.to] ? 3 : null));
    
    if (fromLvl && toLvl && fromLvl === toLvl) {
      const u = levelNodes[fromLvl][e.from];
      const v = levelNodes[toLvl][e.to];
      const dist = Math.hypot(u.coordinates.x - v.coordinates.x, u.coordinates.y - v.coordinates.y);
      levelGraphs[fromLvl][e.from].push({ to: e.to, dist: dist, from: e.from });
      levelGraphs[fromLvl][e.to].push({ to: e.from, dist: dist, from: e.to });
    }
  });
}

function getDynamicPortals() {
  const dynamicPortals = [];
  
  if (mallGraph && Array.isArray(mallGraph.nodes)) {
    const portalGroups = new Map();
    mallGraph.nodes.forEach(n => {
      const isPortal = n.type && (n.type.startsWith("portal_") || n.id.includes("portal_") || (n.name && (n.name.includes("Escalera") || n.name.includes("Elevador"))));
      const code = n.twin_code || n.portal_code;
      if (code && isPortal) {
        if (!portalGroups.has(code)) {
          portalGroups.set(code, {
            id: "p_twin_" + code.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            twin_code: code,
            type: (n.type === "portal_elevator" || (n.name && n.name.toLowerCase().includes("elevador"))) ? "elevator" : "escalator",
            name: (n.name || "Conexión").replace(/\s*\([^)]*\)/g, "").trim() + " [" + code + "]"
          });
        }
        const group = portalGroups.get(code);
        group[n.level] = n.id;
      }
    });

    portalGroups.forEach(group => {
      const floors = [1, 2, 3].filter(lvl => group[lvl]);
      if (floors.length >= 2) {
        dynamicPortals.push(group);
      }
    });
  }

  // Fallback to static PORTALS if any missing
  if (typeof PORTALS !== "undefined" && Array.isArray(PORTALS)) {
    getDynamicPortals().forEach(p => {
      if (!dynamicPortals.some(dp => dp.id === p.id || (p.twin_code && dp.twin_code === p.twin_code))) {
        dynamicPortals.push(p);
      }
    });
  }

  return dynamicPortals;
}

function aStarSingleFloor(lvl, startId, goalId) {
  const nodes = levelNodes[lvl];
  const graph = levelGraphs[lvl];

  if (!nodes || !nodes[startId] || !nodes[goalId]) return [];

  const startNode = nodes[startId];
  const goalNode = nodes[goalId];

  const heuristic = (id) => {
    const n = nodes[id];
    return Math.hypot(n.coordinates.x - goalNode.coordinates.x, n.coordinates.y - goalNode.coordinates.y);
  };

  const openSet = new Set([startId]);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  Object.keys(nodes).forEach(id => {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  });

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId));

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      if (fScore.get(id) < lowestF) {
        lowestF = fScore.get(id);
        current = id;
      }
    }

    if (current === goalId) {
      const path = [];
      let curr = current;
      while (curr !== undefined) {
        path.unshift(nodes[curr]);
        curr = cameFrom.get(curr);
      }
      return path;
    }

    openSet.delete(current);

    const neighbors = graph[current] || [];
    for (const edge of neighbors) {
      const neighbor = edge.to;
      const tentativeG = gScore.get(current) + edge.dist;

      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor));
        openSet.add(neighbor);
      }
    }
  }

  return [];
}

function calculateMultiFloorRoute(startId, goalId, preferElevator = false) {
  let startNode = null;
  let goalNode = null;
  let startLvl = null;
  let goalLvl = null;

  [1, 2, 3].forEach(lvl => {
    if (levelNodes[lvl] && levelNodes[lvl][startId]) {
      startNode = levelNodes[lvl][startId];
      startLvl = lvl;
    }
    if (levelNodes[lvl] && levelNodes[lvl][goalId]) {
      goalNode = levelNodes[lvl][goalId];
      goalLvl = lvl;
    }
  });

  if (!startNode || !goalNode) return [];

  // Same floor route
  if (startLvl === goalLvl) {
    const path = aStarSingleFloor(startLvl, startId, goalId);
    return [{
      level: startLvl,
      title: `Planta ${startLvl === 1 ? 'Baja' : (startLvl === 2 ? '1' : '2')}`,
      subtitle: `Ruta directa en el mismo nivel`,
      path: path,
      start: startNode,
      goal: goalNode,
      isFinal: true
    }];
  }

  // Adjacent floors
  if (Math.abs(startLvl - goalLvl) === 1) {
    let candidatePortals = [];
    getDynamicPortals().forEach(p => {
      if (p[startLvl] && p[goalLvl]) {
        if (preferElevator && p.type !== 'elevator') return;
        candidatePortals.push(p);
      }
    });

    if (candidatePortals.length === 0) {
      candidatePortals = getDynamicPortals().filter(p => p[startLvl] && p[goalLvl]);
    }

    let bestRoute = null;
    let minTotalDist = Infinity;

    candidatePortals.forEach(portal => {
      const startPortalId = portal[startLvl];
      const goalPortalId = portal[goalLvl];

      const path1 = aStarSingleFloor(startLvl, startId, startPortalId);
      const path2 = aStarSingleFloor(goalLvl, goalPortalId, goalId);

      if (path1.length > 0 && path2.length > 0) {
        let dist1 = 0;
        for (let i = 0; i < path1.length - 1; i++) {
          dist1 += Math.hypot(path1[i].coordinates.x - path1[i+1].coordinates.x, path1[i].coordinates.y - path1[i+1].coordinates.y);
        }
        let dist2 = 0;
        for (let i = 0; i < path2.length - 1; i++) {
          dist2 += Math.hypot(path2[i].coordinates.x - path2[i+1].coordinates.x, path2[i].coordinates.y - path2[i+1].coordinates.y);
        }
        const portalPenalty = portal.type === 'elevator' ? (preferElevator ? 0 : 30) : 10;
        const totalScore = dist1 + dist2 + portalPenalty;

        if (totalScore < minTotalDist) {
          minTotalDist = totalScore;
          bestRoute = [
            {
              level: startLvl,
              title: `Tramo 1: Planta ${startLvl === 1 ? 'Baja' : (startLvl === 2 ? '1' : '2')}`,
              subtitle: `Hacia ${portal.name}`,
              path: path1,
              start: startNode,
              goal: levelNodes[startLvl][startPortalId],
              isFinal: false,
              portalName: portal.name,
              portalType: portal.type,
              targetLevel: goalLvl,
              transitionText: `Toma ${portal.name} hacia Nivel ${goalLvl === 1 ? 'PB' : (goalLvl === 2 ? '1' : '2')}`
            },
            {
              level: goalLvl,
              title: `Tramo 2: Planta ${goalLvl === 1 ? 'Baja' : (goalLvl === 2 ? '1' : '2')}`,
              subtitle: `Desde ${portal.name} hacia ${goalNode.name}`,
              path: path2,
              start: levelNodes[goalLvl][goalPortalId],
              goal: goalNode,
              isFinal: true
            }
          ];
        }
      }
    });

    if (bestRoute) return bestRoute;
  }

  // Two floors apart (Level 1 <-> Level 3 via Level 2)
  if (Math.abs(startLvl - goalLvl) === 2) {
    const midLvl = 2;
    let bestRoute = null;
    let minTotalDist = Infinity;

    getDynamicPortals().forEach(p1 => {
      if (!p1[startLvl] || !p1[midLvl]) return;
      getDynamicPortals().forEach(p2 => {
        if (!p2[midLvl] || !p2[goalLvl]) return;

        const path1 = aStarSingleFloor(startLvl, startId, p1[startLvl]);
        const path2 = aStarSingleFloor(midLvl, p1[midLvl], p2[midLvl]);
        const path3 = aStarSingleFloor(goalLvl, p2[goalLvl], goalId);

        if (path1.length > 0 && path2.length > 0 && path3.length > 0) {
          let score = path1.length * 10 + path2.length * 10 + path3.length * 10;
          if (score < minTotalDist) {
            minTotalDist = score;
            bestRoute = [
              {
                level: startLvl,
                title: `Tramo 1: Planta ${startLvl === 1 ? 'Baja' : '2'}`,
                subtitle: `Hacia ${p1.name}`,
                path: path1,
                start: startNode,
                goal: levelNodes[startLvl][p1[startLvl]],
                isFinal: false,
                portalName: p1.name,
                portalType: p1.type,
                targetLevel: midLvl,
                transitionText: `Toma ${p1.name} al Nivel 1`
              },
              {
                level: midLvl,
                title: `Tramo 2: Planta 1 (Conexión)`,
                subtitle: `Transbordo por Nivel 1`,
                path: path2,
                start: levelNodes[midLvl][p1[midLvl]],
                goal: levelNodes[midLvl][p2[midLvl]],
                isFinal: false,
                portalName: p2.name,
                portalType: p2.type,
                targetLevel: goalLvl,
                transitionText: `Toma ${p2.name} hacia Nivel ${goalLvl === 1 ? 'PB' : '2'}`
              },
              {
                level: goalLvl,
                title: `Tramo 3: Planta ${goalLvl === 1 ? 'Baja' : '2'}`,
                subtitle: `Hacia ${goalNode.name}`,
                path: path3,
                start: levelNodes[goalLvl][p2[goalLvl]],
                goal: goalNode,
                isFinal: true
              }
            ];
          }
        }
      });
    });

    if (bestRoute) return bestRoute;
  }

  return [];
}

function buildStepByStepList() {
  currentSteps = [];
  if (routeSegments.length === 0) return;

  routeSegments.forEach((seg, sIdx) => {
    const p = seg.path;
    if (p.length === 0) return;

    // Step 1: Start
    if (sIdx === 0) {
      const startNode = p[0];
      const nextNode = p.length > 1 ? p[1] : p[0];
      const startMsg = startNode.id === TOTEM_NODE_ID 
        ? "Inicia tu recorrido desde este Tótem (Punto 12)" 
        : `Inicia tu recorrido desde ${startNode.name}`;

      currentSteps.push({
        level: seg.level,
        title: startMsg,
        context: nextNode.context_element ? `Avanza hacia ${nextNode.context_element}` : "Avanza por el pasillo principal",
        icon: "fa-location-arrow",
        actionText: "Comenzar recorrido",
        node: startNode,
        nextNode: nextNode
      });
    }

    // Waypoints sampled by turn angle & distance
    let accumulatedDist = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const prev = p[i - 1];
      const curr = p[i];
      const next = p[i + 1];

      const d = Math.hypot(curr.coordinates.x - prev.coordinates.x, curr.coordinates.y - prev.coordinates.y) * 0.28;
      accumulatedDist += d;

      const dx1 = curr.coordinates.x - prev.coordinates.x;
      const dy1 = curr.coordinates.y - prev.coordinates.y;
      const dx2 = next.coordinates.x - curr.coordinates.x;
      const dy2 = next.coordinates.y - curr.coordinates.y;

      const angle1 = Math.atan2(dy1, dx1) * 180 / Math.PI;
      const angle2 = Math.atan2(dy2, dx2) * 180 / Math.PI;
      let diff = angle2 - angle1;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;

      const isSharpTurn = Math.abs(diff) > 28;
      const isDistanceTrigger = accumulatedDist >= 35;
      const isKeyLandmark = curr.context_element && (
        curr.context_element.includes("Sanborns") || 
        curr.context_element.includes("Starbucks") || 
        curr.context_element.includes("Rotonda") || 
        curr.context_element.includes("Fuente") || 
        curr.context_element.includes("Cinelia") || 
        curr.context_element.includes("Liverpool") || 
        curr.context_element.includes("Sears") ||
        curr.context_element.includes("Chedraui")
      );

      if (isSharpTurn || isDistanceTrigger || isKeyLandmark) {
        let turnTitle = "Continúa recto por el pasillo";
        let turnIcon = "fa-arrow-up";

        if (diff > 25) {
          turnTitle = "Gira a la derecha";
          turnIcon = "fa-arrow-turn-up text-rotate-90";
        } else if (diff < -25) {
          turnTitle = "Gira a la izquierda";
          turnIcon = "fa-arrow-turn-up text-flip-x";
        }

        let contextMsg = curr.context_element 
          ? `A la altura de ${curr.context_element}` 
          : `Avanza ${Math.round(accumulatedDist)} m por el pasillo`;

        if (curr.context_element && curr.context_element.includes("Sanborns")) {
          contextMsg = "Justo pasando Sanborns · verás la fuente a tu izquierda";
        } else if (curr.context_element && curr.context_element.includes("Starbucks")) {
          contextMsg = "Pasando frente a Starbucks en la rotonda central";
        } else if (curr.context_element && curr.context_element.includes("Rotonda")) {
          contextMsg = "Sigue la curva de la rotonda central";
        }

        currentSteps.push({
          level: seg.level,
          title: turnTitle,
          context: contextMsg,
          icon: turnIcon,
          actionText: `Ya pasé ${curr.context_element || 'este tramo'}`,
          node: curr,
          nextNode: next
        });

        accumulatedDist = 0;
      }
    }

    // Inter-floor portal transition step
    if (!seg.isFinal) {
      const portalNode = p[p.length - 1];
      const icon = seg.portalType === 'elevator' ? 'fa-elevator' : 'fa-stairs';
      currentSteps.push({
        level: seg.level,
        title: seg.transitionText,
        context: `Toma ${portalNode.name} para cambiar de nivel`,
        icon: icon,
        actionText: `Ya cambié al Nivel ${seg.targetLevel === 1 ? 'PB' : (seg.targetLevel === 2 ? '1' : '2')}`,
        node: portalNode,
        nextNode: portalNode,
        isTransition: true,
        nextLevel: seg.targetLevel
      });
    } else {
      // Final Destination Arrival
      const destNode = p[p.length - 1];
      currentSteps.push({
        level: seg.level,
        title: `¡Has llegado a ${destNode.name}!`,
        context: `Tu destino está frente a ti en el Nivel ${destNode.level === 1 ? 'PB' : (destNode.level === 2 ? '1' : '2')}`,
        icon: 'fa-location-dot',
        actionText: 'Finalizar recorrido',
        node: destNode,
        nextNode: null
      });
    }
  });

  const chipCount = document.getElementById('chip-steps-count');
  if (chipCount) chipCount.innerHTML = `<i class="fa-solid fa-shoe-prints mr-1"></i> ${currentSteps.length} pasos guiados`;
  renderStepsList();
}

function calculateRoute() {
  stopWalkSimulation();
  simSegIndex = 0;
  simNodeIndex = 0;
  currentStepIndex = 0;

  const origSelect = document.getElementById('origin-select');
  const destSelect = document.getElementById('dest-select');
  const origId = origSelect ? origSelect.value : TOTEM_NODE_ID;
  const destId = destSelect ? destSelect.value : null;

  if (!origId || !destId || !mallGraph) return;

  const preferElevator = document.getElementById('prefer-elevator-chk')?.checked || false;
  routeSegments = calculateMultiFloorRoute(origId, destId, preferElevator);

  if (routeSegments.length === 0) return;

  const origNode = routeSegments[0].start;
  const destNode = routeSegments[routeSegments.length - 1].goal;

  // Calculate total distance
  let totalDistMeters = 0;
  routeSegments.forEach(seg => {
    for (let i = 0; i < seg.path.length - 1; i++) {
      totalDistMeters += Math.hypot(
        seg.path[i].coordinates.x - seg.path[i+1].coordinates.x,
        seg.path[i].coordinates.y - seg.path[i+1].coordinates.y
      ) * 0.28;
    }
    if (!seg.isFinal) totalDistMeters += 20;
  });

  const distMeters = Math.max(15, Math.round(totalDistMeters));
  const walkMinutes = Math.max(1, Math.round(distMeters / 75));

  // Update Summary Chips
  const chipDist = document.getElementById('chip-dist');
  if (chipDist) chipDist.innerHTML = `<i class="fa-solid fa-ruler-horizontal mr-1"></i> ${distMeters} m`;
  const chipTime = document.getElementById('chip-time');
  if (chipTime) chipTime.innerHTML = `<i class="fa-solid fa-clock mr-1"></i> ${walkMinutes} min a pie`;
  const chipFloors = document.getElementById('chip-floors');
  if (chipFloors) {
    chipFloors.innerHTML = origNode.level === destNode.level ? 
      `<i class="fa-solid fa-circle-check mr-1"></i> Mismo nivel (${origNode.level === 1 ? 'PB' : (origNode.level === 2 ? '1' : '2')})` : 
      `<i class="fa-solid fa-stairs mr-1"></i> Nivel ${origNode.level === 1 ? 'PB' : (origNode.level === 2 ? '1' : '2')} → Nivel ${destNode.level === 1 ? 'PB' : (destNode.level === 2 ? '1' : '2')}`;
  }

  const visualInfo = getPlaceVisualInfo(destNode);

  // Update Map View Target Header
  const targetTitle = document.getElementById('map-target-title');
  if (targetTitle) targetTitle.innerText = destNode.name || 'Destino';
  const targetMetrics = document.getElementById('map-target-metrics');
  if (targetMetrics) targetMetrics.innerText = `${distMeters} m · ~${walkMinutes} min a pie · Nivel ${destNode.level === 1 ? 'PB' : (destNode.level === 2 ? '1' : '2')}`;
  
  const targetIconBox = document.getElementById('map-target-icon-box');
  if (targetIconBox) {
    if (destNode.logo) {
      targetIconBox.className = "w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-xl border border-slate-700/60 flex-shrink-0";
      targetIconBox.innerHTML = getLogoHtml(destNode.logo, destNode.name, 'w-full h-full object-contain brand-logo-img');
    } else {
      targetIconBox.className = `w-12 h-12 rounded-2xl bg-gradient-to-tr ${visualInfo.bgGradient} flex items-center justify-center text-2xl shadow-md flex-shrink-0`;
      targetIconBox.innerHTML = `<span id="map-target-emoji">${visualInfo.emoji}</span>`;
    }
  }

  // Sync Mobile View Header
  const mTargetTitle = document.getElementById('mobile-target-title');
  if (mTargetTitle) mTargetTitle.innerText = destNode.name || 'Destino';
  const mTargetMetrics = document.getElementById('mobile-target-metrics');
  if (mTargetMetrics) mTargetMetrics.innerText = `${distMeters} m · ~${walkMinutes} min a pie`;
  const mTargetEmoji = document.getElementById('mobile-target-emoji');
  if (mTargetEmoji && mTargetEmoji.parentElement) {
    if (destNode.logo) {
      mTargetEmoji.parentElement.className = "w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0 border border-slate-700/60";
      mTargetEmoji.parentElement.innerHTML = getLogoHtml(destNode.logo, destNode.name, 'w-full h-full object-contain brand-logo-img');
    } else {
      mTargetEmoji.parentElement.className = "w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-lg shadow-md flex-shrink-0";
      mTargetEmoji.parentElement.innerHTML = `<span id="mobile-target-emoji">${visualInfo.emoji}</span>`;
    }
  }

  // Update Totem Bottom Bar
  const rTimeDist = document.getElementById('route-time-dist');
  if (rTimeDist) rTimeDist.innerText = `${walkMinutes} min · ${distMeters} m`;
  const rDestName = document.getElementById('route-dest-name');
  if (rDestName) rDestName.innerText = `a ${destNode.name || 'Destino'} · Nivel ${destNode.level === 1 ? 'PB' : (destNode.level === 2 ? '1' : '2')}`;

  buildStepByStepList();
  currentStepIndex = 0;
  renderRouteSegmentsBar();

  if (routeSegments.length > 0 && routeSegments[0].level !== currentLevel) {
    switchLevel(routeSegments[0].level, false);
  }
  renderMapOverlay(true);
  updateTotemUI(true);
  zoomToOverview(false);
}

function swapEndpoints() {
  const orig = document.getElementById('origin-select').value;
  const dest = document.getElementById('dest-select').value;
  document.getElementById('origin-select').value = dest;
  document.getElementById('dest-select').value = orig;
  calculateRoute();
}

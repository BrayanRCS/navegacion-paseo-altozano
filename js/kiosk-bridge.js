/**
 * Paseo Altozano · SmartCity Kiosk postMessage Integration Bridge
 * Connects the A* navigation engine with the React 18 / Vite / Tauri host screen
 */

(function () {
  const isEmbedded = window.self !== window.top;
  let lastActivityTimestamp = 0;
  const ACTIVITY_THROTTLE_MS = 1200;

  // 1. Emit throttled touch/click activity to reset kiosk 60s idle timer
  function reportUserActivity() {
    const now = Date.now();
    if (now - lastActivityTimestamp > ACTIVITY_THROTTLE_MS) {
      lastActivityTimestamp = now;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'USER_ACTIVITY' }, '*');
        window.parent.postMessage({ type: 'USER_TOUCH' }, '*'); // Alias for full compatibility
      }
    }
  }

  window.addEventListener('touchstart', reportUserActivity, { passive: true });
  window.addEventListener('pointerdown', reportUserActivity, { passive: true });
  window.addEventListener('click', reportUserActivity, { passive: true });

  // 2. Outgoing event helpers (Map -> React Host Screen)
  window.KioskBridge = {
    isEmbedded: isEmbedded,

    // When user selects a tenant / store
    notifySelectTenant: function (node) {
      if (!node || !window.parent) return;
      window.parent.postMessage({
        type: 'SELECT_TENANT',
        localId: node.id,
        store: {
          id: node.id,
          name: node.name,
          level: node.level,
          levelCode: node.level === 1 ? 'L0' : (node.level === 2 ? 'L1' : 'L2'),
          levelName: node.level === 1 ? 'Planta Baja' : (node.level === 2 ? 'Nivel 1' : 'Nivel 2'),
          type: node.type,
          logo: node.logo || null,
          coordinates: node.coordinates
        }
      }, '*');
    },

    // When user taps "Cerrar Mapa" or return to kiosk
    notifyCloseMap: function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CLOSE_MAP' }, '*');
      } else if (typeof window.showDirectoryView === 'function') {
        window.showDirectoryView();
      }
    },

    // Request host container to enter/exit fullscreen
    requestFullscreen: function (state) {
      if (window.parent) {
        window.parent.postMessage({ type: 'REQUEST_FULLSCREEN', fullscreen: Boolean(state) }, '*');
      }
    },

    // Notify host container of cursor visibility change
    notifyCursorVisibility: function (visible) {
      if (window.parent) {
        window.parent.postMessage({ type: 'SET_CURSOR_VISIBILITY', visible: Boolean(visible) }, '*');
      }
    },

    // When metrics / analytics need to be recorded to Firestore statsService
    notifyMetricsEvent: function (action, payload) {
      if (window.parent) {
        window.parent.postMessage({
          type: 'METRICS_EVENT',
          action: action,
          payload: payload || {},
          timestamp: Date.now()
        }, '*');
      }
    }
  };

  // 3. Incoming orders from React Host Screen (Host -> Map)
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, localId, storeId, storeName, level, totemId, kioskLevel, kioskNode } = event.data;

    switch (type) {
      case 'SET_DESTINATION': {
        const query = (localId || storeId || storeName || '').trim();
        if (!query || !window.mallGraph || !Array.isArray(window.mallGraph.nodes)) return;

        // 1. Direct ID match
        let targetNode = window.mallGraph.nodes.find(n => n.id === query);

        // 2. Normalized name match
        if (!targetNode) {
          const cleanQ = query.toLowerCase();
          targetNode = window.mallGraph.nodes.find(n => (n.name || '').toLowerCase() === cleanQ);
          if (!targetNode) {
            targetNode = window.mallGraph.nodes.find(n => (n.name || '').toLowerCase().includes(cleanQ));
          }
        }

        if (targetNode && typeof window.showMapView === 'function') {
          window.showMapView(targetNode.id);
        }
        break;
      }

      case 'CHANGE_LEVEL': {
        let targetLevel = level;
        if (typeof targetLevel === 'string') {
          const upper = targetLevel.toUpperCase();
          if (upper === 'L0' || upper === 'PB') targetLevel = 1;
          else if (upper === 'L1' || upper === 'N1' || upper === '1') targetLevel = 2;
          else if (upper === 'L2' || upper === 'N2' || upper === '2') targetLevel = 3;
          else targetLevel = parseInt(targetLevel) || 2;
        }
        if (typeof window.switchLevel === 'function') {
          window.switchLevel(targetLevel);
        }
        break;
      }

      case 'FOCUS_TOTEM':
      case 'RESET_ROUTE': {
        if (typeof window.stopWalkSimulation === 'function') window.stopWalkSimulation();
        window.routeSegments = [];
        window.currentSteps = [];
        window.currentStepIndex = 0;
        let lvl = kioskLevel || 2;
        if (typeof lvl === 'string') {
          const u = lvl.toUpperCase();
          if (u === 'L0' || u === 'PB') lvl = 1;
          else if (u === 'L1' || u === 'N1') lvl = 2;
          else if (u === 'L2' || u === 'N2') lvl = 3;
          else lvl = parseInt(lvl) || 2;
        }
        if (typeof window.switchLevel === 'function') {
          window.switchLevel(lvl, false);
        }
        if (typeof window.renderMapOverlay === 'function') window.renderMapOverlay();
        if (typeof window.zoomToTotem === 'function') {
          window.zoomToTotem(true, 2.6);
        } else if (typeof window.zoomToOverview === 'function') {
          window.zoomToOverview(false);
        }
        break;
      }

      case 'INIT_TOTEM': {
        const targetTotemId = totemId || event.data.deviceId || 'n_totem_12';
        if (targetTotemId && typeof window.setActiveTotemId === 'function') {
          window.setActiveTotemId(targetTotemId, false);
        }
        let lvl = kioskLevel || 2;
        if (typeof lvl === 'string') {
          const u = lvl.toUpperCase();
          if (u === 'L0' || u === 'PB') lvl = 1;
          else if (u === 'L1' || u === 'N1') lvl = 2;
          else if (u === 'L2' || u === 'N2') lvl = 3;
          else lvl = parseInt(lvl) || 2;
        }
        if (typeof window.switchLevel === 'function') {
          window.switchLevel(lvl, false);
        }
        if (typeof window.renderMapOverlay === 'function') window.renderMapOverlay();
        if (typeof window.zoomToTotem === 'function') {
          window.zoomToTotem(false, 2.6);
        }
        break;
      }

      case 'TOGGLE_FULLSCREEN': {
        if (typeof window.toggleAppFullscreen === 'function') {
          window.toggleAppFullscreen();
        }
        break;
      }

      case 'SET_FULLSCREEN': {
        if (typeof window.setAppFullscreen === 'function') {
          window.setAppFullscreen(Boolean(event.data.fullscreen));
        }
        break;
      }

      case 'SET_CURSOR_VISIBILITY': {
        const visible = Boolean(event.data.visible);
        if (typeof window.setCursorVisibility === 'function') {
          window.setCursorVisibility(visible);
        } else {
          document.documentElement.classList.toggle('force-cursor-visible', visible);
        }
        break;
      }
    }
  });

  // 4. Send handshake to parent frame when loaded
  document.addEventListener('DOMContentLoaded', function () {
    if (isEmbedded) {
      document.body.classList.add('is-embedded-in-kiosk');
      const closeBtn = document.getElementById('btn-header-close-kiosk');
      if (closeBtn) closeBtn.classList.remove('hidden');
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'MAP_READY',
        version: typeof APP_CACHE_VERSION !== 'undefined' ? APP_CACHE_VERSION : 'v3.6.0'
      }, '*');
    }
  });
})();

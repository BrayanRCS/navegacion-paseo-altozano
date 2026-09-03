/**
 * Paseo Altozano · Animation Engine (Powered by Anime.js)
 */

const NavAnimator = {
  activeCameraAnim: null,
  activeArrowAnim: null,
  arrowState: { x: 0, y: 0, angle: 0 },

  // 1. Smooth Fade-in Reveal Animation on SVG Dotted Route Paths
  animateRoutePath: function() {
    const pathEl = document.getElementById('svg-active-route');
    const waterBedEl = document.getElementById('svg-water-bed');
    if (!pathEl || typeof anime === 'undefined') return;

    anime.remove([pathEl, waterBedEl]);
    
    pathEl.style.opacity = '0';
    if (waterBedEl) waterBedEl.style.opacity = '0';

    anime({
      targets: [pathEl, waterBedEl].filter(Boolean),
      opacity: [0, 1],
      duration: 380,
      easing: 'easeOutQuad'
    });
  },

  // 2. Destination Target Pin Stable Appearance
  popInDestinationPin: function() {
    const destPin = document.getElementById('svg-dest-pin');
    if (!destPin || typeof anime === 'undefined') return;
    anime.remove(destPin);
    anime({
      targets: destPin,
      scale: [0.88, 1],
      opacity: [0.7, 1],
      duration: 220,
      easing: 'easeOutQuad'
    });
  },

  // 3. Smooth Navigation Arrow Motion & Tangent Rotation
  animateArrowTo: function(targetX, targetY, targetAngle, duration = 600, easing = 'easeInOutSine', onComplete) {
    const arrow = document.getElementById('svg-nav-arrow-cursor');
    if (!arrow || typeof anime === 'undefined') return;

    if (this.activeArrowAnim) this.activeArrowAnim.pause();

    // Calculate shortest rotation path to avoid 360 wrap-arounds
    let diffAngle = (targetAngle - (this.arrowState.angle % 360));
    while (diffAngle < -180) diffAngle += 360;
    while (diffAngle > 180) diffAngle -= 360;
    const finalAngle = this.arrowState.angle + diffAngle;

    const state = this.arrowState;
    this.activeArrowAnim = anime({
      targets: state,
      x: targetX,
      y: targetY,
      angle: finalAngle,
      duration: duration,
      easing: easing,
      update: function() {
        arrow.setAttribute('transform', `translate(${state.x.toFixed(2)}, ${state.y.toFixed(2)}) rotate(${state.angle.toFixed(2)})`);
      },
      complete: function() {
        state.angle = finalAngle % 360;
        if (onComplete) onComplete();
      }
    });
  },

  // Instant arrow position (without animation)
  setArrowInstant: function(x, y, angle) {
    const arrow = document.getElementById('svg-nav-arrow-cursor');
    if (!arrow) return;
    if (this.activeArrowAnim) this.activeArrowAnim.pause();
    this.arrowState.x = x;
    this.arrowState.y = y;
    this.arrowState.angle = angle;
    arrow.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
  },

  // 4. Smooth Camera Zoom & Pan with Rotation (Hardware-Accelerated via translate3d)
  animateCameraTo: function(targetPanX, targetPanY, targetScale, duration = 500, targetRotation = null, easing = 'easeInOutSine') {
    const stage = document.getElementById('map-camera-stage');
    if (!stage || typeof anime === 'undefined') {
      if (stage) {
        if (targetRotation !== null) currentCamera.rotation = targetRotation;
        updateCameraTransform();
        updateCompassUI();
      }
      return;
    }

    if (this.activeCameraAnim) this.activeCameraAnim.pause();

    const animConfig = {
      targets: currentCamera,
      panX: targetPanX,
      panY: targetPanY,
      scale: targetScale,
      duration: duration,
      easing: easing,
      update: function() {
        const rot = currentCamera.rotation || 0;
        stage.style.transform = `translate3d(${currentCamera.panX.toFixed(2)}px, ${currentCamera.panY.toFixed(2)}px, 0) scale(${currentCamera.scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
        updatePopupPosition();
        updateCompassUI();
      },
      complete: function() {
        currentCamera.isZoomed = currentCamera.scale > 1.1;
        updateZoomButtonUI();
        updateCompassUI();
      }
    };

    if (targetRotation !== null) {
      animConfig.rotation = targetRotation;
    }

    this.activeCameraAnim = anime(animConfig);
  },

  // 5. Totem UI Micro-interactions
  animateTotemStep: function() {
    if (typeof anime === 'undefined') return;

    anime({
      targets: '#step-icon-container',
      scale: [0.85, 1],
      rotate: ['-12deg', '0deg'],
      duration: 380,
      easing: 'easeOutBack'
    });

    anime({
      targets: ['#step-instruction-main', '#step-instruction-context'],
      translateX: [10, 0],
      opacity: [0, 1],
      delay: anime.stagger(45),
      duration: 320,
      easing: 'easeOutQuad'
    });
  },

  // Place / Landmark Card Elastic Pulse
  animatePlaceCard: function(isDestination = false) {
    if (typeof anime === 'undefined') return;
    anime({
      targets: '#place-icon-box',
      scale: isDestination ? [0.8, 1.25, 1] : [0.88, 1.1, 1],
      duration: 520,
      easing: 'easeOutElastic(1, .6)'
    });
  },

  // Staggered Cascades (Directory, Step Cards, Segments)
  staggerLegend: function() {
    const el = document.getElementById('legend-items-container');
    if (!el || typeof anime === 'undefined') return;
    anime({
      targets: '#legend-items-container > div:nth-child(-n+18)',
      opacity: [0, 1],
      translateY: [8, 0],
      delay: anime.stagger(10, { start: 10 }),
      duration: 220,
      easing: 'easeOutQuad'
    });
  },

  staggerSteps: function() {
    const el = document.getElementById('route-steps-grid');
    if (!el || typeof anime === 'undefined') return;
    anime({
      targets: '#route-steps-grid > div',
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(30),
      duration: 260,
      easing: 'easeOutQuad'
    });
  },

  staggerSegments: function() {
    if (typeof anime === 'undefined') return;
    anime({
      targets: '#segments-container > button',
      scale: [0.9, 1],
      opacity: [0, 1],
      delay: anime.stagger(40),
      duration: 280,
      easing: 'easeOutBack'
    });
  }
};

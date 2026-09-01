/**
 * Paseo Altozano · Central State Management
 */

const AltozanoState = {
  // Graph & Legends data
  mallGraph: null,
  mallLegends: null,
  levelGraphs: { 1: {}, 2: {}, 3: {} },
  levelNodes: { 1: {}, 2: {}, 3: {} },

  // Navigation & Routing state
  currentLevel: 2,
  currentView: 'directory', // 'directory' | 'map'
  isVerticalMode: true,
  showStoresAndRestaurants: true,
  currentCategoryFilter: 'all',
  
  routeSegments: [],
  currentSteps: [],
  currentStepIndex: 0,
  selectedPopupNode: null,

  // Camera state
  camera: {
    scale: 1.0,
    panX: 0,
    panY: 0,
    rotation: -90, // -90 for vertical mode default
    isZoomed: false
  },
  isFollowingGPS: true,
  cachedViewport: null,

  // Walkthrough simulation state
  simulation: {
    isRunning: false,
    interval: null,
    segIndex: 0,
    nodeIndex: 0,
    isTransitioningFloor: false
  },

  // Interactive Visual Editor (Drag & Drop Logo Placement)
  isEditorMode: false,
  customLogoPositions: {},
  selectedEditorNodeId: null
};

// Global backward compatibility references
let mallGraph = AltozanoState.mallGraph;
let mallLegends = AltozanoState.mallLegends;
let currentLevel = AltozanoState.currentLevel;
let levelGraphs = AltozanoState.levelGraphs;
let levelNodes = AltozanoState.levelNodes;
let routeSegments = AltozanoState.routeSegments;
let currentSteps = AltozanoState.currentSteps;
let currentStepIndex = AltozanoState.currentStepIndex;
let currentCamera = AltozanoState.camera;
let isVerticalMode = AltozanoState.isVerticalMode;
let showStoresAndRestaurants = AltozanoState.showStoresAndRestaurants;
let isSimulating = AltozanoState.simulation.isRunning;
let simInterval = AltozanoState.simulation.interval;
let simSegIndex = AltozanoState.simulation.segIndex;
let simNodeIndex = AltozanoState.simulation.nodeIndex;
let isTransitioningFloor = AltozanoState.simulation.isTransitioningFloor;
let selectedPopupNode = AltozanoState.selectedPopupNode;
let currentCategoryFilter = AltozanoState.currentCategoryFilter;
let cachedViewport = AltozanoState.cachedViewport;
let isFollowingGPS = AltozanoState.isFollowingGPS;
let currentKioskView = AltozanoState.currentView;
let isEditorMode = AltozanoState.isEditorMode;
let customLogoPositions = AltozanoState.customLogoPositions;
let selectedEditorNodeId = AltozanoState.selectedEditorNodeId;

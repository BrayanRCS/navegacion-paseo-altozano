/**
 * Paseo Altozano · Configuration & Constants Module
 */

const APP_CACHE_VERSION = 'v2.0.0';
const TOTEM_NODE_ID = 'n_totem_12';
const LOCAL_NETWORK_IP = '192.168.1.121';
const WALK_STEP_DURATION = 550;
const NAVIGATION_ZOOM_LEVEL = 1.85;

const FLOOR_SPECS = {
  1: {
    name: "Planta Baja · Nivel Inferior",
    img: "planta-baja-dark.png",
    count: "28 locales · 3 islas",
    width: 1536,
    height: 727,
    legendKey: "nivel_inferior"
  },
  2: {
    name: "Planta 1 · Nivel Principal (Ubicación del Tótem 📍)",
    img: "planta-uno-dark.png",
    count: "63 locales · 12 islas · 1 Tótem",
    width: 1536,
    height: 718,
    legendKey: "nivel_principal"
  },
  3: {
    name: "Planta 2 · Nivel Superior",
    img: "planta-dos-dark.png",
    count: "28 locales · Restaurantes / Cines",
    width: 1536,
    height: 669,
    legendKey: "nivel_superior"
  }
};

// Explicit vertical portals linking floors (Escalators & Elevators)
const PORTALS = [
  { id: "p_liverpool_esc", type: "escalator", name: "Escaleras Eléctricas Plaza Liverpool", 1: "n_lvl1_portal_esc_liverpool", 2: "n_lvl2_portal_esc_liverpool" },
  { id: "p_liverpool_elev", type: "elevator", name: "Elevador Plaza Liverpool", 1: "n_lvl1_portal_elev_liverpool", 2: "n_lvl2_portal_elev_liverpool" },
  { id: "p_central_esc", type: "escalator", name: "Escaleras Eléctricas Rotonda Central", 1: "n_lvl1_portal_esc_central", 2: "n_lvl2_portal_esc_rotunda_left" },
  { id: "p_oval_sanborns_esc", type: "escalator", name: "Escaleras Eléctricas Plaza Oval / Sanborns", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_sanborns" },
  { id: "p_sears_cinelia_esc", type: "escalator", name: "Escaleras Eléctricas Sears / Cinelia", 2: "n_lvl2_portal_esc_sears", 3: "n_lvl3_portal_esc_cinelia" },
  { id: "p_chedraui_cinelia_elev", type: "elevator", name: "Elevador Chedraui / Cinelia", 2: "n_lvl2_portal_elev_chedraui", 3: "n_lvl3_portal_elev_cinelia" },
  { id: "p_rotunda_top_esc", type: "escalator", name: "Escaleras Eléctricas Rotonda Norte", 2: "n_lvl2_portal_esc_rotunda_right", 3: "n_lvl3_portal_esc_central_top" },
  { id: "p_rotunda_bot_esc", type: "escalator", name: "Escaleras Eléctricas Rotonda Sur", 2: "n_lvl2_portal_esc_rotunda_bot", 3: "n_lvl3_portal_esc_central_bot" },
  { id: "p_sanborns_terrace_esc", type: "escalator", name: "Escaleras Eléctricas Terraza", 2: "n_lvl2_portal_esc_sanborns", 3: "n_lvl3_portal_esc_terrace" },
  { id: "p_auto_anytime_esc", type: "escalator", name: "Escaleras Eléctricas Autos / Anytime", 2: "n_lvl2_portal_esc_automotive", 3: "n_lvl3_portal_esc_anytime" }
];

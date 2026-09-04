/**
 * Paseo Altozano · Configuration & Constants Module
 */

const APP_CACHE_VERSION = 'v3.4.0';
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

// Explicit vertical portals linking floors (Escalators & Elevators strictly respecting PB, N1, N2)
const PORTALS = [
  // --- CONEXIONES PLANTA BAJA (PB) ↔ NIVEL 1 (N1) ---
  { id: "p_liverpool_esc_pb_n1", type: "escalator", name: "Escaleras Eléctricas Plaza Liverpool (PB ↔ N1)", 1: "n_lvl1_portal_esc_liverpool", 2: "n_lvl2_portal_esc_liverpool" },
  { id: "p_liverpool_elev_pb_n1", type: "elevator", name: "Elevador Plaza Liverpool (PB ↔ N1)", 1: "n_lvl1_portal_elev_liverpool", 2: "n_lvl2_portal_elev_liverpool" },
  { id: "p_oval_rotunda_esc_pb_n1", type: "escalator", name: "Escaleras Eléctricas Plaza Oval (PB ↔ N1)", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_rotunda_right" },
  { id: "p_oval_sanborns_esc_pb_n1", type: "escalator", name: "Escaleras Eléctricas Sanborns (PB ↔ N1)", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_sanborns" },
  { id: "p_central_esc_pb_n1", type: "escalator", name: "Escaleras Eléctricas Rotonda Izquierda (PB ↔ N1)", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_rotunda_left" },
  { id: "p_central_elev_pb_n1", type: "elevator", name: "Elevador Central (PB ↔ N1)", 1: "n_lvl1_portal_elev_central", 2: "n_lvl2_portal_elev_chedraui" },

  // --- CONEXIONES NIVEL 1 (N1) ↔ NIVEL 2 (N2 / TERRAZA) ---
  { id: "p_chedraui_terrace_esc_n1_n2", type: "escalator", name: "Escaleras Eléctricas Chedraui / Terraza (N1 ↔ N2)", 2: "n_lvl2_portal_esc_chedraui_front", 3: "n_lvl3_portal_esc_terrace" },
  { id: "p_rotunda_bot_esc_n1_n2", type: "escalator", name: "Escaleras Eléctricas Rotonda Sur (N1 ↔ N2)", 2: "n_lvl2_portal_esc_rotunda_bot", 3: "n_lvl3_portal_esc_central_bot" },
  { id: "p_rotunda_top_esc_n1_n2", type: "escalator", name: "Escaleras Eléctricas Rotonda Norte (N1 ↔ N2)", 2: "n_lvl2_portal_esc_rotunda_bot", 3: "n_lvl3_portal_esc_central_top" },
  { id: "p_sears_cinelia_esc_n1_n2", type: "escalator", name: "Escaleras Eléctricas Sears / Cinelia (N1 ↔ N2)", 2: "n_lvl2_portal_esc_sears", 3: "n_lvl3_portal_esc_cinelia" },
  { id: "p_auto_anytime_esc_n1_n2", type: "escalator", name: "Escaleras Eléctricas Autos / Anytime (N1 ↔ N2)", 2: "n_lvl2_portal_esc_automotive", 3: "n_lvl3_portal_esc_anytime" },
  { id: "p_chedraui_cinelia_elev_n1_n2", type: "elevator", name: "Elevador Chedraui / Cinelia (N1 ↔ N2)", 2: "n_lvl2_portal_elev_chedraui", 3: "n_lvl3_portal_elev_cinelia" },
  { id: "p_chedraui_terrace_elev_n1_n2", type: "elevator", name: "Elevador Chedraui / Terraza (N1 ↔ N2)", 2: "n_lvl2_portal_elev_chedraui", 3: "n_lvl3_portal_elev_mtkzl8ol" },
  { id: "p_sears_plaza_elev_n1_n2", type: "elevator", name: "Elevador Plaza Sears / Trampoline (N1 ↔ N2)", 2: "n_lvl2_portal_elev_sears_plaza", 3: "n_lvl3_portal_elev_mtkzlf42" }
];

// Extensible & Dynamic Category System with High-Impact Visuals
const DIRECTORY_CATEGORIES = [
  {
    id: "all",
    name: "Todos los Locales",
    shortName: "Todos",
    icon: "fa-store",
    emoji: "🏷️",
    gradient: "from-blue-600 via-indigo-600 to-sky-500",
    glowColor: "rgba(56, 189, 248, 0.35)",
    borderActive: "border-sky-400",
    desc: "Explora todo el centro comercial"
  },
  {
    id: "food",
    name: "Comida & Restaurantes",
    shortName: "Restaurantes",
    icon: "fa-utensils",
    emoji: "🍔",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    glowColor: "rgba(245, 158, 11, 0.35)",
    borderActive: "border-amber-400",
    desc: "Restaurantes, tacos, pizzas y comida rápida",
    keywords: ["restauran", "bistrot", "burger", "carl", "domino", "pizza", "wing", "infierno", "taco", "chilim", "fisher", "unagi", "jana", "mammut", "jimenez", "jiménez", "food", "sushi", "mar y pasta", "alitas", "gourmet", "steak", "parrilla", "italian", "bar", "cafeteria", "comida", "grill"]
  },
  {
    id: "coffee",
    name: "Cafés, Helados & Postres",
    shortName: "Cafés & Postres",
    icon: "fa-mug-hot",
    emoji: "☕",
    gradient: "from-emerald-500 via-teal-600 to-green-700",
    glowColor: "rgba(16, 185, 129, 0.35)",
    borderActive: "border-emerald-400",
    desc: "Starbucks, heladerías, crepas y repostería",
    keywords: ["starbucks", "cafe", "café", "coffee", "moyo", "nutrisa", "helad", "ice", "crepe", "chocolat", "de regil", "jalisco", "raspados", "dulce", "churros", "postre", "panadería", "bakery", "tea", "bubble", "europa"]
  },
  {
    id: "fashion",
    name: "Moda, Ropa & Calzado",
    shortName: "Moda & Calzado",
    icon: "fa-shirt",
    emoji: "👗",
    gradient: "from-pink-500 via-rose-600 to-fuchsia-600",
    glowColor: "rgba(244, 63, 94, 0.35)",
    borderActive: "border-rose-400",
    desc: "Ropa de moda, calzado, boutiques y accesorios",
    keywords: ["sfera", "zara", "h&m", "c&a", "gap", "studio f", "guess", "american eagle", "tommy", "springfield", "women", "flexi", "adidas", "salomon", "sport", "dpstreet", "dportenis", "moda", "shoes", "boutique", "pandora", "bizzarro", "adolfo", "cui", "sunglass", "fame", "cuadra", "levi", "dockers", "joyeria", "reloj", "coven", "5.11"]
  },
  {
    id: "anchor",
    name: "Tiendas Departamentales",
    shortName: "Tiendas Ancla",
    icon: "fa-bag-shopping",
    emoji: "🛍️",
    gradient: "from-purple-600 via-violet-600 to-indigo-700",
    glowColor: "rgba(168, 85, 247, 0.35)",
    borderActive: "border-purple-400",
    desc: "Liverpool, Sears, Chedraui Selecto y Sanborns",
    keywords: ["liverpool", "sears", "chedraui", "sanborns", "ancla", "selecto", "departamental", "almacen"]
  },
  {
    id: "beauty",
    name: "Salud, Belleza & Ópticas",
    shortName: "Belleza & Salud",
    icon: "fa-wand-magic-sparkles",
    emoji: "✨",
    gradient: "from-rose-500 via-pink-600 to-purple-600",
    glowColor: "rgba(236, 72, 153, 0.35)",
    borderActive: "border-pink-400",
    desc: "Cosméticos, cuidado de la piel, ópticas y fitness",
    keywords: ["natura", "bath & body", "obey your body", "ben & frank", "optica", "óptica", "axen", "anytime fitness", "spa", "barber", "salon", "uñas", "piel", "salud", "gym", "farmacia", "belleza", "perfume", "beau"]
  },
  {
    id: "tech",
    name: "Cine & Entretenimiento",
    shortName: "Entretenimiento",
    icon: "fa-film",
    emoji: "🎬",
    gradient: "from-cyan-500 via-blue-600 to-indigo-600",
    glowColor: "rgba(6, 182, 212, 0.35)",
    borderActive: "border-cyan-400",
    desc: "Cinelia, telefonía, videojuegos e islas infantiles",
    keywords: ["cine", "cinelia", "cinépolis", "at&t", "telcel", "movistar", "game", "jurassic", "funki", "jump", "trampoline", "entretenimiento", "tecnologia", "celulares", "carcasa", "byd", "autos", "diversion", "casino", "crown", "porrúa", "libro"]
  },
  {
    id: "portal",
    name: "Escaleras, Elevadores & Baños",
    shortName: "Accesos & Servicios",
    icon: "fa-stairs",
    emoji: "🪜",
    gradient: "from-slate-600 via-slate-700 to-zinc-800",
    glowColor: "rgba(148, 163, 184, 0.25)",
    borderActive: "border-slate-300",
    desc: "Conexiones entre niveles, elevadores y sanitarios",
    keywords: ["escalera", "elevador", "baño", "sanitario", "restroom", "estacionamiento", "parking", "admin", "portal", "acceso", "kiosko", "modulo"]
  }
];

function matchNodeCategory(node) {
  if (!node) return "all";
  const type = (node.type || "").toLowerCase();
  const name = (node.name || node.context_element || "").toLowerCase();

  if (type === "portal_escalator" || type === "portal_elevator" || type === "restroom" || type === "parking" || type === "admin" || name.includes("escalera") || name.includes("elevador") || name.includes("baño") || name.includes("sanitario")) {
    return "portal";
  }
  if (type === "anchor_store" || name.includes("liverpool") || name.includes("sears") || name.includes("chedraui") || name.includes("sanborns")) {
    return "anchor";
  }

  for (let i = 1; i < DIRECTORY_CATEGORIES.length; i++) {
    const cat = DIRECTORY_CATEGORIES[i];
    if (cat.keywords) {
      for (const kw of cat.keywords) {
        if (name.includes(kw) || type.includes(kw)) {
          return cat.id;
        }
      }
    }
  }

  return "fashion"; // Default graceful fallback
}


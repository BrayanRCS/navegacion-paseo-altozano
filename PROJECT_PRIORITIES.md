# 🚨 PRIORIDAD NÚMERO 1 — HANDOFF DE SESIÓN Y HOJA DE RUTA

> [!IMPORTANT]
> **INSTRUCCIÓN PARA EL AGENTE AL INICIAR NUEVA SESIÓN:**
> Este proyecto tiene **máxima prioridad y tiempo crítico**, ya que debe montarse e integrarse dentro de un sistema existente para **Paseo Altozano**.
> Lee este documento inmediatamente al retomar la sesión para ejecutar las prioridades directas sin perder tiempo en re-contextualización.

---

## 📌 1. Estado Actual y Producción
* **URL Producción Vercel:** [https://navegacion-paseo-altozano.vercel.app](https://navegacion-paseo-altozano.vercel.app)
* **Repositorio GitHub:** [https://github.com/BrayanRCS/navegacion-paseo-altozano](https://github.com/BrayanRCS/navegacion-paseo-altozano)
* **Archivos Clave:**
  * `index.html` (Aplicativo unificado: Vista Tótem Vertical + Vista Smartphone QR descentralizada).
  * `mall_graph.json` (Grafo de 3 pisos, nodos, pasillos y portales de conexión vertical).
  * `gemini-code-1787086839436.json` (Directorio y leyendas de tiendas por nivel).
  * `DIRECTORIO_TIENDAS_PASEO_ALTOZANO.md` (Lista completa de 125+ tiendas con plantilla de solicitud).
  * `assets/logos/` (Directorio creado y listo para recibir los assets de logotipos SVG / PNG).

---

## 🎯 2. PRIORIDADES DIRECTAS AL RETOMAR LA SESIÓN

### 🥇 Prioridad #1: Ingesta y Renderizado Automático de Logos
1. **Carga de Assets:**
   * Colocar los archivos de logotipos recolectados en `assets/logos/<slug-tienda>.svg` (o `.png`).
2. **Propiedad `logo` en el Grafo:**
   * Vincular en `mall_graph.json` la ruta del logo y opcionalmente el color de marca (`brand_color`) en cada nodo.
3. **Renderizado en las 3 Vistas Clave:**
   * **Sobre el Mapa SVG:** Badges vectoriales `<image>` o píldoras con logo oficial en las coordenadas `(x, y)` de cada tienda.
   * **En el Directorio Global:** Miniaturas oficiales (32x32px) junto a cada nombre de local.
   * **En la Guía GPS Paso a Paso:** Banner y tarjeta de destino con el imagotipo oficial en alta resolución.

### 🥈 Prioridad #2: Preparación para Montaje e Integración en Sistema Existente
1. **Modularidad e Incrustación:**
   * El sistema debe poder funcionar como módulo independiente (Iframe, Web Component o script bundle) para montarse dentro del backend/frontend del sistema padre sin conflictos de estilos o scripts globales.
2. **Parámetros de Entrada Flexibles:**
   * Soporte completo de Deep Linking vía URL Query Params (`?origin=...&dest=...&mode=mobile`) para invocar rutas desde el sistema anfitrión o tótems externos.

---

## 📐 3. Comportamientos Técnicos Blindados (NO ROMPER)

1. **🖥️ Vista Tótem (Pantalla Kiosco):**
   * **100% Estática:** La rotación de cámara está fija en `0°` (Norte Arriba). El mapa **NUNCA gira**.
   * **Directorio Global:** Agrupa toda la plaza como una sola entidad (sin botones de filtro por piso para el usuario).
   * **Nodos Ocultos en Play:** Al dar Play se ocultan los nodos del grafo para una vista limpia, pero si el usuario presiona *"Mostrar Nodos"* o *"Ver Todo"*, el sistema respeta la decisión del usuario.

2. **📱 Vista Smartphone (Móvil QR):**
   * **Heading-Up Dinámico:** El mapa rota suavemente para que la flecha GPS apunte siempre **verticalmente hacia arriba** en la pantalla del usuario.
   * **Giros Suaves (1.65s):** Transiciones con curva `easeInOutSine` sin sacudidas bruscas.
   * **Zoom Inmersivo (2.95x):** Encuadre cercano al pasillo con encuadre centrado al 50% (`targetScreenY = ch / 2`) para que la flecha nunca se oculte detrás de tarjetas o bordes.
   * **Gestos Táctiles:** Soporte de rotación con 2 dedos (Pinch-to-Rotate) y botón de brújula para restablecer el Norte.

3. **📍 Estabilidad del Pin de Destino:**
   * Al avanzar de paso ("Paso siguiente"), `renderMapOverlay(false)` mantiene el pin de destino y trazado completamente estáticos, sin animaciones elásticas o rebotes parásitos.

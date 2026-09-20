"""Vectoriza un plano de leasing (PNG plano) a un SVG por niveles: footprint, locales ocupados, locales disponibles.

Uso: python tools/build_level_svg.py <plano.png> <salida.svg> <legend_x> <legend_y> [nivel_grafo] [preview.png]
  legend_x / legend_y: fraccion del ancho/alto que ocupa la leyenda (se descarta).
  nivel_grafo: 1, 2 o 3 (para superponer nodos/aristas de mall_graph.json en el preview).
El SVG sale en el lienzo de referencia de 1536 px de ancho, el mismo del grafo.
"""
import sys, json
import cv2
import numpy as np

REF_W = 1536
WORK_W = 4000
OCC = (223, 106, 46)
AVAIL = (255, 137, 85)
TOL = 22
HOLE_MIN = 9000  # huecos menores (arboles, esculturas, iconos) se rellenan; las plazas y vacios reales se conservan


def load(path):
    a = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if a.shape[2] == 4:
        alpha = a[..., 3]
        rgb = a[..., :3][..., ::-1].copy()
        rgb[alpha < 128] = 255
    else:
        rgb = a[..., ::-1].copy()
    h, w = rgb.shape[:2]
    if w != WORK_W:
        rgb = cv2.resize(rgb, (WORK_W, round(h * WORK_W / w)), interpolation=cv2.INTER_AREA)
    return rgb


def near(rgb, color):
    d = np.abs(rgb.astype(int) - np.array(color)).max(axis=2)
    return (d <= TOL).astype(np.uint8) * 255


def fill_holes(mask):
    cnts, hier = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = np.zeros_like(mask)
    cv2.drawContours(out, cnts, -1, 255, -1)
    return out


def polys(mask, scale, min_area, eps, min_hole=0):
    cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    if hier is None:
        return out
    for i, c in enumerate(cnts):
        is_hole = hier[0][i][3] != -1
        if cv2.contourArea(c) < (min_hole if is_hole else min_area):
            continue
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2) * scale
        out.append((ap, is_hole))
    return out


def path_d(items):
    parts = []
    for pts, _ in items:
        parts.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
    return " ".join(parts)


def main():
    src, dst, lx, ly = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
    lvl = int(sys.argv[5]) if len(sys.argv) > 5 else None
    prev = sys.argv[6] if len(sys.argv) > 6 else None
    rgb = load(src)
    h, w = rgb.shape[:2]
    scale = REF_W / w
    H = round(h * scale)

    rgb[: int(h * ly), : int(w * lx)] = 255  # leyenda fuera

    white = (rgb.min(axis=2) >= 240).astype(np.uint8) * 255
    ell = cv2.getStructuringElement
    # Vacios reales (exterior, plazas, atrios): blanco que aguanta una apertura enorme.
    # Las lineas de contorno y los discos de numero (<45 px) no sobreviven, asi que no crean huecos.
    voids = cv2.morphologyEx(white, cv2.MORPH_OPEN, ell(cv2.MORPH_ELLIPSE, (61, 61)))
    nonwhite = cv2.bitwise_not(voids)
    thin = white & ~cv2.morphologyEx(white, cv2.MORPH_OPEN, ell(cv2.MORPH_ELLIPSE, (9, 9)))  # lineas divisorias

    occ0 = near(rgb, OCC)
    av0 = near(rgb, AVAIL)
    # Discos de numero de local: blanco que no es vacio grande ni linea fina. Los digitos oscuros
    # parten el disco, asi que se cierra primero y se abre despues para quitar las lineas divisorias.
    small = white & ~cv2.dilate(voids, np.ones((5, 5), np.uint8))
    solid = cv2.morphologyEx(small, cv2.MORPH_CLOSE, ell(cv2.MORPH_ELLIPSE, (15, 15)))
    cand = cv2.morphologyEx(solid, cv2.MORPH_OPEN, ell(cv2.MORPH_ELLIPSE, (17, 17)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand)
    discs = np.zeros_like(cand)
    for i in range(1, n):  # solo componentes con tamano de disco; los bloques grandes son redes de lineas, no numeros
        if st[i][4] <= 3200 and max(st[i][2], st[i][3]) <= 100:
            discs[lab == i] = 255
    discs = cv2.dilate(discs, np.ones((5, 5), np.uint8))
    # El cierre solo actua bajo los discos: rellena la muesca que dejan en el borde del local,
    # sin fusionar locales vecinos ni tapar pasillos.
    k = ell(cv2.MORPH_ELLIPSE, (45, 45))
    occ = (occ0 | (cv2.morphologyEx(occ0, cv2.MORPH_CLOSE, k) & discs & ~thin)) & ~av0
    avail = (av0 | (cv2.morphologyEx(av0, cv2.MORPH_CLOSE, k) & discs & ~thin)) & ~occ
    occ, avail = fill_holes(occ), fill_holes(avail)
    avail = cv2.bitwise_and(avail, cv2.bitwise_not(occ))

    foot = polys(nonwhite, scale, 4000, 3.0, HOLE_MIN)
    occ_p = polys(occ, scale, 1200, 2.0, HOLE_MIN)
    av_p = polys(avail, scale, 1200, 2.0, HOLE_MIN)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {REF_W} {H}" width="{REF_W}" height="{H}">
<style>
.mp-foot{{fill:#182a42}}
.mp-unit{{fill:#263e5c;stroke:#426c96;stroke-width:1.1;stroke-linejoin:round}}
.mp-avail{{fill:#203248;stroke:#345070}}
</style>
<path id="footprint" class="mp-foot" fill-rule="evenodd" d="{path_d(foot)}"/>
<path id="units-occupied" class="mp-unit" fill-rule="evenodd" d="{path_d(occ_p)}"/>
<path id="units-available" class="mp-unit mp-avail" fill-rule="evenodd" d="{path_d(av_p)}"/>
</svg>'''
    open(dst, "w", encoding="utf-8").write(svg)
    print(f"{dst}: {REF_W}x{H}  footprint={len(foot)} ocupados={len(occ_p)} disponibles={len(av_p)}  {len(svg)/1024:.0f} KB")

    if prev:
        k = 2
        pw, ph = REF_W * k, H * k
        img = np.full((ph, pw, 3), (32, 20, 11), np.uint8)  # BGR de #0b1420

        def draw(items, fill, edge):
            m = np.zeros((ph, pw), np.uint8)
            for pts, hole in items:
                p = (pts * k).astype(np.int32)
                cv2.fillPoly(m, [p], 0 if hole else 255)
            img[m > 0] = fill
            cs, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(img, cs, -1, edge, 2)

        draw(foot, (66, 42, 24), (66, 42, 24))
        draw(occ_p, (92, 62, 38), (150, 108, 66))
        draw(av_p, (72, 50, 32), (110, 80, 52))
        if lvl:
            g = json.load(open("mall_graph.json", encoding="utf-8"))
            nodes = {n["id"]: n for n in g["nodes"] if n["level"] == lvl}
            for e in g["edges"]:
                a, b = nodes.get(e["from"]), nodes.get(e["to"])
                if a and b:
                    cv2.line(img, (int(a["coordinates"]["x"] * k), int(a["coordinates"]["y"] * k)),
                             (int(b["coordinates"]["x"] * k), int(b["coordinates"]["y"] * k)), (255, 230, 120), 1)
            for n in nodes.values():
                cv2.circle(img, (int(n["coordinates"]["x"] * k), int(n["coordinates"]["y"] * k)), 3,
                           (80, 200, 255) if n["type"] != "corridor_waypoint" else (255, 255, 255), -1)
        cv2.imencode(".png", img)[1].tofile(prev)


main()

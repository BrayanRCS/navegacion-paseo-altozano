"""Genera js/store_categories.js: categoria real de cada nodo del grafo, tomada de tenants.json del kiosco.

Uso: python tools/build_store_categories.py <ruta/a/tenants.json>
El grafo (mall_graph.json) no se toca; la relacion es por localId / entranceNodeId.
"""
import json, sys, io

src = sys.argv[1]
tenants = json.load(open(src, encoding="utf-8"))
graph = json.load(open("mall_graph.json", encoding="utf-8"))
ids = {n["id"] for n in graph["nodes"]}

out = {}
for t in tenants:
    for k in (t.get("localId"), t.get("entranceNodeId")):
        if k in ids and t.get("categoriaId") and t.get("estatus", "activo") != "baja":
            out.setdefault(k, t["categoriaId"])

body = json.dumps(dict(sorted(out.items())), ensure_ascii=False, indent=1)
open("js/store_categories.js", "w", encoding="utf-8").write(
    "/* Generado por tools/build_store_categories.py desde tenants.json. No editar a mano. */\n"
    f"const STORE_CATEGORY_BY_NODE = {body};\n"
)
print(f"{len(out)} nodos con categoria")

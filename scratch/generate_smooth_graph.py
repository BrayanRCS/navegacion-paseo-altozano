import json
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))

# Separate existing non-corridor nodes (stores, islands, portals, totem, restrooms, services)
non_corridor_nodes = [
    n for n in data['nodes'] 
    if not (n['id'].startswith('n_lvl1_c_') or n['id'].startswith('n_lvl2_c_') or n['id'].startswith('n_lvl3_c_') or '_corridor_' in n['id'])
]

print(f"Preserving {len(non_corridor_nodes)} stores/islands/portals/totem nodes.")

# High density curved corridor nodes
corridors_lvl1 = [
    {"id": "n_lvl1_c_01", "name": "Pasillo Liverpool", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 480, "y": 500}, "context_element": "Liverpool PB"},
    {"id": "n_lvl1_c_02", "name": "Pasillo Plaza Liverpool", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 520, "y": 480}, "context_element": "Women'secret"},
    {"id": "n_lvl1_c_03", "name": "Acceso Escaleras Liverpool", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 562, "y": 460}, "context_element": "Escaleras Liverpool"},
    {"id": "n_lvl1_c_04", "name": "Pasillo DpStreet / Guess", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 610, "y": 430}, "context_element": "Guess"},
    {"id": "n_lvl1_c_05", "name": "Pasillo Central Poniente", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 660, "y": 400}, "context_element": "Studio F"},
    {"id": "n_lvl1_c_06", "name": "Pasillo Central", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 710, "y": 370}, "context_element": "American Eagle"},
    {"id": "n_lvl1_c_07", "name": "Cruce Fuente Central", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 760, "y": 340}, "context_element": "Fuente Central"},
    {"id": "n_lvl1_c_08", "name": "Pasillo Plaza Oval", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 810, "y": 320}, "context_element": "H&M PB"},
    {"id": "n_lvl1_c_09", "name": "Pasillo Porrúa / Adolfo Domínguez", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 860, "y": 280}, "context_element": "Librería Porrúa"},
    {"id": "n_lvl1_c_10", "name": "Acceso Fiesta Inn", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 880, "y": 220}, "context_element": "Hotel Fiesta Inn"},
    {"id": "n_lvl1_c_11", "name": "Pasillo Banamex / MacStore", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 930, "y": 180}, "context_element": "MacStore"},
    {"id": "n_lvl1_c_12", "name": "Pasillo Crown City Casino", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 990, "y": 150}, "context_element": "Casino Crown City"},
    {"id": "n_lvl1_c_13", "name": "Pasillo Automotriz Honda / Geely", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 1050, "y": 130}, "context_element": "Honda / Geely"}
]

corridors_lvl2 = [
    # Liverpool Wing (West)
    {"id": "n_lvl2_c_01", "name": "Pasillo Acceso Liverpool", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 300, "y": 510}, "context_element": "Liverpool"},
    {"id": "n_lvl2_c_02", "name": "Pasillo Plaza Liverpool", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 360, "y": 490}, "context_element": "Escaleras Liverpool"},
    {"id": "n_lvl2_c_03", "name": "Pasillo GAP / Aeropostale", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 430, "y": 440}, "context_element": "Aeropostale"},
    {"id": "n_lvl2_c_04", "name": "Pasillo Steren / Innovasport", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 490, "y": 410}, "context_element": "Innovasport"},
    {"id": "n_lvl2_c_05", "name": "Pasillo Acceso Rotonda Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 550, "y": 370}, "context_element": "L'Occitane"},
    
    # Rotonda Ring
    {"id": "n_lvl2_c_06", "name": "Rotonda Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 590, "y": 340}, "context_element": "Rotonda Poniente"},
    {"id": "n_lvl2_c_07", "name": "Rotonda Norponiente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 610, "y": 280}, "context_element": "Miniso"},
    {"id": "n_lvl2_c_08", "name": "Rotonda Norte", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 660, "y": 260}, "context_element": "Zanati"},
    {"id": "n_lvl2_c_09", "name": "Rotonda Nororiente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 710, "y": 290}, "context_element": "Dportenis"},
    {"id": "n_lvl2_c_10", "name": "Rotonda Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 650, "y": 370}, "context_element": "Starbucks Coffee"},
    {"id": "n_lvl2_c_11", "name": "Rotonda Centro", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 650, "y": 320}, "context_element": "Centro Rotonda"},

    # North Concourse
    {"id": "n_lvl2_c_12", "name": "Pasillo Norte Dportenis", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 750, "y": 270}, "context_element": "Dairy Queen"},
    {"id": "n_lvl2_c_13", "name": "Pasillo Sfera / C&A Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 810, "y": 260}, "context_element": "C&A"},
    {"id": "n_lvl2_c_14", "name": "Pasillo Frente a Sfera", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 880, "y": 250}, "context_element": "Sfera"},
    {"id": "n_lvl2_c_15", "name": "Pasillo Sfera Oriente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 960, "y": 250}, "context_element": "Sephora"},
    {"id": "n_lvl2_c_16", "name": "Pasillo Plaza Norte Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1050, "y": 250}, "context_element": "H&M N1"},
    {"id": "n_lvl2_c_17", "name": "Acceso Norte Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1150, "y": 260}, "context_element": "Sears Norte"},

    # Central-South Concourse
    {"id": "n_lvl2_c_18", "name": "Pasillo Sanborns Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 720, "y": 380}, "context_element": "Nutrisa"},
    {"id": "n_lvl2_c_19", "name": "Pasillo Frente a Sanborns", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 790, "y": 390}, "context_element": "Sanborns"},
    {"id": "n_lvl2_c_20", "name": "Pasillo Chedraui / Sanborns", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 870, "y": 420}, "context_element": "Chedraui Selecto"},
    {"id": "n_lvl2_c_21", "name": "Pasillo Delicrepé / Moyo", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 920, "y": 450}, "context_element": "Moyo"},
    {"id": "n_lvl2_c_22", "name": "Pasillo Tótem Punto 12", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 960, "y": 490}, "context_element": "M-Caps / Tótem Punto 12"},
    {"id": "n_lvl2_c_23", "name": "Pasillo Flexi / Sears Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1040, "y": 470}, "context_element": "Flexi"},
    {"id": "n_lvl2_c_24", "name": "Acceso Escaleras Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1130, "y": 460}, "context_element": "Escaleras Sears"},
    {"id": "n_lvl2_c_25", "name": "Plaza Sears Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1200, "y": 440}, "context_element": "Sears Sur"},

    # Sears Connector
    {"id": "n_lvl2_c_26", "name": "Pasillo Conector Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1150, "y": 350}, "context_element": "Pasillo Sears"},
    {"id": "n_lvl2_c_27", "name": "Pasillo Automotriz Este", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1220, "y": 300}, "context_element": "Agencias Automotrices"}
]

corridors_lvl3 = [
    # Fast food & Entertainment (West)
    {"id": "n_lvl3_c_01", "name": "Pasillo Comida Rápida Poniente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 580, "y": 380}, "context_element": "Carl's Jr."},
    {"id": "n_lvl3_c_02", "name": "Pasillo Zona de Comida", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 650, "y": 370}, "context_element": "Domino's / El Infierno"},
    {"id": "n_lvl3_c_03", "name": "Pasillo Monkey Bowling", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 730, "y": 360}, "context_element": "Monkey Bowling"},
    
    # Central Hallway
    {"id": "n_lvl3_c_04", "name": "Pasillo Central Nivel 2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 800, "y": 340}, "context_element": "Escaleras Centrales"},
    {"id": "n_lvl3_c_05", "name": "Cruce Cinelia / Restaurantes", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 870, "y": 300}, "context_element": "Fisher's / UNAGI"},
    
    # Cinelia Concourse
    {"id": "n_lvl3_c_06", "name": "Pasillo Acceso Cinelia", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 920, "y": 240}, "context_element": "Taquilla Cinelia"},
    {"id": "n_lvl3_c_07", "name": "Frente a Salas Cinelia", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 980, "y": 220}, "context_element": "Cinelia"},
    {"id": "n_lvl3_c_08", "name": "Acceso Escaleras Cinelia", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1030, "y": 220}, "context_element": "Escaleras Cinelia / Sears"},
    
    # Terrace & Casual Dining (South Loop)
    {"id": "n_lvl3_c_09", "name": "Pasillo Terraza Poniente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 920, "y": 420}, "context_element": "Mammut Pizza"},
    {"id": "n_lvl3_c_10", "name": "Pasillo Terraza Central", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1000, "y": 460}, "context_element": "Jana / Casa Paula"},
    {"id": "n_lvl3_c_11", "name": "Acceso Escaleras Terraza", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1050, "y": 480}, "context_element": "Escaleras Terraza"},

    # Business Center & Fitness (East Wing)
    {"id": "n_lvl3_c_12", "name": "Pasillo Centro de Negocios", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1100, "y": 320}, "context_element": "Centro de Negocios"},
    {"id": "n_lvl3_c_13", "name": "Pasillo Anytime Fitness", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1180, "y": 300}, "context_element": "Anytime Fitness"}
]

all_corridors = corridors_lvl1 + corridors_lvl2 + corridors_lvl3
all_nodes = non_corridor_nodes + all_corridors
nodes_map = {n['id']: n for n in all_nodes}

edges = []
def add_edge(u_id, v_id, custom_w=None):
    u = nodes_map.get(u_id)
    v = nodes_map.get(v_id)
    if not u or not v:
        print(f"Error: node {u_id} or {v_id} not found")
        return
    if custom_w is not None:
        w = custom_w
    else:
        dx = u['coordinates']['x'] - v['coordinates']['x']
        dy = u['coordinates']['y'] - v['coordinates']['y']
        w = round(math.sqrt(dx*dx + dy*dy), 1)
    
    # check if already exists
    for e in edges:
        if (e['from'] == u_id and e['to'] == v_id) or (e['from'] == v_id and e['to'] == u_id):
            return
    edges.append({"from": u_id, "to": v_id, "weight": w})
    edges.append({"from": v_id, "to": u_id, "weight": w})

# Connect Level 1 corridor chain
for i in range(len(corridors_lvl1) - 1):
    add_edge(corridors_lvl1[i]['id'], corridors_lvl1[i+1]['id'])

# Connect Level 2 corridor chains
# West spine
for i in range(5):
    add_edge(corridors_lvl2[i]['id'], corridors_lvl2[i+1]['id'])

# Rotonda ring
add_edge("n_lvl2_c_05", "n_lvl2_c_06")
add_edge("n_lvl2_c_06", "n_lvl2_c_07")
add_edge("n_lvl2_c_07", "n_lvl2_c_08")
add_edge("n_lvl2_c_08", "n_lvl2_c_09")
add_edge("n_lvl2_c_09", "n_lvl2_c_11")
add_edge("n_lvl2_c_11", "n_lvl2_c_10")
add_edge("n_lvl2_c_10", "n_lvl2_c_06")
add_edge("n_lvl2_c_06", "n_lvl2_c_11")

# North concourse
add_edge("n_lvl2_c_09", "n_lvl2_c_12")
for i in range(11, 16):
    add_edge(corridors_lvl2[i]['id'], corridors_lvl2[i+1]['id'])

# Central-South concourse
add_edge("n_lvl2_c_10", "n_lvl2_c_18")
for i in range(17, 24):
    add_edge(corridors_lvl2[i]['id'], corridors_lvl2[i+1]['id'])

# Sears Connector vertical links
add_edge("n_lvl2_c_17", "n_lvl2_c_26")
add_edge("n_lvl2_c_26", "n_lvl2_c_24")
add_edge("n_lvl2_c_26", "n_lvl2_c_27")
add_edge("n_lvl2_c_25", "n_lvl2_c_27")

# Connect Level 3 corridor chains
# Food court to central
add_edge("n_lvl3_c_01", "n_lvl3_c_02")
add_edge("n_lvl3_c_02", "n_lvl3_c_03")
add_edge("n_lvl3_c_03", "n_lvl3_c_04")
add_edge("n_lvl3_c_04", "n_lvl3_c_05")

# Cinelia concourse
add_edge("n_lvl3_c_05", "n_lvl3_c_06")
add_edge("n_lvl3_c_06", "n_lvl3_c_07")
add_edge("n_lvl3_c_07", "n_lvl3_c_08")

# Terrace concourse
add_edge("n_lvl3_c_05", "n_lvl3_c_09")
add_edge("n_lvl3_c_09", "n_lvl3_c_10")
add_edge("n_lvl3_c_10", "n_lvl3_c_11")

# Business & Fitness wing
add_edge("n_lvl3_c_08", "n_lvl3_c_12")
add_edge("n_lvl3_c_12", "n_lvl3_c_13")
add_edge("n_lvl3_c_11", "n_lvl3_c_12")

# Connect Portals to their specific nearest corridor nodes
PORTAL_CORRIDOR_MAP = [
    # L1
    ("n_lvl1_portal_esc_liverpool", "n_lvl1_c_03"),
    ("n_lvl1_portal_elev_liverpool", "n_lvl1_c_03"),
    ("n_lvl1_portal_esc_central", "n_lvl1_c_07"),
    ("n_lvl1_portal_elev_central", "n_lvl1_c_07"),
    ("n_lvl1_portal_esc_oval", "n_lvl1_c_08"),

    # L2
    ("n_lvl2_portal_esc_liverpool", "n_lvl2_c_02"),
    ("n_lvl2_portal_elev_liverpool", "n_lvl2_c_02"),
    ("n_lvl2_portal_esc_rotunda_left", "n_lvl2_c_06"),
    ("n_lvl2_portal_esc_rotunda_right", "n_lvl2_c_09"),
    ("n_lvl2_portal_esc_rotunda_bot", "n_lvl2_c_10"),
    ("n_lvl2_portal_esc_sanborns", "n_lvl2_c_19"),
    ("n_lvl2_portal_esc_sears", "n_lvl2_c_24"),
    ("n_lvl2_portal_elev_chedraui", "n_lvl2_c_22"),
    ("n_lvl2_portal_esc_automotive", "n_lvl2_c_27"),

    # L3
    ("n_lvl3_portal_esc_cinelia", "n_lvl3_c_08"),
    ("n_lvl3_portal_elev_cinelia", "n_lvl3_c_07"),
    ("n_lvl3_portal_esc_central_top", "n_lvl3_c_04"),
    ("n_lvl3_portal_esc_central_bot", "n_lvl3_c_04"),
    ("n_lvl3_portal_esc_terrace", "n_lvl3_c_11"),
    ("n_lvl3_portal_esc_anytime", "n_lvl3_c_13")
]

for p_id, c_id in PORTAL_CORRIDOR_MAP:
    add_edge(p_id, c_id)

# Connect Totem Punto 12 directly to n_lvl2_c_22
add_edge("n_totem_12", "n_lvl2_c_22", 10.0)

# Connect all stores, islands, and services to their closest 1 or 2 corridor nodes on the same level
corridors_by_level = {
    1: corridors_lvl1,
    2: corridors_lvl2,
    3: corridors_lvl3
}

for n in non_corridor_nodes:
    if n['type'] in ('store', 'anchor_store', 'island', 'restroom', 'service') and n['id'] != 'n_totem_12':
        lvl = n['level']
        lvl_corrs = corridors_by_level[lvl]
        # sort by distance
        dists = []
        for c in lvl_corrs:
            dx = n['coordinates']['x'] - c['coordinates']['x']
            dy = n['coordinates']['y'] - c['coordinates']['y']
            d = math.hypot(dx, dy)
            dists.append((d, c['id']))
        dists.sort(key=lambda x: x[0])
        # connect closest
        add_edge(n['id'], dists[0][1], dists[0][0])
        # connect second closest if distance is reasonable
        if len(dists) > 1 and dists[1][0] < dists[0][0] * 1.5:
            add_edge(n['id'], dists[1][1], dists[1][0])

# Inter-floor portal vertical links
portal_vertical_pairs = [
    ("n_lvl1_portal_esc_liverpool", "n_lvl2_portal_esc_liverpool", 50),
    ("n_lvl1_portal_elev_liverpool", "n_lvl2_portal_elev_liverpool", 80),
    ("n_lvl1_portal_esc_central", "n_lvl2_portal_esc_rotunda_left", 50),
    ("n_lvl1_portal_elev_central", "n_lvl2_portal_elev_chedraui", 80),
    ("n_lvl1_portal_esc_oval", "n_lvl2_portal_esc_sanborns", 50),
    ("n_lvl2_portal_esc_sears", "n_lvl3_portal_esc_cinelia", 50),
    ("n_lvl2_portal_elev_chedraui", "n_lvl3_portal_elev_cinelia", 80),
    ("n_lvl2_portal_esc_rotunda_right", "n_lvl3_portal_esc_central_top", 50),
    ("n_lvl2_portal_esc_rotunda_bot", "n_lvl3_portal_esc_central_bot", 50),
    ("n_lvl2_portal_esc_sanborns", "n_lvl3_portal_esc_terrace", 50),
    ("n_lvl2_portal_esc_automotive", "n_lvl3_portal_esc_anytime", 50)
]

for p1, p2, w in portal_vertical_pairs:
    add_edge(p1, p2, w)

output_data = {
    "mall": "Paseo Altozano",
    "total_nodes": len(all_nodes),
    "total_edges": len(edges),
    "nodes": all_nodes,
    "edges": edges
}

with open('mall_graph.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Generated smooth mall_graph.json with {len(all_nodes)} nodes and {len(edges)} edges.")

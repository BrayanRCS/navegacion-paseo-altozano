import json
import math

# Master corridor backbone builder ensuring 100% of routing uses open hallways & islands
data = json.load(open('mall_graph.json', encoding='utf-8'))

# Base store/island/portal/totem nodes
pure_nodes = [
    n for n in data['nodes']
    if n['type'] in ('store', 'anchor_store', 'island', 'portal_escalator', 'portal_elevator', 'totem', 'service', 'restroom')
]

print(f"Loaded {len(pure_nodes)} destination/portal/island nodes.")

# Auxiliary corridor junction / bend nodes (to bridge open aisles between islands & concourses)
aux_corridor_nodes = [
    # --- PLANTA BAJA (L1) ---
    {"id": "n_lvl1_c_liv", "name": "Pasillo Liverpool PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 480, "y": 500}, "context_element": "Liverpool PB"},
    {"id": "n_lvl1_c_liv_esc", "name": "Pasillo Escaleras Liverpool PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 530, "y": 450}, "context_element": "Escaleras Liverpool PB"},
    {"id": "n_lvl1_c_mid_1", "name": "Pasillo Central Poniente PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 670, "y": 370}, "context_element": "Studio F"},
    {"id": "n_lvl1_c_mid_2", "name": "Pasillo Central PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 720, "y": 350}, "context_element": "American Eagle"},
    {"id": "n_lvl1_c_oval", "name": "Pasillo Plaza Oval PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 830, "y": 330}, "context_element": "H&M PB"},
    {"id": "n_lvl1_c_fountain", "name": "Pasillo Fuente Central PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 880, "y": 250}, "context_element": "Hotel Fiesta Inn"},
    {"id": "n_lvl1_c_macstore", "name": "Pasillo MacStore PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 930, "y": 190}, "context_element": "MacStore"},
    {"id": "n_lvl1_c_casino", "name": "Pasillo Casino PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 990, "y": 150}, "context_element": "Crown City Casino"},
    {"id": "n_lvl1_c_auto", "name": "Pasillo Autos Honda/Geely PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 1050, "y": 130}, "context_element": "Honda / Geely"},

    # --- PLANTA 1 (L2) ---
    # West concourse
    {"id": "n_lvl2_c_liv_door", "name": "Acceso Liverpool N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 300, "y": 510}, "context_element": "Liverpool"},
    {"id": "n_lvl2_c_liv_plaza", "name": "Plaza Liverpool N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 360, "y": 490}, "context_element": "Escaleras Liverpool"},
    {"id": "n_lvl2_c_gap", "name": "Pasillo GAP / Aeropostale", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 430, "y": 440}, "context_element": "Aeropostale"},
    {"id": "n_lvl2_c_steren", "name": "Pasillo Steren / Innovasport", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 490, "y": 410}, "context_element": "Innovasport"},
    {"id": "n_lvl2_c_loccitane", "name": "Pasillo L'Occitane", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 540, "y": 370}, "context_element": "L'Occitane"},

    # Rotonda Ring
    {"id": "n_lvl2_c_rot_w", "name": "Rotonda Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 600, "y": 340}, "context_element": "Rotonda Poniente"},
    {"id": "n_lvl2_c_rot_nw", "name": "Rotonda Norponiente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 605, "y": 290}, "context_element": "Miniso"},
    {"id": "n_lvl2_c_rot_n", "name": "Rotonda Norte", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 660, "y": 250}, "context_element": "Zanati"},
    {"id": "n_lvl2_c_rot_ne", "name": "Rotonda Nororiente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 710, "y": 270}, "context_element": "Dportenis"},
    {"id": "n_lvl2_c_rot_s", "name": "Rotonda Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 650, "y": 370}, "context_element": "Starbucks Coffee"},

    # North concourse (Towards Sfera)
    {"id": "n_lvl2_c_north_1", "name": "Pasillo Norte Dportenis", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 760, "y": 260}, "context_element": "Dairy Queen"},
    {"id": "n_lvl2_c_north_2", "name": "Pasillo C&A Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 820, "y": 255}, "context_element": "C&A"},
    {"id": "n_lvl2_c_sfera_front", "name": "Pasillo Frente a Sfera", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 880, "y": 250}, "context_element": "Sfera"},
    {"id": "n_lvl2_c_sephora_front", "name": "Pasillo Frente a Sephora", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 960, "y": 250}, "context_element": "Sephora"},
    {"id": "n_lvl2_c_interhome", "name": "Pasillo Inter Home / H&M", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1050, "y": 250}, "context_element": "H&M N1"},
    {"id": "n_lvl2_c_sears_north", "name": "Plaza Norte Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1140, "y": 260}, "context_element": "Sears Norte"},

    # Central-South concourse connectors
    {"id": "n_lvl2_c_sanborns_junc", "name": "Pasillo Sanborns / Nutrisa", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 680, "y": 360}, "context_element": "Nutrisa"},
    {"id": "n_lvl2_c_chedraui_hall", "name": "Pasillo Chedraui Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 960, "y": 520}, "context_element": "Chedraui Selecto Sur"},
    {"id": "n_lvl2_c_sears_south_1", "name": "Pasillo Sears Sur Poniente", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1040, "y": 475}, "context_element": "Flexi"},
    {"id": "n_lvl2_c_sears_south_2", "name": "Plaza Sears Sur", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1120, "y": 465}, "context_element": "Sears Sur"},

    # Sears vertical connector aisle
    {"id": "n_lvl2_c_sears_mid", "name": "Pasillo Conector Sears", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1190, "y": 350}, "context_element": "Pasillo Sears"},

    # --- PLANTA 2 (L3) ---
    {"id": "n_lvl3_c_food_1", "name": "Pasillo Comida Rápida Poniente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 580, "y": 380}, "context_element": "Carl's Jr."},
    {"id": "n_lvl3_c_food_2", "name": "Pasillo Zona de Comida", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 650, "y": 370}, "context_element": "Domino's / El Infierno"},
    {"id": "n_lvl3_c_food_3", "name": "Pasillo Monkey Bowling", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 730, "y": 360}, "context_element": "Monkey Bowling"},
    {"id": "n_lvl3_c_central_hub", "name": "Pasillo Central Nivel 2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 800, "y": 340}, "context_element": "Escaleras Centrales N2"},
    {"id": "n_lvl3_c_cinelia_junc", "name": "Cruce Cinelia / Restaurantes", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 860, "y": 300}, "context_element": "Fisher's / UNAGI"},
    {"id": "n_lvl3_c_cinelia_1", "name": "Pasillo Acceso Cinelia", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 910, "y": 240}, "context_element": "Taquilla Cinelia"},
    {"id": "n_lvl3_c_cinelia_2", "name": "Frente a Salas Cinelia", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 970, "y": 220}, "context_element": "Cinelia"},
    {"id": "n_lvl3_c_cinelia_3", "name": "Plaza Cinelia Oriente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1020, "y": 210}, "context_element": "Salas VIP"},
    {"id": "n_lvl3_c_terrace_1", "name": "Pasillo Terraza Poniente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 920, "y": 420}, "context_element": "Mammut Pizza"},
    {"id": "n_lvl3_c_terrace_2", "name": "Pasillo Terraza Central", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1000, "y": 460}, "context_element": "Jana / Casa Paula"},
    {"id": "n_lvl3_c_terrace_3", "name": "Plaza Terraza Oriente", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1050, "y": 480}, "context_element": "Escaleras Terraza"},
    {"id": "n_lvl3_c_biz_1", "name": "Pasillo Centro de Negocios", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1100, "y": 310}, "context_element": "Centro de Negocios"},
    {"id": "n_lvl3_c_fitness", "name": "Pasillo Anytime Fitness", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1180, "y": 300}, "context_element": "Anytime Fitness"}
]

all_nodes = pure_nodes + aux_corridor_nodes
nodes_map = {n['id']: n for n in all_nodes}

edges = []
def add_edge(u_id, v_id, custom_w=None):
    u = nodes_map.get(u_id)
    v = nodes_map.get(v_id)
    if not u or not v:
        print(f"Warning: Node not found {u_id} or {v_id}")
        return
    if custom_w is not None:
        w = custom_w
    else:
        w = round(math.hypot(u['coordinates']['x'] - v['coordinates']['x'], u['coordinates']['y'] - v['coordinates']['y']), 1)
    
    for e in edges:
        if (e['from'] == u_id and e['to'] == v_id) or (e['from'] == v_id and e['to'] == u_id):
            return
    edges.append({"from": u_id, "to": v_id, "weight": w})
    edges.append({"from": v_id, "to": u_id, "weight": w})

# =======================================================
# 1. PLANTA BAJA (L1) CORRIDOR BACKBONE (USING ISLANDS 1, 2, 3)
# =======================================================
add_edge("n_lvl1_c_liv", "n_lvl1_c_liv_esc")
add_edge("n_lvl1_c_liv_esc", "n_lvl1_island_2")  # Jurassic Ride
add_edge("n_lvl1_island_2", "n_lvl1_island_1")   # Casa Carcasa
add_edge("n_lvl1_island_1", "n_lvl1_c_mid_1")
add_edge("n_lvl1_c_mid_1", "n_lvl1_c_mid_2")
add_edge("n_lvl1_c_mid_2", "n_lvl1_island_3")    # Flabelus
add_edge("n_lvl1_island_3", "n_lvl1_c_oval")
add_edge("n_lvl1_c_oval", "n_lvl1_c_fountain")
add_edge("n_lvl1_c_fountain", "n_lvl1_c_macstore")
add_edge("n_lvl1_c_macstore", "n_lvl1_c_casino")
add_edge("n_lvl1_c_casino", "n_lvl1_c_auto")

# L1 Portals to Corridor
add_edge("n_lvl1_portal_esc_liverpool", "n_lvl1_c_liv_esc")
add_edge("n_lvl1_portal_elev_liverpool", "n_lvl1_c_liv_esc")
add_edge("n_lvl1_portal_esc_central", "n_lvl1_c_fountain")
add_edge("n_lvl1_portal_elev_central", "n_lvl1_c_fountain")
add_edge("n_lvl1_portal_esc_oval", "n_lvl1_c_oval")

# =======================================================
# 2. PLANTA 1 (L2) CORRIDOR BACKBONE (USING ISLANDS 1..12)
# =======================================================
# A) West Concourse (Liverpool -> Rotonda)
add_edge("n_lvl2_c_liv_door", "n_lvl2_c_liv_plaza")
add_edge("n_lvl2_c_liv_plaza", "n_lvl2_c_gap")
add_edge("n_lvl2_c_gap", "n_lvl2_c_steren")
add_edge("n_lvl2_c_steren", "n_lvl2_c_loccitane")
add_edge("n_lvl2_c_loccitane", "n_lvl2_island_1") # De Regil
add_edge("n_lvl2_island_1", "n_lvl2_c_rot_w")

# B) Rotonda Ring
add_edge("n_lvl2_c_rot_w", "n_lvl2_c_rot_nw")
add_edge("n_lvl2_c_rot_nw", "n_lvl2_island_2")   # Elotería
add_edge("n_lvl2_island_2", "n_lvl2_c_rot_n")
add_edge("n_lvl2_c_rot_n", "n_lvl2_c_rot_ne")
add_edge("n_lvl2_c_rot_ne", "n_lvl2_c_rot_s")
add_edge("n_lvl2_c_rot_s", "n_lvl2_c_rot_w")

# C) North Concourse (Rotonda -> Sfera -> Sears)
add_edge("n_lvl2_c_rot_ne", "n_lvl2_c_north_1")
add_edge("n_lvl2_c_north_1", "n_lvl2_c_north_2")
add_edge("n_lvl2_c_north_2", "n_lvl2_c_sfera_front")
add_edge("n_lvl2_c_sfera_front", "n_lvl2_c_sephora_front")
add_edge("n_lvl2_c_sephora_front", "n_lvl2_c_interhome")
add_edge("n_lvl2_c_interhome", "n_lvl2_c_sears_north")

# D) South-Central Island Concourse (Rotonda -> Islands 3,4,5,6,7,8 -> Chedraui)
add_edge("n_lvl2_c_rot_s", "n_lvl2_c_sanborns_junc")
add_edge("n_lvl2_c_sanborns_junc", "n_lvl2_island_3") # Casa Carcasa
add_edge("n_lvl2_island_3", "n_lvl2_island_4")        # Mingos
add_edge("n_lvl2_island_4", "n_lvl2_island_5")        # Straight A Head
add_edge("n_lvl2_island_5", "n_lvl2_island_6")        # Olivia
add_edge("n_lvl2_island_6", "n_lvl2_island_7")        # Obey Your Body
add_edge("n_lvl2_island_7", "n_lvl2_island_8")        # M&L Joyas
add_edge("n_lvl2_island_8", "n_lvl2_island_9")        # Delicrepé (junction)

# E) Chedraui-Tótem Vertical Island Concourse (Islands 9,10,11,12)
add_edge("n_lvl2_island_9", "n_lvl2_island_10")       # Moyo
add_edge("n_lvl2_island_10", "n_lvl2_island_11")      # La Casa de las Carcasas
add_edge("n_lvl2_island_11", "n_lvl2_island_12")      # M-Caps
add_edge("n_lvl2_island_12", "n_totem_12", 8.0)       # Direct 8px link to Tótem Punto 12!
add_edge("n_totem_12", "n_lvl2_c_chedraui_hall")
add_edge("n_lvl2_island_12", "n_lvl2_c_chedraui_hall")

# F) Inter-Concourse Links
# North to Chedraui vertical link
add_edge("n_lvl2_c_sephora_front", "n_lvl2_island_9")
# Chedraui to Sears south
add_edge("n_lvl2_c_chedraui_hall", "n_lvl2_c_sears_south_1")
add_edge("n_lvl2_c_sears_south_1", "n_lvl2_c_sears_south_2")
# Sears south to Sears escalators & connector
add_edge("n_lvl2_c_sears_south_2", "n_lvl2_portal_esc_sears")
add_edge("n_lvl2_portal_esc_sears", "n_lvl2_c_sears_mid")
add_edge("n_lvl2_c_sears_mid", "n_lvl2_c_sears_north")

# L2 Portals to Corridor
add_edge("n_lvl2_portal_esc_liverpool", "n_lvl2_c_liv_plaza")
add_edge("n_lvl2_portal_elev_liverpool", "n_lvl2_c_liv_plaza")
add_edge("n_lvl2_portal_esc_rotunda_left", "n_lvl2_c_rot_w")
add_edge("n_lvl2_portal_esc_rotunda_right", "n_lvl2_c_rot_ne")
add_edge("n_lvl2_portal_esc_rotunda_bot", "n_lvl2_c_rot_s")
add_edge("n_lvl2_portal_esc_sanborns", "n_lvl2_c_sanborns_junc")
add_edge("n_lvl2_portal_elev_chedraui", "n_lvl2_island_11")
add_edge("n_lvl2_portal_esc_automotive", "n_lvl2_c_sears_mid")

# =======================================================
# 3. PLANTA 2 (L3) CORRIDOR BACKBONE
# =======================================================
# Fast food
add_edge("n_lvl3_c_food_1", "n_lvl3_c_food_2")
add_edge("n_lvl3_c_food_2", "n_lvl3_c_food_3")
add_edge("n_lvl3_c_food_3", "n_lvl3_c_central_hub")

# Central Hub to Cinelia
add_edge("n_lvl3_c_central_hub", "n_lvl3_c_cinelia_junc")
add_edge("n_lvl3_c_cinelia_junc", "n_lvl3_c_cinelia_1")
add_edge("n_lvl3_c_cinelia_1", "n_lvl3_c_cinelia_2")
add_edge("n_lvl3_c_cinelia_2", "n_lvl3_c_cinelia_3")

# Central Hub to Terrace
add_edge("n_lvl3_c_cinelia_junc", "n_lvl3_c_terrace_1")
add_edge("n_lvl3_c_terrace_1", "n_lvl3_c_terrace_2")
add_edge("n_lvl3_c_terrace_2", "n_lvl3_c_terrace_3")

# Business & Fitness Wing
add_edge("n_lvl3_c_cinelia_3", "n_lvl3_c_biz_1")
add_edge("n_lvl3_c_biz_1", "n_lvl3_c_fitness")
add_edge("n_lvl3_c_terrace_3", "n_lvl3_c_biz_1")

# L3 Portals to Corridor
add_edge("n_lvl3_portal_esc_cinelia", "n_lvl3_c_cinelia_3")
add_edge("n_lvl3_portal_elev_cinelia", "n_lvl3_c_cinelia_2")
add_edge("n_lvl3_portal_esc_central_top", "n_lvl3_c_central_hub")
add_edge("n_lvl3_portal_esc_central_bot", "n_lvl3_c_central_hub")
add_edge("n_lvl3_portal_esc_terrace", "n_lvl3_c_terrace_3")
add_edge("n_lvl3_portal_esc_anytime", "n_lvl3_c_fitness")

# =======================================================
# 4. STOREFRONT CONNECTIONS (STRICTLY CONNECT TO FRONT CORRIDOR/ISLAND)
# =======================================================
# All stores connect strictly to their nearest corridor/island node
walkway_nodes_by_level = {
    1: [n for n in all_nodes if n['level'] == 1 and (n['type'] == 'island' or n['id'].startswith('n_lvl1_c_'))],
    2: [n for n in all_nodes if n['level'] == 2 and (n['type'] == 'island' or n['id'].startswith('n_lvl2_c_'))],
    3: [n for n in all_nodes if n['level'] == 3 and (n['id'].startswith('n_lvl3_c_'))]
}

for n in pure_nodes:
    if n['type'] in ('store', 'anchor_store', 'restroom', 'service') and n['id'] != 'n_totem_12':
        lvl = n['level']
        walkways = walkway_nodes_by_level[lvl]
        dists = []
        for w in walkways:
            d = math.hypot(n['coordinates']['x'] - w['coordinates']['x'], n['coordinates']['y'] - w['coordinates']['y'])
            dists.append((d, w['id']))
        dists.sort(key=lambda x: x[0])
        # Connect to closest corridor node (store entrance)
        add_edge(n['id'], dists[0][1], dists[0][0])
        # Optionally connect to second closest if very near
        if len(dists) > 1 and dists[1][0] < dists[0][0] * 1.3:
            add_edge(n['id'], dists[1][1], dists[1][0])

# =======================================================
# 5. VERTICAL PORTAL PAIRS (BETWEEN FLOORS)
# =======================================================
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

output = {
    "mall": "Paseo Altozano",
    "total_nodes": len(all_nodes),
    "total_edges": len(edges),
    "nodes": all_nodes,
    "edges": edges
}

with open('mall_graph.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Built 100% hallway-based graph with {len(all_nodes)} nodes and {len(edges)} edges.")

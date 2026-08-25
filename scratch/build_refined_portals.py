import json
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes_dict = {n['id']: n for n in data['nodes']}

# Explicit portal nodes with verified coordinates matching the blue badges on maps
PORTAL_NODES = [
    # --- PLANTA BAJA (L1) ---
    { "id": "n_lvl1_portal_esc_liverpool", "name": "Escaleras Eléctricas Plaza Liverpool (PB)", "type": "portal_escalator", "level": 1, "coordinates": {"x": 562, "y": 489} },
    { "id": "n_lvl1_portal_elev_liverpool", "name": "Elevador Plaza Liverpool (PB)", "type": "portal_elevator", "level": 1, "coordinates": {"x": 574, "y": 524} },
    { "id": "n_lvl1_portal_esc_central", "name": "Escaleras Eléctricas Fiesta Inn / Central (PB)", "type": "portal_escalator", "level": 1, "coordinates": {"x": 788, "y": 341} },
    { "id": "n_lvl1_portal_elev_central", "name": "Elevador Central / Fiesta Inn (PB)", "type": "portal_elevator", "level": 1, "coordinates": {"x": 792, "y": 248} },
    { "id": "n_lvl1_portal_esc_oval", "name": "Escaleras Eléctricas Plaza Oval (PB)", "type": "portal_escalator", "level": 1, "coordinates": {"x": 832, "y": 334} },

    # --- PLANTA 1 (L2) ---
    { "id": "n_lvl2_portal_esc_liverpool", "name": "Escaleras Eléctricas Plaza Liverpool (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 339, "y": 512} },
    { "id": "n_lvl2_portal_elev_liverpool", "name": "Elevador Plaza Liverpool (N1)", "type": "portal_elevator", "level": 2, "coordinates": {"x": 411, "y": 519} },
    { "id": "n_lvl2_portal_esc_rotunda_left", "name": "Escaleras Eléctricas Rotonda Poniente (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 601, "y": 318} },
    { "id": "n_lvl2_portal_esc_rotunda_right", "name": "Escaleras Eléctricas Rotonda Norte (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 672, "y": 353} },
    { "id": "n_lvl2_portal_esc_rotunda_bot", "name": "Escaleras Eléctricas Rotonda Sur (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 619, "y": 353} },
    { "id": "n_lvl2_portal_esc_sanborns", "name": "Escaleras Eléctricas Sanborns (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 634, "y": 550} },
    { "id": "n_lvl2_portal_esc_sears", "name": "Escaleras Eléctricas Sears / Cinelia (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 1181, "y": 450} },
    { "id": "n_lvl2_portal_elev_chedraui", "name": "Elevador Chedraui / Sears (N1)", "type": "portal_elevator", "level": 2, "coordinates": {"x": 1150, "y": 500} },
    { "id": "n_lvl2_portal_esc_automotive", "name": "Escaleras Pasillo Automotriz (N1)", "type": "portal_escalator", "level": 2, "coordinates": {"x": 1228, "y": 301} },

    # --- PLANTA 2 (L3) ---
    { "id": "n_lvl3_portal_esc_cinelia", "name": "Escaleras Eléctricas Cinelia / Sears (N2)", "type": "portal_escalator", "level": 3, "coordinates": {"x": 999, "y": 208} },
    { "id": "n_lvl3_portal_elev_cinelia", "name": "Elevador Cinelia (N2)", "type": "portal_elevator", "level": 3, "coordinates": {"x": 996, "y": 173} },
    { "id": "n_lvl3_portal_esc_central_top", "name": "Escaleras Eléctricas Central Norte (N2)", "type": "portal_escalator", "level": 3, "coordinates": {"x": 820, "y": 338} },
    { "id": "n_lvl3_portal_esc_central_bot", "name": "Escaleras Eléctricas Central Sur (N2)", "type": "portal_escalator", "level": 3, "coordinates": {"x": 847, "y": 383} },
    { "id": "n_lvl3_portal_esc_terrace", "name": "Escaleras Eléctricas Terraza (N2)", "type": "portal_escalator", "level": 3, "coordinates": {"x": 1025, "y": 497} },
    { "id": "n_lvl3_portal_esc_anytime", "name": "Escaleras Eléctricas Anytime Fitness (N2)", "type": "portal_escalator", "level": 3, "coordinates": {"x": 1221, "y": 301} }
]

for p in PORTAL_NODES:
    nodes_dict[p['id']] = p

# Dedicated corridor approach nodes to ensure clean walking path directly into the escalator/elevator
APPROACH_NODES = [
    # L1 Approaches
    { "id": "n_lvl1_corridor_esc_liverpool_app", "name": "Acceso Escaleras Liverpool PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 562, "y": 460} },
    { "id": "n_lvl1_corridor_esc_central_app", "name": "Acceso Escaleras Central PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 760, "y": 350} },
    { "id": "n_lvl1_corridor_elev_central_app", "name": "Acceso Elevador Central PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 790, "y": 250} },
    { "id": "n_lvl1_corridor_esc_oval_app", "name": "Acceso Escaleras Oval PB", "type": "corridor_waypoint", "level": 1, "coordinates": {"x": 830, "y": 340} },

    # L2 Approaches
    { "id": "n_lvl2_corridor_esc_liverpool_app", "name": "Acceso Escaleras Liverpool N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 355, "y": 490} },
    { "id": "n_lvl2_corridor_elev_liverpool_app", "name": "Acceso Elevador Liverpool N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 390, "y": 500} },
    { "id": "n_lvl2_corridor_esc_sanborns_app", "name": "Acceso Escaleras Sanborns N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 680, "y": 480} },
    { "id": "n_lvl2_corridor_esc_sears_app", "name": "Acceso Escaleras Sears N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1200, "y": 450} },
    { "id": "n_lvl2_corridor_esc_auto_app", "name": "Acceso Escaleras Autos N1", "type": "corridor_waypoint", "level": 2, "coordinates": {"x": 1215, "y": 280} },

    # L3 Approaches
    { "id": "n_lvl3_corridor_esc_cinelia_app", "name": "Acceso Escaleras Cinelia N2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 950, "y": 230} },
    { "id": "n_lvl3_corridor_elev_cinelia_app", "name": "Acceso Elevador Cinelia N2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 950, "y": 190} },
    { "id": "n_lvl3_corridor_esc_terrace_app", "name": "Acceso Escaleras Terraza N2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1035, "y": 420} },
    { "id": "n_lvl3_corridor_esc_anytime_app", "name": "Acceso Escaleras Anytime N2", "type": "corridor_waypoint", "level": 3, "coordinates": {"x": 1150, "y": 310} }
]

for a in APPROACH_NODES:
    nodes_dict[a['id']] = a

edges = data['edges']

def add_edge_pair(edges_list, from_id, to_id, weight=None):
    u = nodes_dict.get(from_id)
    v = nodes_dict.get(to_id)
    if not u or not v:
        print(f"ERROR: missing {from_id} or {to_id}")
        return edges_list
    if weight is None:
        dx = u['coordinates']['x'] - v['coordinates']['x']
        dy = u['coordinates']['y'] - v['coordinates']['y']
        weight = round(math.sqrt(dx*dx + dy*dy), 1)
    
    edges_list = [e for e in edges_list if not ((e['from'] == from_id and e['to'] == to_id) or (e['from'] == to_id and e['to'] == from_id))]
    edges_list.append({"from": from_id, "to": to_id, "weight": weight})
    edges_list.append({"from": to_id, "to": from_id, "weight": weight})
    return edges_list

# Connect L1
edges = add_edge_pair(edges, "n_lvl1_corridor_mid_west", "n_lvl1_corridor_esc_liverpool_app")
edges = add_edge_pair(edges, "n_lvl1_corridor_esc_liverpool_app", "n_lvl1_portal_esc_liverpool")
edges = add_edge_pair(edges, "n_lvl1_corridor_esc_liverpool_app", "n_lvl1_portal_elev_liverpool")

edges = add_edge_pair(edges, "n_lvl1_corridor_mid_east", "n_lvl1_corridor_esc_central_app")
edges = add_edge_pair(edges, "n_lvl1_corridor_esc_central_app", "n_lvl1_portal_esc_central")

edges = add_edge_pair(edges, "n_lvl1_corridor_fountain", "n_lvl1_corridor_elev_central_app")
edges = add_edge_pair(edges, "n_lvl1_corridor_elev_central_app", "n_lvl1_portal_elev_central")

edges = add_edge_pair(edges, "n_lvl1_corridor_oval", "n_lvl1_corridor_esc_oval_app")
edges = add_edge_pair(edges, "n_lvl1_corridor_esc_oval_app", "n_lvl1_portal_esc_oval")

# Connect L2
edges = add_edge_pair(edges, "n_lvl2_corridor_liverpool", "n_lvl2_corridor_esc_liverpool_app")
edges = add_edge_pair(edges, "n_lvl2_corridor_esc_liverpool_app", "n_lvl2_portal_esc_liverpool")
edges = add_edge_pair(edges, "n_lvl2_corridor_liverpool", "n_lvl2_corridor_elev_liverpool_app")
edges = add_edge_pair(edges, "n_lvl2_corridor_elev_liverpool_app", "n_lvl2_portal_elev_liverpool")

edges = add_edge_pair(edges, "n_lvl2_corridor_rotunda_w", "n_lvl2_portal_esc_rotunda_left")
edges = add_edge_pair(edges, "n_lvl2_corridor_rotunda_center", "n_lvl2_portal_esc_rotunda_right")
edges = add_edge_pair(edges, "n_lvl2_corridor_rotunda_center", "n_lvl2_portal_esc_rotunda_bot")

edges = add_edge_pair(edges, "n_lvl2_corridor_central_south", "n_lvl2_corridor_esc_sanborns_app")
edges = add_edge_pair(edges, "n_lvl2_corridor_esc_sanborns_app", "n_lvl2_portal_esc_sanborns")

edges = add_edge_pair(edges, "n_lvl2_corridor_sears_entrance", "n_lvl2_corridor_esc_sears_app")
edges = add_edge_pair(edges, "n_lvl2_corridor_esc_sears_app", "n_lvl2_portal_esc_sears")

edges = add_edge_pair(edges, "n_lvl2_corridor_chedraui_junc", "n_lvl2_portal_elev_chedraui")

edges = add_edge_pair(edges, "n_lvl2_corridor_sears_plaza", "n_lvl2_corridor_esc_auto_app")
edges = add_edge_pair(edges, "n_lvl2_corridor_esc_auto_app", "n_lvl2_portal_esc_automotive")

# Connect L3
edges = add_edge_pair(edges, "n_lvl3_corridor_cinelia_front", "n_lvl3_corridor_esc_cinelia_app")
edges = add_edge_pair(edges, "n_lvl3_corridor_esc_cinelia_app", "n_lvl3_portal_esc_cinelia")

edges = add_edge_pair(edges, "n_lvl3_corridor_cinelia_front", "n_lvl3_corridor_elev_cinelia_app")
edges = add_edge_pair(edges, "n_lvl3_corridor_elev_cinelia_app", "n_lvl3_portal_elev_cinelia")

edges = add_edge_pair(edges, "n_lvl3_corridor_central", "n_lvl3_portal_esc_central_top")
edges = add_edge_pair(edges, "n_lvl3_corridor_central", "n_lvl3_portal_esc_central_bot")

edges = add_edge_pair(edges, "n_lvl3_corridor_terrace", "n_lvl3_corridor_esc_terrace_app")
edges = add_edge_pair(edges, "n_lvl3_corridor_esc_terrace_app", "n_lvl3_portal_esc_terrace")

edges = add_edge_pair(edges, "n_lvl3_corridor_terrace", "n_lvl3_corridor_esc_anytime_app")
edges = add_edge_pair(edges, "n_lvl3_corridor_esc_anytime_app", "n_lvl3_portal_esc_anytime")

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
    edges = add_edge_pair(edges, p1, p2, w)

output_data = {
    "mall": "Paseo Altozano",
    "total_nodes": len(nodes_dict),
    "total_edges": len(edges),
    "nodes": list(nodes_dict.values()),
    "edges": edges
}

with open('mall_graph.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Updated mall_graph.json with {len(nodes_dict)} nodes and {len(edges)} edges.")

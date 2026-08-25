import json
import heapq
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}

# Build separate subgraphs per level
level_graphs = {1: {}, 2: {}, 3: {}}
level_nodes = {1: {}, 2: {}, 3: {}}

for n in data['nodes']:
    level_nodes[n['level']][n['id']] = n

for e in data['edges']:
    u = nodes.get(e['from'])
    v = nodes.get(e['to'])
    if u and v and u['level'] == v['level']:
        lvl = u['level']
        level_graphs[lvl].setdefault(e['from'], []).append(e)

# Inter-floor portal mapping
portals = [
    # L1 <-> L2
    {"id": "portal_liverpool_esc", "type": "escalator", "name": "Escaleras Eléctricas Plaza Liverpool", 1: "n_lvl1_portal_esc_liverpool", 2: "n_lvl2_portal_esc_liverpool"},
    {"id": "portal_liverpool_elev", "type": "elevator", "name": "Elevador Plaza Liverpool", 1: "n_lvl1_portal_elev_liverpool", 2: "n_lvl2_portal_elev_liverpool"},
    {"id": "portal_central_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda / Central", 1: "n_lvl1_portal_esc_central", 2: "n_lvl2_portal_esc_rotunda_left"},
    {"id": "portal_oval_sanborns_esc", "type": "escalator", "name": "Escaleras Eléctricas Plaza Oval / Sanborns", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_sanborns"},

    # L2 <-> L3
    {"id": "portal_sears_cinelia_esc", "type": "escalator", "name": "Escaleras Eléctricas Sears / Cinelia", 2: "n_lvl2_portal_esc_sears", 3: "n_lvl3_portal_esc_cinelia"},
    {"id": "portal_chedraui_cinelia_elev", "type": "elevator", "name": "Elevador Chedraui / Cinelia", 2: "n_lvl2_portal_elev_chedraui", 3: "n_lvl3_portal_elev_cinelia"},
    {"id": "portal_rotunda_central_top_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda Central Norte", 2: "n_lvl2_portal_esc_rotunda_right", 3: "n_lvl3_portal_esc_central_top"},
    {"id": "portal_rotunda_central_bot_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda Central Sur", 2: "n_lvl2_portal_esc_rotunda_bot", 3: "n_lvl3_portal_esc_central_bot"},
    {"id": "portal_sanborns_terrace_esc", "type": "escalator", "name": "Escaleras Eléctricas Terraza", 2: "n_lvl2_portal_esc_sanborns", 3: "n_lvl3_portal_esc_terrace"}
]

def astar_single_level(lvl, start_id, goal_id):
    adj = level_graphs[lvl]
    nodes_lvl = level_nodes[lvl]

    def h(a, b):
        na, nb = nodes_lvl[a], nodes_lvl[b]
        dx = na['coordinates']['x'] - nb['coordinates']['x']
        dy = na['coordinates']['y'] - nb['coordinates']['y']
        return math.sqrt(dx*dx + dy*dy)

    open_set = [(0, start_id)]
    came_from = {}
    g_score = {nid: float('inf') for nid in nodes_lvl}
    g_score[start_id] = 0

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal_id:
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            return path[::-1]

        for e in adj.get(current, []):
            nbr = e['to']
            tentative_g = g_score[current] + e['weight']
            if tentative_g < g_score[nbr]:
                came_from[nbr] = current
                g_score[nbr] = tentative_g
                heapq.heappush(open_set, (tentative_g + h(nbr, goal_id), nbr))

    return []

def route_multi_floor(start_id, goal_id, prefer_elevator=False):
    start_node = nodes[start_id]
    goal_node = nodes[goal_id]

    start_lvl = start_node['level']
    goal_lvl = goal_node['level']

    # Case 1: Same floor
    if start_lvl == goal_lvl:
        path = astar_single_level(start_lvl, start_id, goal_id)
        return [{
            "level": start_lvl,
            "title": f"Tramo único: Nivel {start_lvl}",
            "path": path,
            "start": start_id,
            "goal": goal_id
        }]

    # Case 2: Adjacent floors (e.g. L2 -> L3 or L2 -> L1)
    if abs(start_lvl - goal_lvl) == 1:
        # Find all portals connecting start_lvl and goal_lvl
        candidate_portals = []
        for p in portals:
            if start_lvl in p and goal_lvl in p:
                if prefer_elevator and p['type'] != 'elevator':
                    continue
                p_start = p[start_lvl]
                p_goal = p[goal_lvl]
                # Calculate path on start_lvl
                path1 = astar_single_level(start_lvl, start_id, p_start)
                # Calculate path on goal_lvl
                path2 = astar_single_level(goal_lvl, p_goal, goal_id)
                if path1 and path2:
                    # calculate total weight
                    w1 = sum(math.hypot(nodes[path1[i]]['coordinates']['x'] - nodes[path1[i+1]]['coordinates']['x'],
                                        nodes[path1[i]]['coordinates']['y'] - nodes[path1[i+1]]['coordinates']['y']) for i in range(len(path1)-1))
                    w2 = sum(math.hypot(nodes[path2[i]]['coordinates']['x'] - nodes[path2[i+1]]['coordinates']['x'],
                                        nodes[path2[i]]['coordinates']['y'] - nodes[path2[i+1]]['coordinates']['y']) for i in range(len(path2)-1))
                    candidate_portals.append({
                        "portal": p,
                        "total_cost": w1 + w2,
                        "path1": path1,
                        "path2": path2
                    })
        if candidate_portals:
            candidate_portals.sort(key=lambda x: x['total_cost'])
            best = candidate_portals[0]
            p = best['portal']
            return [
                {
                    "level": start_lvl,
                    "title": f"Tramo 1: Nivel {start_lvl} (Hacia {p['name']})",
                    "path": best['path1'],
                    "start": start_id,
                    "goal": p[start_lvl],
                    "transition": f"{'Subir' if goal_lvl > start_lvl else 'Bajar'} al Nivel {goal_lvl} por {p['name']}"
                },
                {
                    "level": goal_lvl,
                    "title": f"Tramo 2: Nivel {goal_lvl} (Desde {p['name']} hacia destino)",
                    "path": best['path2'],
                    "start": p[goal_lvl],
                    "goal": goal_id
                }
            ]

    # Case 3: 2-floor jump (L1 <-> L3 through L2)
    # Start -> L2 Portal -> L2 -> L3 Portal -> L3
    # ...
    return []

# Test Totem (L2) -> Cinelia (L3)
t = route_multi_floor("n_totem_12", "n_lvl3_store_3")
print(f"Multi-floor test 1 (Totem L2 -> Cinelia L3): {len(t)} segments")
for seg in t:
    print(f"  {seg['title']}: {len(seg['path'])} nodes")

# Test Totem (L2) -> Liverpool (L1)
t2 = route_multi_floor("n_totem_12", "n_lvl1_store_1")
print(f"Multi-floor test 2 (Totem L2 -> Liverpool L1): {len(t2)} segments")
for seg in t2:
    print(f"  {seg['title']}: {len(seg['path'])} nodes")

import json
import math
import heapq

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}

level_graphs = {1: {}, 2: {}, 3: {}}
level_nodes = {1: {}, 2: {}, 3: {}}

for n in data['nodes']:
    level_nodes[n['level']][n['id']] = n

for e in data['edges']:
    u = nodes.get(e['from'])
    v = nodes.get(e['to'])
    if u and v and u['level'] == v['level']:
        level_graphs[u['level']].setdefault(e['from'], []).append(e)

PORTALS = [
    { "id": "p_liverpool_esc", "type": "escalator", "name": "Escaleras Eléctricas Plaza Liverpool", 1: "n_lvl1_portal_esc_liverpool", 2: "n_lvl2_portal_esc_liverpool" },
    { "id": "p_liverpool_elev", "type": "elevator", "name": "Elevador Plaza Liverpool", 1: "n_lvl1_portal_elev_liverpool", 2: "n_lvl2_portal_elev_liverpool" },
    { "id": "p_central_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda Central", 1: "n_lvl1_portal_esc_central", 2: "n_lvl2_portal_esc_rotunda_left" },
    { "id": "p_oval_sanborns_esc", "type": "escalator", "name": "Escaleras Eléctricas Plaza Oval / Sanborns", 1: "n_lvl1_portal_esc_oval", 2: "n_lvl2_portal_esc_sanborns" },
    { "id": "p_sears_cinelia_esc", "type": "escalator", "name": "Escaleras Eléctricas Sears / Cinelia", 2: "n_lvl2_portal_esc_sears", 3: "n_lvl3_portal_esc_cinelia" },
    { "id": "p_chedraui_cinelia_elev", "type": "elevator", "name": "Elevador Chedraui / Cinelia", 2: "n_lvl2_portal_elev_chedraui", 3: "n_lvl3_portal_elev_cinelia" },
    { "id": "p_rotunda_top_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda Norte", 2: "n_lvl2_portal_esc_rotunda_right", 3: "n_lvl3_portal_esc_central_top" },
    { "id": "p_rotunda_bot_esc", "type": "escalator", "name": "Escaleras Eléctricas Rotonda Sur", 2: "n_lvl2_portal_esc_rotunda_bot", 3: "n_lvl3_portal_esc_central_bot" },
    { "id": "p_sanborns_terrace_esc", "type": "escalator", "name": "Escaleras Eléctricas Terraza", 2: "n_lvl2_portal_esc_sanborns", 3: "n_lvl3_portal_esc_terrace" }
]

def astar(lvl, start_id, goal_id):
    adj = level_graphs[lvl]
    nodes_lvl = level_nodes[lvl]
    def h(a, b):
        na, nb = nodes_lvl[a], nodes_lvl[b]
        return math.hypot(na['coordinates']['x'] - nb['coordinates']['x'], na['coordinates']['y'] - nb['coordinates']['y'])

    open_set = [(0, start_id)]
    came_from = {}
    g = {nid: float('inf') for nid in nodes_lvl}
    g[start_id] = 0

    while open_set:
        _, curr = heapq.heappop(open_set)
        if curr == goal_id:
            res = [curr]
            while curr in came_from:
                curr = came_from[curr]
                res.append(curr)
            return res[::-1]
        for e in adj.get(curr, []):
            nbr = e['to']
            tentative_g = g[curr] + e['weight']
            if tentative_g < g[nbr]:
                came_from[nbr] = curr
                g[nbr] = tentative_g
                heapq.heappush(open_set, (tentative_g + h(nbr, goal_id), nbr))
    return []

# Test all cross floor combinations from totem
totem = "n_totem_12"
failures = []
for n in data['nodes']:
    if n['type'] in ('store', 'anchor_store', 'island'):
        target_lvl = n['level']
        if target_lvl == 2:
            p = astar(2, totem, n['id'])
            if not p: failures.append((n['id'], "Same floor fail"))
        elif target_lvl in (1, 3):
            # Check portal routing
            valid = False
            for port in PORTALS:
                if 2 in port and target_lvl in port:
                    p1 = astar(2, totem, port[2])
                    p2 = astar(target_lvl, port[target_lvl], n['id'])
                    if p1 and p2:
                        valid = True
                        break
            if not valid: failures.append((n['id'], f"Cross floor L2->L{target_lvl} fail"))

print("Failures count:", len(failures))
if not failures:
    print("ALL independent floor segment routes are 100% functional and verified!")

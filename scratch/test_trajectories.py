import json
import heapq
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}
level_graphs = {1: {}, 2: {}, 3: {}}

for e in data['edges']:
    u = nodes.get(e['from'])
    v = nodes.get(e['to'])
    if u and v and u['level'] == v['level']:
        level_graphs[u['level']].setdefault(e['from'], []).append(e)

def astar(lvl, start, goal):
    adj = level_graphs[lvl]
    def h(a, b): return math.hypot(nodes[a]['coordinates']['x'] - nodes[b]['coordinates']['x'], nodes[a]['coordinates']['y'] - nodes[b]['coordinates']['y'])
    open_set = [(0, start)]
    came_from = {}
    g = {nid: float('inf') for nid in nodes if nodes[nid]['level'] == lvl}
    g[start] = 0
    while open_set:
        _, curr = heapq.heappop(open_set)
        if curr == goal:
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
                heapq.heappush(open_set, (tentative_g + h(nbr, goal), nbr))
    return []

test_routes = [
    ("n_totem_12", "n_lvl2_store_17", "Tótem -> Sfera (N1)"),
    ("n_totem_12", "n_lvl2_store_1", "Tótem -> Liverpool (N1)"),
    ("n_totem_12", "n_lvl2_store_37", "Tótem -> Sanborns (N1)"),
    ("n_totem_12", "n_lvl2_portal_esc_sears", "Tótem -> Escaleras Sears (hacia N2)"),
    ("n_lvl2_portal_esc_cinelia", "n_lvl3_store_3", "Escaleras Cinelia -> Cinelia (N2)")
]

for start, end, label in test_routes:
    lvl = nodes[start]['level']
    p = astar(lvl, start, end)
    print(f"\n--- {label} (Nivel {lvl}) ---")
    print(" -> ".join([nodes[x]['name'] for x in p]))

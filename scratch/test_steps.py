import json
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}
level_graphs = {1: {}, 2: {}, 3: {}}

for e in data['edges']:
    u = nodes.get(e['from'])
    v = nodes.get(e['to'])
    if u and v and u['level'] == v['level']:
        level_graphs[u['level']].setdefault(e['from'], []).append(e)

import heapq
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

# Test route: Totem -> Sfera
p = astar(2, "n_totem_12", "n_lvl2_store_17")
print(f"Totem -> Sfera path node count: {len(p)}")
for nid in p:
    n = nodes[nid]
    print(f"  {n['id']} ({n['coordinates']['x']}, {n['coordinates']['y']}): {n['name']} (ctx: {n.get('context_element')})")

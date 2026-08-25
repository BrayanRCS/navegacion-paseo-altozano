import json
import heapq
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))
nodes = {n['id']: n for n in data['nodes']}
adj = {}
for e in data['edges']:
    adj.setdefault(e['from'], []).append(e)

def astar(start, goal):
    def h(a, b):
        na, nb = nodes[a], nodes[b]
        dx = na['coordinates']['x'] - nb['coordinates']['x']
        dy = na['coordinates']['y'] - nb['coordinates']['y']
        floorDiff = abs(na['level'] - nb['level']) * 80
        return math.sqrt(dx*dx + dy*dy) + floorDiff

    open_set = [(0, start)]
    came_from = {}
    g_score = {n_id: float('inf') for n_id in nodes}
    g_score[start] = 0

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal:
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
                f = tentative_g + h(nbr, goal)
                heapq.heappush(open_set, (f, nbr))

    return []

# Test routes from Totem Punto 12 (Nivel 2) to all stores on Level 1, 2, 3
totem = "n_totem_12"
unreachable = []

for n in data['nodes']:
    if n['type'] in ('store', 'anchor_store', 'island', 'restroom'):
        path = astar(totem, n['id'])
        if not path:
            unreachable.append(n['id'])

print(f"Total destination targets tested: {len(data['nodes'])}")
if unreachable:
    print(f"FAILED: {len(unreachable)} unreachable nodes:", unreachable)
else:
    print("SUCCESS: 100% of stores, islands, and services are reachable from Tótem Punto 12 via A*!")

# Test specific cross-floor routes
test_cases = [
    ("n_totem_12", "n_lvl2_store_17", "Totem -> Sfera (Nivel 1)"),
    ("n_totem_12", "n_lvl1_store_1", "Totem -> Liverpool (Nivel PB)"),
    ("n_totem_12", "n_lvl3_store_3", "Totem -> Cinelia (Nivel 2)"),
    ("n_totem_12", "n_lvl3_store_2", "Totem -> GoKartManía (Nivel 2)"),
    ("n_totem_12", "n_lvl1_store_24", "Totem -> Crown City Casino (Nivel PB)")
]

for start, end, label in test_cases:
    p = astar(start, end)
    print(f"\n--- {label} ---")
    print(f"Steps ({len(p)}): " + " -> ".join([nodes[x].get('name') or nodes[x]['id'] for x in p]))

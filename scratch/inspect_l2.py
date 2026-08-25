import json
import math

data = json.load(open('mall_graph.json', encoding='utf-8'))

# Separate pure store / anchor / service / portal nodes
all_nodes_dict = {n['id']: n for n in data['nodes']}

# Let's inspect stores on Level 2 and their positions
stores_lvl2 = [n for n in data['nodes'] if n['level'] == 2 and n['type'] in ('store', 'anchor_store', 'restroom')]
islands_lvl2 = [n for n in data['nodes'] if n['level'] == 2 and n['type'] == 'island']
portals_lvl2 = [n for n in data['nodes'] if n['level'] == 2 and n['type'].startswith('portal_')]

print(f"L2: {len(stores_lvl2)} stores, {len(islands_lvl2)} islands, {len(portals_lvl2)} portals")

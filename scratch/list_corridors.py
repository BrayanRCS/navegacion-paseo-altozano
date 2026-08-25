import json

data = json.load(open('mall_graph.json', encoding='utf-8'))
for n in data['nodes']:
    if 'corridor' in n['id']:
        print(f"Level {n['level']}: {n['id']} ({n['coordinates']['x']}, {n['coordinates']['y']})")

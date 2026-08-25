import cv2
import json

data = json.load(open('mall_graph.json', encoding='utf-8'))

for n in data['nodes']:
    if n['type'] == 'island':
        print(f"Level {n['level']} Island: {n['id']} '{n['name']}' at ({n['coordinates']['x']}, {n['coordinates']['y']})")

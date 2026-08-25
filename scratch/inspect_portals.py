import cv2
import json

img1 = cv2.imread('planta-baja.png')
img2 = cv2.imread('planta-uno.png')
img3 = cv2.imread('planta-dos.png')

print("Dimensions:")
print("Planta Baja (L1):", img1.shape)
print("Planta Uno (L2):", img2.shape)
print("Planta Dos (L3):", img3.shape)

# Let's check what nodes currently exist for portals in mall_graph.json
data = json.load(open('mall_graph.json', encoding='utf-8'))
print("\nCurrent portal/elevator/escalator nodes in mall_graph.json:")
for n in data['nodes']:
    if 'portal' in n['id'] or 'esc' in n['id'] or 'elev' in n['id'] or n['type'].startswith('portal'):
        print(f"Level {n['level']}: {n['id']} -> {n['name']} at ({n['coordinates']['x']}, {n['coordinates']['y']})")

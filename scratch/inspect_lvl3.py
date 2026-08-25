import json
import cv2

det3 = json.load(open('scratch/detected_lvl3.json'))
print(f"Level 3 detected total: {len(det3)}")

# Print detected points sorted by x and y
for item in sorted(det3, key=lambda d: (d['y'], d['x'])):
    print(f"{item['type']}{item['idx']}: ({item['x']}, {item['y']})")

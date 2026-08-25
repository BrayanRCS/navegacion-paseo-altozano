import json
import cv2

# Let's inspect detected points with their crops and locations for Lvl 1
lvl1_crops = json.load(open('scratch/detected_lvl1.json'))
print(f"Lvl 1 total entries: {len(lvl1_crops)}")

# Print out specific entries to verify
for item in lvl1_crops:
    print(f"{item['type']}{item['idx']}: x={item['x']}, y={item['y']}")

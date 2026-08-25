import cv2
import numpy as np
import json

with open('mall_graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)

# 1. Background
bg_seed_mask = (gray > 240).astype(np.uint8) * 255
ff_mask = np.zeros((gray.shape[0] + 2, gray.shape[1] + 2), np.uint8)
bg_flood = bg_seed_mask.copy()
cv2.floodFill(bg_flood, ff_mask, (0, 0), 128)
cv2.floodFill(bg_flood, ff_mask, (gray.shape[1] - 1, 0), 128)
cv2.floodFill(bg_flood, ff_mask, (0, gray.shape[0] - 1), 128)
cv2.floodFill(bg_flood, ff_mask, (gray.shape[1] - 1, gray.shape[0] - 1), 128)
bg_mask = (bg_flood == 128)

# 2. Corridors with large morphological closing
corridor_raw = (gray >= 175) & (~bg_mask)
# Close all holes of size up to 45px
corridor_clean = cv2.morphologyEx(corridor_raw.astype(np.uint8)*255, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
corridor_clean = cv2.morphologyEx(corridor_clean, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))

# 3. Stores (all non-background, non-corridor)
store_raw = (~bg_mask) & (corridor_clean == 0)
store_clean = cv2.morphologyEx(store_raw.astype(np.uint8)*255, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))

# 4. Filtered Walls
canny = cv2.Canny(gray, 30, 90)
canny[bg_mask] = 0
canny[0:260, 0:300] = 0

for node in graph['nodes']:
    if node['level'] == 2:
        cx = int(node['coordinates']['x'])
        cy = int(node['coordinates']['y'])
        if cx > 280 or cy > 280:
            cv2.circle(canny, (cx, cy), 18, 0, -1)

num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(canny)
clean_walls = np.zeros(canny.shape, dtype=np.uint8)
for i in range(1, num_labels):
    w = stats[i, cv2.CC_STAT_WIDTH]
    h = stats[i, cv2.CC_STAT_HEIGHT]
    area = stats[i, cv2.CC_STAT_AREA]
    density = area / float(w * h) if (w * h) > 0 else 0
    if w > 35 and h < 50 and density > 0.16:
        continue
    diagonal = np.sqrt(w*w + h*h)
    if diagonal >= 40 and (w >= 28 or h >= 28):
        clean_walls[labels == i] = 255

# Render test canvas
test_canvas = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)
test_canvas[:] = [22, 13, 8]
test_canvas[corridor_clean > 0] = [36, 23, 16]
test_canvas[store_clean > 0] = [59, 41, 30]
test_canvas[clean_walls > 0] = [105, 80, 58]
test_canvas[bg_mask] = [22, 13, 8]

crop = test_canvas[350:550, 850:1100]
cv2.imwrite('scratch/crop_morph_test.png', crop)
print("Saved scratch/crop_morph_test.png!")

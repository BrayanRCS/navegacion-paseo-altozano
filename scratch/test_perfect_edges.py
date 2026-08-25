import cv2
import numpy as np
import json

with open('mall_graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)

canny = cv2.Canny(gray, 30, 90)
canny[0:260, 0:300] = 0

# Erase around all known node positions
for node in graph['nodes']:
    if node['level'] == 2:
        cx = int(node['coordinates']['x'])
        cy = int(node['coordinates']['y'])
        if cx > 280 or cy > 280:
            cv2.circle(canny, (cx, cy), 18, 0, -1)

# Detect and erase store logo text (like Chedraui, Sanborns, Liverpool)
# In original image, text logos have specific bounding boxes or dense gradient
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(canny)

clean_edges = np.zeros(canny.shape, dtype=np.uint8)

for i in range(1, num_labels):
    w = stats[i, cv2.CC_STAT_WIDTH]
    h = stats[i, cv2.CC_STAT_HEIGHT]
    area = stats[i, cv2.CC_STAT_AREA]
    density = area / float(w * h)
    
    # Store logos like Chedraui text have dense curly strokes (w > 50, h < 45, density > 0.18)
    if w > 40 and h < 50 and density > 0.16:
        continue
        
    diagonal = np.sqrt(w*w + h*h)
    if diagonal >= 40 and (w >= 28 or h >= 28):
        clean_edges[labels == i] = 255

crop_edges = clean_edges[350:550, 850:1100]
cv2.imwrite('scratch/crop_clean_edges_perfect.png', crop_edges)
print(f"Perfect edges saved: {np.sum(clean_edges > 0)} px")

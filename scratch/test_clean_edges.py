import cv2
import numpy as np

orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)

# Detect edges on original
canny = cv2.Canny(gray, 30, 90)
# Remove top-left legend
canny[0:260, 0:300] = 0

# Find connected components of edges
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(canny)
print(f"Total edge components: {num_labels}")

clean_edges = np.zeros(canny.shape, dtype=np.uint8)

for i in range(1, num_labels):
    w = stats[i, cv2.CC_STAT_WIDTH]
    h = stats[i, cv2.CC_STAT_HEIGHT]
    area = stats[i, cv2.CC_STAT_AREA]
    
    # Store numbers and circular badges are small (w < 35, h < 35, or area < 100)
    # Long walls have w >= 35 or h >= 35 or diagonal span >= 40
    diagonal = np.sqrt(w*w + h*h)
    if diagonal >= 45 and (w >= 30 or h >= 30):
        clean_edges[labels == i] = 255

# Check crop of clean_edges
crop_edges = clean_edges[350:550, 850:1100]
cv2.imwrite('scratch/crop_clean_edges_test.png', crop_edges)
print(f"Kept real walls count: {np.sum(clean_edges > 0)} pixels. Saved scratch/crop_clean_edges_test.png")

import cv2
import numpy as np

img = cv2.imread('planta-baja.png')

# Load the dict
exec(open('scratch/map_lvl1.py').read())

for k, (x, y) in lvl1_nodes.items():
    cv2.circle(img, (x, y), 8, (0, 255, 0), -1)
    cv2.circle(img, (x, y), 8, (0, 0, 0), 2)
    cv2.putText(img, k, (x+10, y+5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 2)
    cv2.putText(img, k, (x+10, y+5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

cv2.imwrite('scratch/check_lvl1.png', img)
print("Saved scratch/check_lvl1.png")

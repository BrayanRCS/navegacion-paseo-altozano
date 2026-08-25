import cv2
import numpy as np

orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)

# Find coordinates of dark pixels inside the crop around Sanborns/Chedraui (y: 350-550, x: 850-1100)
sub = gray[350:550, 850:1100]
print("Sub-image shape:", sub.shape)
print("Sub-image min:", sub.min(), "max:", sub.max(), "mean:", sub.mean())

# Find all dark pixels in sub-image
y_idx, x_idx = np.where(sub < 100)
print(f"Number of dark pixels in sub-image: {len(y_idx)}")
if len(y_idx) > 0:
    for i in range(min(10, len(y_idx))):
        print(f"Dark pixel at sub: (x={x_idx[i]}, y={y_idx[i]}), full: (x={850+x_idx[i]}, y={350+y_idx[i]}), value: {sub[y_idx[i], x_idx[i]]}")

import cv2
import numpy as np

orig = cv2.imread('planta-uno.png', cv2.IMREAD_UNCHANGED)
print("Alpha channel min/max/unique in planta-uno.png:")
a = orig[:, :, 3]
print("Unique alpha values:", np.unique(a))
print("Alpha > 0 percentage:", np.sum(a > 0) / a.size)

# If alpha channel is the true silhouette of the mall:
mall_silhouette = (a > 50)
print("Mall silhouette shape:", mall_silhouette.sum())

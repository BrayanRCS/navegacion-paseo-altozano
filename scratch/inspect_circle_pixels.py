import cv2
import numpy as np

orig = cv2.imread('planta-uno.png')
# Check pixel values around node 32 (x=916, y=628) and 33 (x=916, y=588)
crop_node32 = orig[618:638, 906:926]
print("Node 32 crop min/max/mean BGR:")
print("Min:", crop_node32.min(axis=(0,1)))
print("Max:", crop_node32.max(axis=(0,1)))
print("Mean:", crop_node32.mean(axis=(0,1)))

# Let's see unique colors or grayscale values in node 32
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
print("Gray values in crop 32:\n", gray[618:638, 906:926])

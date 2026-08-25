import cv2
import numpy as np

# Load original
orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)

# Let's inspect the crop of node 32 in gray
crop32 = gray[600:650, 900:950]
print("Min gray in node 32 crop:", crop32.min())
print("Max gray in node 32 crop:", crop32.max())

# Let's see: what if we simply detect ALL contours inside stores that are small (area < 2500) and fill them with the surrounding store color?
# Let's test filling all small contours directly:
gray_test = gray.copy()

# Binary threshold for anything that is not uniform background
_, thresh = cv2.threshold(gray_test, 230, 255, cv2.THRESH_BINARY_INV)

cnts, hier = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
print(f"Total contours found: {len(cnts)}")

# Draw all small contours solid in gray_test
for c in cnts:
    x, y, w, h = cv2.boundingRect(c)
    if x < 280 and y < 280:
        continue
    area = cv2.contourArea(c)
    if area < 3500 and w < 100 and h < 100:
        # Fill this contour with the median color of the surrounding store
        cv2.drawContours(gray_test, [c], -1, 138, -1)
        cv2.drawContours(orig, [c], -1, (46, 106, 223), -1)

# Check crop of node 32 after filling
crop32_after = orig[600:650, 900:950]
cv2.imwrite('scratch/crop32_after.png', crop32_after)
print("Saved scratch/crop32_after.png")

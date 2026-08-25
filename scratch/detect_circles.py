import cv2
import numpy as np

# Load original planta-uno.png
orig = cv2.imread('planta-uno.png')
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
hsv = cv2.cvtColor(orig, cv2.COLOR_BGR2HSV)
H, S, V = cv2.split(hsv)

# In the original, circular badges have distinct edges or high gradient circles
# Let's use HoughCircles or morphological filtering or connected components on gradient
edges = cv2.Canny(gray, 30, 100)
# Also detect all small circular contours
contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

mask_circles = np.zeros(gray.shape, dtype=np.uint8)

for cnt in contours:
    # Exclude top left legend
    x, y, w, h = cv2.boundingRect(cnt)
    if x < 280 and y < 280:
        continue
    
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt, True)
    if perimeter > 0:
        circularity = 4 * np.pi * (area / (perimeter * perimeter))
        # Circles or number boxes: w and h between 8 and 45 px
        if 8 <= w <= 45 and 8 <= h <= 45 and (area < 1500):
            cv2.drawContours(mask_circles, [cnt], -1, 255, -1)

# Also detect Hough circles
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=10, param1=50, param2=18, minRadius=5, maxRadius=22)
if circles is not None:
    circles = np.uint16(np.around(circles))
    for i in circles[0, :]:
        if i[0] < 280 and i[1] < 280:
            continue
        cv2.circle(mask_circles, (i[0], i[1]), i[2] + 4, 255, -1)

# Save mask crop
crop_mask = mask_circles[350:550, 850:1100]
cv2.imwrite('scratch/crop_detected_circles.png', crop_mask)
print("Detected circles mask saved!")

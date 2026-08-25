import cv2
import numpy as np

def find_blue_badges(img_path, floor_name):
    img = cv2.imread(img_path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Blue/cyan icons on the floor plans
    # Cyan/blue badge range
    lower_blue = np.array([90, 80, 80])
    upper_blue = np.array([130, 255, 255])
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    print(f"\n--- {floor_name} Blue/Cyan badges detected ({len(contours)}) ---")
    results = []
    for c in contours:
        area = cv2.contourArea(c)
        if 50 < area < 2000:
            x, y, w, h = cv2.boundingRect(c)
            cx, cy = int(x + w/2), int(y + h/2)
            results.append((cx, cy, w, h, area))
    
    results.sort(key=lambda r: r[0])
    for r in results:
        print(f"  Badge at ({r[0]}, {r[1]}), size: {r[2]}x{r[3]}, area: {r[4]}")
    return results

find_blue_badges('planta-baja.png', 'Planta Baja')
find_blue_badges('planta-uno.png', 'Planta Uno')
find_blue_badges('planta-dos.png', 'Planta Dos')

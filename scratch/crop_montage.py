import cv2
import numpy as np
import json
import os
from PIL import Image, ImageDraw, ImageFont

def process_level(lvl, img_path):
    img = cv2.imread(img_path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Masks
    mask_white = cv2.inRange(hsv, np.array([0, 0, 190]), np.array([180, 50, 255]))
    mask_cyan = cv2.inRange(hsv, np.array([75, 80, 80]), np.array([110, 255, 255]))
    
    # White circles
    contours_w, _ = cv2.findContours(mask_white, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    w_pts = []
    for c in contours_w:
        area = cv2.contourArea(c)
        if 40 < area < 1000:
            (x, y), radius = cv2.minEnclosingCircle(c)
            # Filter non-circular or legend boxes
            if 3.5 < radius < 20 and x > 150: # avoid top-left legend
                w_pts.append((int(x), int(y), int(radius)))
                
    # Cyan circles
    contours_c, _ = cv2.findContours(mask_cyan, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    c_pts = []
    for c in contours_c:
        area = cv2.contourArea(c)
        if 40 < area < 1000:
            (x, y), radius = cv2.minEnclosingCircle(c)
            if 3.5 < radius < 20 and x > 150:
                c_pts.append((int(x), int(y), int(radius)))
                
    # Deduplicate nearby points (< 8 px)
    def dedup(pts):
        res = []
        for p in pts:
            if not any(np.hypot(p[0]-r[0], p[1]-r[1]) < 8 for r in res):
                res.append(p)
        return res
        
    w_pts = dedup(w_pts)
    c_pts = dedup(c_pts)
    
    # Create composite crop montage to inspect
    crop_size = 32
    cols = 10
    total = len(w_pts) + len(c_pts)
    rows = (total + cols - 1) // cols
    montage = np.zeros((rows * (crop_size + 16), cols * (crop_size + 16), 3), dtype=np.uint8) + 40
    
    annotated_img = img.copy()
    
    entries = []
    for idx, (x, y, r) in enumerate(w_pts):
        x1, y1 = max(0, x - crop_size//2), max(0, y - crop_size//2)
        x2, y2 = min(img.shape[1], x + crop_size//2), min(img.shape[0], y + crop_size//2)
        crop = img[y1:y2, x1:x2]
        ch, cw = crop.shape[:2]
        
        r_idx = idx // cols
        c_idx = idx % cols
        py = r_idx * (crop_size + 16)
        px = c_idx * (crop_size + 16)
        montage[py:py+ch, px:px+cw] = crop
        cv2.putText(montage, f"W{idx}", (px, py + crop_size + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
        
        cv2.circle(annotated_img, (x, y), r, (0, 0, 255), 2)
        cv2.putText(annotated_img, f"W{idx}", (x+5, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)
        entries.append({'type': 'white', 'idx': idx, 'x': x, 'y': y})
        
    for cidx, (x, y, r) in enumerate(c_pts):
        idx = len(w_pts) + cidx
        x1, y1 = max(0, x - crop_size//2), max(0, y - crop_size//2)
        x2, y2 = min(img.shape[1], x + crop_size//2), min(img.shape[0], y + crop_size//2)
        crop = img[y1:y2, x1:x2]
        ch, cw = crop.shape[:2]
        
        r_idx = idx // cols
        c_idx = idx % cols
        py = r_idx * (crop_size + 16)
        px = c_idx * (crop_size + 16)
        montage[py:py+ch, px:px+cw] = crop
        cv2.putText(montage, f"C{cidx}", (px, py + crop_size + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
        
        cv2.circle(annotated_img, (x, y), r, (255, 255, 0), 2)
        cv2.putText(annotated_img, f"C{cidx}", (x+5, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
        entries.append({'type': 'cyan', 'idx': cidx, 'x': x, 'y': y})
        
    cv2.imwrite(f"scratch/montage_lvl{lvl}.png", montage)
    cv2.imwrite(f"scratch/annotated_lvl{lvl}.png", annotated_img)
    with open(f"scratch/detected_lvl{lvl}.json", "w") as f:
        json.dump(entries, f, indent=2)
    print(f"Level {lvl}: saved montage ({len(w_pts)} white, {len(c_pts)} cyan)")

for lvl, path in [(1, 'planta-baja.png'), (2, 'planta-uno.png'), (3, 'planta-dos.png')]:
    process_level(lvl, path)

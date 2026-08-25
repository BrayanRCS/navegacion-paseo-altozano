import cv2
import numpy as np
import json

with open('mall_graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

def clean_entire_numbers_and_text(src_path, dest_path, level_num, scale_factor=3):
    print(f"Completely erasing numbers and text for level {level_num}: {src_path}...")
    orig = cv2.imread(src_path, cv2.IMREAD_UNCHANGED)
    h_orig, w_orig = orig.shape[:2]
    
    if orig.shape[2] == 4:
        b, g, r, a = cv2.split(orig)
        bgr = cv2.merge([b, g, r])
    else:
        bgr = orig
        a = np.full((h_orig, w_orig), 255, dtype=np.uint8)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    # 1. Flood-fill from borders to get exact Exterior Background Mask
    bg_seed_mask = (gray > 240).astype(np.uint8) * 255
    ff_mask = np.zeros((h_orig + 2, w_orig + 2), np.uint8)
    bg_flood = bg_seed_mask.copy()
    cv2.floodFill(bg_flood, ff_mask, (0, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig - 1, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (0, h_orig - 1), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig - 1, h_orig - 1), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig // 2, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig // 2, h_orig - 1), 128)

    bg_mask_orig = (bg_flood == 128) | (a < 30)

    # 2. Corridors Mask
    corridor_mask_orig = (gray >= 180) & (~bg_mask_orig) & (a > 30)

    # 3. Mall Store Units
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)

    # 4. Total Inpainting of ALL numbers, circular badges, and store logos
    erase_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)

    # A) All node locations from mall_graph.json
    for node in graph['nodes']:
        if node['level'] == level_num:
            cx = int(node['coordinates']['x'])
            cy = int(node['coordinates']['y'])
            if cx > 280 or cy > 280:
                cv2.circle(erase_mask, (cx, cy), 28, 255, -1)

    # B) Hough Circles detection
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=6, param1=35, param2=13, minRadius=3, maxRadius=30)
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            if i[0] > 280 or i[1] > 280:
                cv2.circle(erase_mask, (i[0], i[1]), i[2] + 8, 255, -1)

    # C) Detect all non-corridor text and logos using morphological gradient / thresholding
    # Inside stores, any high gradient or dark/light text is selected
    grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    text_areas = (grad > 20) & store_mask_orig
    text_areas[0:260, 0:300] = False
    
    # Filter connected components to only select text/badges (not long walls)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(text_areas.astype(np.uint8))
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        # Text/badge clusters are compact
        if (w <= 85 and h <= 55 and area <= 2800) or (w <= 55 and h <= 85 and area <= 2800):
            erase_mask[labels == i] = 255

    # Dilate erase mask to guarantee full coverage
    erase_mask = cv2.dilate(erase_mask, np.ones((7, 7), np.uint8))
    erase_mask[bg_mask_orig] = 0

    # Inpaint the grayscale image completely
    gray_clean = cv2.inpaint(gray, erase_mask, inpaintRadius=11, flags=cv2.INPAINT_TELEA)

    # 5. Extract Architectural Walls (Pristine, Zero Numbers)
    canny_walls = cv2.Canny(gray_clean, 25, 75)
    canny_walls[bg_mask_orig] = 0
    canny_walls[0:260, 0:300] = 0
    canny_walls[erase_mask > 0] = 0

    # Extract clean building perimeter contours
    building_binary = ((~bg_mask_orig) & (a > 30)).astype(np.uint8) * 255
    building_binary[0:260, 0:300] = 0
    building_contours, _ = cv2.findContours(building_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)

    # 6. Ultra-HD Target Canvas (3x Scale)
    h_hd = int(h_orig * scale_factor)
    w_hd = int(w_orig * scale_factor)

    def upscale(m, blur_radius=3):
        m_u8 = (m.astype(np.uint8) * 255)
        up = cv2.resize(m_u8, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)
        if blur_radius > 0:
            up = cv2.GaussianBlur(up, (blur_radius, blur_radius), 0)
        return up

    bg_hd = upscale(bg_mask_orig, blur_radius=3)
    corridor_hd = upscale(corridor_mask_orig, blur_radius=3)
    store_hd = upscale(store_mask_orig, blur_radius=3)
    walls_hd = cv2.resize(canny_walls, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # Top-left legend
    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale(legend_mask, blur_radius=1)

    # 7. Render Pure Clean Google Maps Dark Theme Canvas
    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.uint8)
    hd_canvas[:] = [22, 13, 8]  # Exterior Background #080d16

    # Fill Corridors with clean dark navy #101724
    corridor_pixels = corridor_hd > 100
    hd_canvas[corridor_pixels] = [36, 23, 16]

    # Fill Stores with clean slate #1e293b
    store_pixels = (store_hd > 100) & (~corridor_pixels)
    hd_canvas[store_pixels] = [59, 41, 30]

    # Draw Anti-Aliased Building Outer Contours
    for cnt in building_contours:
        if cv2.contourArea(cnt) < 200:
            continue
        approx = cv2.approxPolyDP(cnt, epsilon=0.8, closed=True)
        cnt_hd = (approx.astype(np.float32) * scale_factor).astype(np.int32)
        cv2.polylines(hd_canvas, [cnt_hd], isClosed=True, color=(105, 80, 58), thickness=3, lineType=cv2.LINE_AA)

    # Draw Internal Partition Walls
    wall_pixels = walls_hd > 55
    hd_canvas[wall_pixels] = [105, 80, 58]

    # Draw Top-Left Legend
    legend_pixels = legend_hd > 90
    hd_canvas[legend_pixels] = [252, 250, 248]

    # Re-enforce Background
    bg_pixels = bg_hd > 120
    hd_canvas[bg_pixels] = [22, 13, 8]

    # Subtle Sharpening
    gaussian = cv2.GaussianBlur(hd_canvas, (0, 0), 0.8)
    unsharp = cv2.addWeighted(hd_canvas, 1.15, gaussian, -0.15, 0)
    unsharp[bg_pixels] = [22, 13, 8]
    unsharp[legend_pixels] = [254, 252, 250]

    alpha_hd = np.where(bg_pixels, 255, 255).astype(np.uint8)
    final_hd = cv2.merge([unsharp[:, :, 0], unsharp[:, :, 1], unsharp[:, :, 2], alpha_hd])

    cv2.imwrite(dest_path, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    print(f"Saved 100% Numberless Pristine Map: {dest_path}")

for f, lvl in [('planta-baja.png', 1), ('planta-uno.png', 2), ('planta-dos.png', 3)]:
    name_dark = f.replace('.png', '-dark.png')
    clean_entire_numbers_and_text(f, name_dark, lvl, scale_factor=3)

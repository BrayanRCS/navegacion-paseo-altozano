import cv2
import numpy as np
import json

with open('mall_graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

def render_final_numberless_map(src_path, dest_path, level_num, scale_factor=3):
    print(f"Generating Final Numberless Dark Map for Level {level_num}: {src_path} -> {dest_path}...")
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

    # 2. Corridors Mask with Morphological Hole Closing
    corridor_raw = (gray >= 175) & (~bg_mask_orig) & (a > 30)
    corridor_clean = cv2.morphologyEx(corridor_raw.astype(np.uint8)*255, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
    corridor_clean = cv2.morphologyEx(corridor_clean, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))

    # 3. Store Units with Morphological Hole Closing
    store_raw = (~bg_mask_orig) & (corridor_clean == 0) & (a > 30)
    store_clean = cv2.morphologyEx(store_raw.astype(np.uint8)*255, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))

    # 4. Extract Pristine Wall & Perimeter Contours (Zero text, zero numbers, zero circles)
    canny = cv2.Canny(gray, 30, 90)
    canny[bg_mask_orig] = 0
    canny[0:260, 0:300] = 0

    # Erase around all known store and island node positions
    for node in graph['nodes']:
        if node['level'] == level_num:
            cx = int(node['coordinates']['x'])
            cy = int(node['coordinates']['y'])
            if cx > 280 or cy > 280:
                cv2.circle(canny, (cx, cy), 18, 0, -1)

    # Filter connected components: remove small dots, numbers, and text logos
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(canny)
    clean_walls = np.zeros(canny.shape, dtype=np.uint8)

    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        density = area / float(w * h) if (w * h) > 0 else 0
        
        # Filter out text logo glyphs
        if w > 35 and h < 50 and density > 0.16:
            continue
            
        diagonal = np.sqrt(w*w + h*h)
        if diagonal >= 38 and (w >= 26 or h >= 26):
            clean_walls[labels == i] = 255

    # Extract clean outer building contour
    building_binary = ((~bg_mask_orig) & (a > 30)).astype(np.uint8) * 255
    building_binary[0:260, 0:300] = 0
    building_contours, _ = cv2.findContours(building_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)

    # 5. Ultra-HD Target Dimensions (3x Scale)
    h_hd = int(h_orig * scale_factor)
    w_hd = int(w_orig * scale_factor)

    def upscale(m, blur_radius=3):
        m_u8 = (m.astype(np.uint8) * 255)
        up = cv2.resize(m_u8, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)
        if blur_radius > 0:
            up = cv2.GaussianBlur(up, (blur_radius, blur_radius), 0)
        return up

    bg_hd = upscale(bg_mask_orig, blur_radius=3)
    corridor_hd = upscale(corridor_clean > 0, blur_radius=3)
    store_hd = upscale(store_clean > 0, blur_radius=3)
    walls_hd = cv2.resize(clean_walls, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # Top-left legend
    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale(legend_mask, blur_radius=1)

    # 6. Render Ultra-HD Google Maps Dark Palette Canvas
    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.uint8)
    hd_canvas[:] = [22, 13, 8]  # Exterior Background #080d16

    # Fill Corridors with clean dark navy #101724
    corridor_pixels = corridor_hd > 100
    hd_canvas[corridor_pixels] = [36, 23, 16]

    # Fill Stores with clean slate #1e293b
    store_pixels = (store_hd > 100) & (~corridor_pixels)
    hd_canvas[store_pixels] = [59, 41, 30]

    # Draw Anti-Aliased Outer Building Contours
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
    print(f"Final Numberless Map Complete: {dest_path}")

for f, lvl in [('planta-baja.png', 1), ('planta-uno.png', 2), ('planta-dos.png', 3)]:
    name_dark = f.replace('.png', '-dark.png')
    render_final_numberless_map(f, name_dark, lvl, scale_factor=3)

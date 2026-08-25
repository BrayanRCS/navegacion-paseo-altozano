import cv2
import numpy as np
import json

with open('mall_graph.json', 'r', encoding='utf-8') as f:
    graph = json.load(f)

def clean_floor_map_completely(src_path, dest_path, level_num, scale_factor=3):
    print(f"Cleaning floor map level {level_num}: {src_path}...")
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

    # 1. Background & Corridor & Store Masks
    bg_mask_orig = ((gray > 238) & (S < 30)) | (a < 30)
    corridor_mask_orig = (gray >= 165) & (gray <= 238) & (S < 35) & (~bg_mask_orig) & (a > 30)
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)
    anchor_mask_orig = store_mask_orig & (S > 35)

    # 2. Build Comprehensive Erase Mask for Numbers & Badges
    erase_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)

    # A) Erase at all store & island node locations
    for node in graph['nodes']:
        if node['level'] == level_num:
            cx = int(node['coordinates']['x'])
            cy = int(node['coordinates']['y'])
            # Don't erase top-left legend
            if cx < 280 and cy < 280:
                continue
            # Draw erase circle of radius 22 at every store / island location
            cv2.circle(erase_mask, (cx, cy), 22, 255, -1)

    # B) Hough Circles detection across the whole floor plan
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=10, param1=45, param2=16, minRadius=4, maxRadius=24)
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            if i[0] < 280 and i[1] < 280:
                continue
            cv2.circle(erase_mask, (i[0], i[1]), i[2] + 4, 255, -1)

    # C) Connected components of dark text / numbers inside stores
    dark_elements = (gray < 125) & (a > 30)
    dark_elements[0:260, 0:300] = False
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dark_elements.astype(np.uint8))
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        # Any text glyph or number badge of width < 55 and height < 55
        if (w <= 55 and h <= 55 and area < 1600):
            erase_mask[labels == i] = 255

    # Dilate erase mask slightly by 3px
    erase_mask = cv2.dilate(erase_mask, np.ones((5, 5), np.uint8), iterations=1)
    # Ensure exterior background and corridors are preserved
    erase_mask[bg_mask_orig] = 0

    # 3. Inpaint the grayscale map to remove all numbers
    gray_inpainted = cv2.inpaint(gray, erase_mask, inpaintRadius=7, flags=cv2.INPAINT_TELEA)

    # 4. Extract Vector Contours of Store Walls (Zero numbers)
    stores_clean = ((store_mask_orig | anchor_mask_orig) & (~bg_mask_orig)).astype(np.uint8) * 255
    stores_clean[0:260, 0:300] = 0
    # Morphological close to bridge any gaps from erased numbers
    stores_clean = cv2.morphologyEx(stores_clean, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(stores_clean, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    # Edge detection on inpainted image
    canny_edges = cv2.Canny(gray_inpainted, 30, 85)
    canny_edges[bg_mask_orig] = 0
    canny_edges[0:260, 0:300] = 0
    # Also mask out any remaining edges inside the erase_mask
    canny_edges[erase_mask > 0] = 0

    # 5. Ultra-HD Target Resolution (3x)
    h_hd = int(h_orig * scale_factor)
    w_hd = int(w_orig * scale_factor)

    def upscale_mask(m, blur_radius=3):
        m_u8 = (m.astype(np.uint8) * 255)
        up = cv2.resize(m_u8, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)
        if blur_radius > 0:
            up = cv2.GaussianBlur(up, (blur_radius, blur_radius), 0)
        return up

    bg_hd = upscale_mask(bg_mask_orig, blur_radius=3)
    corridor_hd = upscale_mask(corridor_mask_orig, blur_radius=3)
    store_hd = upscale_mask(store_mask_orig, blur_radius=3)
    anchor_hd = upscale_mask(anchor_mask_orig, blur_radius=3)

    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale_mask(legend_mask, blur_radius=1)

    canny_hd = cv2.resize(canny_edges, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # 6. Render Ultra-HD Canvas
    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.float32)
    hd_canvas[:] = [22, 13, 8]  # Exterior Background #080d16

    c_weight = (corridor_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - c_weight) + np.array([36, 23, 16], dtype=np.float32) * c_weight

    s_weight = (store_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - s_weight) + np.array([59, 41, 30], dtype=np.float32) * s_weight

    a_weight = (anchor_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - a_weight) + np.array([68, 50, 36], dtype=np.float32) * a_weight

    hd_canvas_u8 = np.clip(hd_canvas, 0, 255).astype(np.uint8)

    # Draw Anti-Aliased Outer & Inner Contours
    for cnt in contours:
        approx = cv2.approxPolyDP(cnt, epsilon=0.8, closed=True)
        cnt_hd = (approx.astype(np.float32) * scale_factor).astype(np.int32)
        cv2.polylines(hd_canvas_u8, [cnt_hd], isClosed=True, color=(105, 80, 58), thickness=3, lineType=cv2.LINE_AA)

    # Draw partition wall edges
    edge_mask = canny_hd > 55
    hd_canvas_u8[edge_mask] = [105, 80, 58]

    # Draw Top-Left Legend
    legend_sharp = legend_hd > 90
    hd_canvas_u8[legend_sharp] = [252, 250, 248]

    # Enforce clean exterior background
    bg_sharp = bg_hd > 120
    hd_canvas_u8[bg_sharp] = [22, 13, 8]

    # Subtle sharpening for crisp edges
    gaussian = cv2.GaussianBlur(hd_canvas_u8, (0, 0), 0.9)
    unsharp_hd = cv2.addWeighted(hd_canvas_u8, 1.15, gaussian, -0.15, 0)
    unsharp_hd[bg_sharp] = [22, 13, 8]
    unsharp_hd[legend_sharp] = [254, 252, 250]

    alpha_hd = np.where(bg_sharp, 255, 255).astype(np.uint8)
    final_hd = cv2.merge([unsharp_hd[:, :, 0], unsharp_hd[:, :, 1], unsharp_hd[:, :, 2], alpha_hd])

    cv2.imwrite(dest_path, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    print(f"Successfully generated pristine clean map: {dest_path}")

clean_floor_map_completely('planta-baja.png', 'planta-baja-dark.png', 1, scale_factor=3)
clean_floor_map_completely('planta-uno.png', 'planta-uno-dark.png', 2, scale_factor=3)
clean_floor_map_completely('planta-dos.png', 'planta-dos-dark.png', 3, scale_factor=3)

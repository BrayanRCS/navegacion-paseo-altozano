import cv2
import numpy as np

def build_pure_vector_maps(src_path, dest_path, scale_factor=3):
    print(f"Building pure vector map without number artifacts for {src_path}...")
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

    # 1. Background & Corridor Masks
    bg_mask_orig = ((gray > 238) & (S < 30)) | (a < 30)
    corridor_mask_orig = (gray >= 165) & (gray <= 238) & (S < 35) & (~bg_mask_orig) & (a > 30)

    # 2. Store binary mask with ALL number holes completely filled solid
    stores_binary = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)
    stores_u8 = stores_binary.astype(np.uint8) * 255
    stores_u8[0:260, 0:300] = 0

    # Fill all internal holes (store numbers, text holes)
    cnts, hierarchy = cv2.findContours(stores_u8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is not None:
        for i, c in enumerate(cnts):
            # If internal hole with area < 5000 px, fill it solid
            if hierarchy[0][i][3] != -1 and cv2.contourArea(c) < 5000:
                cv2.drawContours(stores_u8, [c], -1, 255, -1)

    # Morphological close to ensure solid store blocks
    stores_solid = cv2.morphologyEx(stores_u8, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))

    # 3. Find only true outer store contours (Zero hole contours!)
    contours, hierarchy = cv2.findContours(stores_solid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)

    # 4. Extract Real Internal Partition Walls (Filter out all small circle edges)
    # Detect all small circle/badge locations to erase from edge map
    badge_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=8, param1=40, param2=15, minRadius=4, maxRadius=26)
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            if i[0] > 280 or i[1] > 280:
                cv2.circle(badge_mask, (i[0], i[1]), i[2] + 6, 255, -1)

    # Also detect text blobs
    text_blobs = (gray < 130) & (a > 30)
    text_blobs[0:260, 0:300] = False
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(text_blobs.astype(np.uint8))
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        if (w <= 60 and h <= 60 and area < 2000):
            badge_mask[labels == i] = 255
    badge_mask = cv2.dilate(badge_mask, np.ones((7, 7), np.uint8))

    # Canny edges on original, with all badges erased
    canny = cv2.Canny(gray, 30, 90)
    canny[bg_mask_orig] = 0
    canny[0:260, 0:300] = 0
    canny[badge_mask > 0] = 0

    # Keep only line segments with length >= 12 px (true partition walls)
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 1))
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 7))
    walls_h = cv2.morphologyEx(canny, cv2.MORPH_OPEN, kernel_h)
    walls_v = cv2.morphologyEx(canny, cv2.MORPH_OPEN, kernel_v)
    real_walls = cv2.bitwise_or(walls_h, walls_v)
    real_walls = cv2.dilate(real_walls, np.ones((2, 2), np.uint8))

    # 5. Target Ultra-HD Canvas
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
    store_hd = upscale(stores_solid > 0, blur_radius=3)
    walls_hd = cv2.resize(real_walls, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # Top-left legend
    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale(legend_mask, blur_radius=1)

    # 6. Render Ultra-HD Canvas with Google Maps Dark Palette
    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.uint8)
    hd_canvas[:] = [22, 13, 8]  # Exterior #080d16

    # Fill Corridors with flat #101724
    corridor_pixels = corridor_hd > 100
    hd_canvas[corridor_pixels] = [36, 23, 16]

    # Fill Stores with flat #1e293b
    store_pixels = (store_hd > 100) & (~corridor_pixels)
    hd_canvas[store_pixels] = [59, 41, 30]

    # 7. Draw Clean Anti-Aliased Store & Building Perimeter Contours
    for cnt in contours:
        # Filter out tiny residual specks
        if cv2.contourArea(cnt) < 150:
            continue
        approx = cv2.approxPolyDP(cnt, epsilon=0.8, closed=True)
        cnt_hd = (approx.astype(np.float32) * scale_factor).astype(np.int32)
        cv2.polylines(hd_canvas, [cnt_hd], isClosed=True, color=(105, 80, 58), thickness=3, lineType=cv2.LINE_AA)

    # Draw Internal Partition Walls
    wall_pixels = walls_hd > 60
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
    print(f"Saved Pure Vector Map: {dest_path}")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    name_dark = f.replace('.png', '-dark.png')
    build_pure_vector_maps(f, name_dark, scale_factor=3)

import cv2
import numpy as np

def build_perfect_clean_dark_map(src_path, dest_path, scale_factor=3):
    print(f"Building 100% perfect clean map (No numbers, no shadows) for {src_path}...")
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
    # White background in original is near 255
    bg_seed_mask = (gray > 240).astype(np.uint8) * 255
    # Flood-fill from top-left (0,0), top-right (w-1, 0), bottom-left (0, h-1), bottom-right (w-1, h-1)
    ff_mask = np.zeros((h_orig + 2, w_orig + 2), np.uint8)
    bg_flood = bg_seed_mask.copy()
    cv2.floodFill(bg_flood, ff_mask, (0, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig - 1, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (0, h_orig - 1), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig - 1, h_orig - 1), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig // 2, 0), 128)
    cv2.floodFill(bg_flood, ff_mask, (w_orig // 2, h_orig - 1), 128)

    bg_mask_orig = (bg_flood == 128) | (a < 30)

    # 2. Corridors Mask (open walkway areas between stores)
    # Corridors in original are light gray/white paths inside the mall
    corridor_mask_orig = (gray >= 180) & (~bg_mask_orig) & (a > 30)

    # 3. Mall Store Units (everything inside mall that is not background and not open corridors)
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)

    # 4. Inpaint ALL numbers, circular badges, and text logos from the original image
    # Detect all dark text, digits, and circle borders
    dark_elements = (gray < 115) & (~bg_mask_orig) & (a > 30)
    dark_elements[0:260, 0:300] = False  # Keep top-left legend icons

    # Also detect all Hough circles
    circle_erase = np.zeros((h_orig, w_orig), dtype=np.uint8)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=8, param1=40, param2=15, minRadius=4, maxRadius=26)
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            if i[0] > 280 or i[1] > 280:
                cv2.circle(circle_erase, (i[0], i[1]), i[2] + 4, 255, -1)

    # Find connected components of dark elements (letters, numbers)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dark_elements.astype(np.uint8))
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        # Any text/number character of bounding box <= 65x65 px and area <= 2200 px
        if (w <= 65 and h <= 65 and area <= 2200):
            circle_erase[labels == i] = 255

    # Dilate circle erase mask slightly
    circle_erase = cv2.dilate(circle_erase, np.ones((5, 5), np.uint8))
    circle_erase[bg_mask_orig] = 0

    # Inpaint the BGR image directly so that store colors fill over the numbers seamlessly!
    bgr_clean = cv2.inpaint(bgr, circle_erase, inpaintRadius=9, flags=cv2.INPAINT_TELEA)
    gray_clean = cv2.cvtColor(bgr_clean, cv2.COLOR_BGR2GRAY)

    # 5. Extract ONLY Real Architectural Walls (from the clean inpainted image)
    # Detect sharp wall lines
    canny_walls = cv2.Canny(gray_clean, 25, 75)
    canny_walls[bg_mask_orig] = 0
    canny_walls[0:260, 0:300] = 0
    canny_walls[circle_erase > 0] = 0

    # Extract building perimeter contours
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

    # 7. Render Pristine Ultra-HD Canvas (Google Maps Dark Mode)
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
    print(f"Saved 100% Perfect Clean Map: {dest_path}")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    name_dark = f.replace('.png', '-dark.png')
    build_perfect_clean_dark_map(f, name_dark, scale_factor=3)

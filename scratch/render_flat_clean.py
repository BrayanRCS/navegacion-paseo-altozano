import cv2
import numpy as np

def generate_vector_flat_clean_map(src_path, dest_path, scale_factor=3):
    print(f"Generating 100% Flat Vector Clean Map for {src_path}...")
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

    # 1. Background Mask
    bg_mask_orig = ((gray > 238) & (S < 30)) | (a < 30)
    
    # 2. Corridors
    corridor_mask_orig = (gray >= 165) & (gray <= 238) & (S < 35) & (~bg_mask_orig) & (a > 30)

    # 3. Stores
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)
    anchor_mask_orig = store_mask_orig & (S > 35)

    # 4. Extract Vector Contours of Stores & Anchors
    stores_binary = ((store_mask_orig | anchor_mask_orig) & (~bg_mask_orig)).astype(np.uint8) * 255
    stores_binary[0:260, 0:300] = 0
    # Clean morphological closing to smooth edges
    stores_binary = cv2.morphologyEx(stores_binary, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    contours, hierarchy = cv2.findContours(stores_binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    # Detect only long real partition walls (remove small circle edges)
    canny = cv2.Canny(gray, 30, 90)
    canny[bg_mask_orig] = 0
    canny[0:260, 0:300] = 0
    # Remove small circular edges using morphology
    # Long walls survive line structuring elements
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 1))
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
    walls_h = cv2.morphologyEx(canny, cv2.MORPH_OPEN, kernel_h)
    walls_v = cv2.morphologyEx(canny, cv2.MORPH_OPEN, kernel_v)
    long_walls = cv2.bitwise_or(walls_h, walls_v)
    long_walls = cv2.dilate(long_walls, np.ones((2, 2), np.uint8))

    # 5. Target Ultra-HD Canvas
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
    walls_hd = cv2.resize(long_walls, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # Top-left legend
    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale_mask(legend_mask, blur_radius=1)

    # 6. Render 100% Flat Colors (Zero residual badge shadows!)
    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.uint8)
    hd_canvas[:] = [22, 13, 8]  # Exterior #080d16

    # Fill Corridors with flat #101724
    corridor_pixels = corridor_hd > 100
    hd_canvas[corridor_pixels] = [36, 23, 16]

    # Fill Stores with flat #1e293b
    store_pixels = (store_hd > 100) & (~corridor_pixels)
    hd_canvas[store_pixels] = [59, 41, 30]

    # Fill Anchors with flat #243244
    anchor_pixels = (anchor_hd > 100) & (~corridor_pixels)
    hd_canvas[anchor_pixels] = [68, 50, 36]

    # 7. Draw Clean Anti-Aliased Vector Contours
    for cnt in contours:
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
    print(f"Saved 100% Flat Clean Vector Map: {dest_path}")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    name_dark = f.replace('.png', '-dark.png')
    generate_vector_flat_clean_map(f, name_dark, scale_factor=3)

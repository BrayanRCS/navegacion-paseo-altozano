import cv2
import numpy as np

def build_pristine_architectural_maps(src_path, dest_path, scale_factor=3):
    print(f"Building pristine architectural map (Zero numbers/badges) for {src_path}...")
    
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

    # 3. Store Footprints
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)
    anchor_mask_orig = store_mask_orig & (S > 35)

    # 4. Inpaint / Remove all small number badges, circles, and text glyphs
    # In original, numbers/circles are dark pixels (gray < 110)
    dark_elements = (gray < 110) & (a > 30)
    # Exclude top-left legend from number removal
    dark_elements[0:260, 0:300] = False

    # Find connected components of dark elements
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dark_elements.astype(np.uint8))
    
    # Create mask of numbers/badges to erase
    erase_mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        
        # Store number badges and circular icons typically have width < 35 and height < 35
        # or area < 900 px
        if (w <= 36 and h <= 36 and area < 850) or (w <= 42 and h <= 28 and area < 650):
            erase_mask[labels == i] = 255

    # Dilate erase mask slightly by 2px to ensure circle borders are fully covered
    erase_mask = cv2.dilate(erase_mask, np.ones((5, 5), np.uint8))

    # Inpaint the grayscale image to remove numbers from edge detection
    gray_clean = cv2.inpaint(gray, erase_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

    # 5. High-Definition Target Canvas
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

    # Top-left legend
    legend_mask = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)
    legend_hd = upscale_mask(legend_mask, blur_radius=1)

    # 6. Extract Pure Architectural Contours & Walls (Clean of any numbers)
    # Binary stores mask without number holes
    stores_clean = ((store_mask_orig | anchor_mask_orig) & (~bg_mask_orig)).astype(np.uint8) * 255
    stores_clean[0:260, 0:300] = 0
    # Morphological close to bridge any gaps from erased numbers
    stores_clean = cv2.morphologyEx(stores_clean, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    contours, _ = cv2.findContours(stores_clean, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    # Canny on the inpainted image (Zero number edges!)
    canny_edges = cv2.Canny(gray_clean, 25, 80)
    canny_edges[bg_mask_orig] = 0
    canny_edges[0:260, 0:300] = 0
    # Remove any residual small dots
    canny_clean = cv2.morphologyEx(canny_edges, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    canny_hd = cv2.resize(canny_clean, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # 7. Render Pristine Ultra-HD Canvas (Google Maps Dark Mode)
    # Exterior: #080d16 -> (22, 13, 8)
    # Corridors: #101724 -> (36, 23, 16)
    # Stores: #1e293b -> (59, 41, 30)
    # Anchor Stores: #243244 -> (68, 50, 36)
    # Wall Lines: #384d66 -> (102, 77, 56) with sub-pixel anti-aliasing

    hd_canvas = np.zeros((h_hd, w_hd, 3), dtype=np.float32)
    hd_canvas[:] = [22, 13, 8]  # Exterior

    # Blend Corridors
    c_weight = (corridor_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - c_weight) + np.array([36, 23, 16], dtype=np.float32) * c_weight

    # Blend Stores
    s_weight = (store_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - s_weight) + np.array([59, 41, 30], dtype=np.float32) * s_weight

    # Blend Anchors
    a_weight = (anchor_hd / 255.0)[:, :, None]
    hd_canvas = hd_canvas * (1.0 - a_weight) + np.array([68, 50, 36], dtype=np.float32) * a_weight

    hd_canvas_u8 = np.clip(hd_canvas, 0, 255).astype(np.uint8)

    # Draw Smooth Anti-Aliased Outer & Inner Contours
    for cnt in contours:
        approx = cv2.approxPolyDP(cnt, epsilon=0.8, closed=True)
        cnt_hd = (approx.astype(np.float32) * scale_factor).astype(np.int32)
        cv2.polylines(hd_canvas_u8, [cnt_hd], isClosed=True, color=(105, 80, 58), thickness=3, lineType=cv2.LINE_AA)

    # Draw internal partition walls with sub-pixel anti-aliasing
    edge_mask = canny_hd > 55
    hd_canvas_u8[edge_mask] = [105, 80, 58]

    # Draw Top-Left Legend
    legend_sharp = legend_hd > 90
    hd_canvas_u8[legend_sharp] = [252, 250, 248]

    # Enforce clean exterior background
    bg_sharp = bg_hd > 120
    hd_canvas_u8[bg_sharp] = [22, 13, 8]

    # Subtle sharpening for clean lines
    gaussian = cv2.GaussianBlur(hd_canvas_u8, (0, 0), 0.9)
    unsharp_hd = cv2.addWeighted(hd_canvas_u8, 1.15, gaussian, -0.15, 0)
    unsharp_hd[bg_sharp] = [22, 13, 8]
    unsharp_hd[legend_sharp] = [254, 252, 250]

    alpha_hd = np.where(bg_sharp, 255, 255).astype(np.uint8)
    final_hd = cv2.merge([unsharp_hd[:, :, 0], unsharp_hd[:, :, 1], unsharp_hd[:, :, 2], alpha_hd])

    cv2.imwrite(dest_path, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    print(f"Saved pristine map without numbers: {dest_path}")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    name_dark = f.replace('.png', '-dark.png')
    build_pristine_architectural_maps(f, name_dark, scale_factor=3)

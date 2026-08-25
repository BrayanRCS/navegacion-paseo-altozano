import cv2
import numpy as np

def render_ultra_hd_clean_map(src_path, dest_path, scale_factor=3):
    print(f"Rendering Clean Minimalist Map (No Store Numbers) for {src_path}...")
    
    # 1. Load original image
    orig = cv2.imread(src_path, cv2.IMREAD_UNCHANGED)
    h_orig, w_orig = orig.shape[:2]
    
    if orig.shape[2] == 4:
        b, g, r, a = cv2.split(orig)
        bgr = cv2.merge([b, g, r])
    else:
        bgr = orig
        a = np.full((h_orig, w_orig), 255, dtype=np.uint8)

    # 2. Extract semantic segmentation masks on original resolution
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    # Masks:
    # A) Background (Exterior outside mall)
    bg_mask_orig = ((gray > 238) & (S < 30)) | (a < 30)
    
    # B) Corridors / Walkways (open pedestrian areas)
    corridor_mask_orig = (gray >= 165) & (gray <= 238) & (S < 35) & (~bg_mask_orig) & (a > 30)

    # C) Store Footprints (all retail units, whether dark, beige, or colored in original)
    store_mask_orig = (~bg_mask_orig) & (~corridor_mask_orig) & (a > 30)

    # D) Anchor Stores
    anchor_mask_orig = store_mask_orig & (S > 35)

    # E) Top-left Legend Box (preserve legend icons if desirable, e.g. x < 250, y < 250)
    # Legend icons in top left:
    legend_mask_orig = np.zeros((h_orig, w_orig), dtype=bool)
    legend_mask_orig[0:260, 0:300] = (gray[0:260, 0:300] < 90) & (a[0:260, 0:300] > 30)

    # 3. High-Definition Target Canvas (4608 x 2154 for 1536x718)
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
    legend_hd = upscale_mask(legend_mask_orig, blur_radius=1)

    # 4. Extract Vector Contours of Store Walls and Building Footprints
    stores_binary = ((store_mask_orig | anchor_mask_orig) & (~bg_mask_orig)).astype(np.uint8) * 255
    # Remove top-left legend area from contours
    stores_binary[0:260, 0:300] = 0
    contours, hierarchy = cv2.findContours(stores_binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)

    # Detect sharp internal partition walls
    canny_edges = cv2.Canny(gray, 30, 95)
    canny_edges[bg_mask_orig] = 0
    canny_edges[0:260, 0:300] = 0
    canny_hd = cv2.resize(canny_edges, (w_hd, h_hd), interpolation=cv2.INTER_LANCZOS4)

    # 5. Initialize Ultra-HD Canvas with Google Maps Dark Palette (BGR)
    # Exterior: #080d16 -> (22, 13, 8)
    # Corridors: #101724 -> (36, 23, 16)
    # Stores: #1e293b -> (59, 41, 30)
    # Anchor Stores: #243244 -> (68, 50, 36)
    # Wall Lines: #384d66 -> (102, 77, 56) with sub-pixel anti-aliasing
    # Legend Text: #f8fafc -> (252, 250, 248)

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

    # 6. Re-Draw Crisp Sub-Pixel Vectorized Contours and Walls (Anti-Aliased)
    hd_canvas_u8 = np.clip(hd_canvas, 0, 255).astype(np.uint8)

    # Smooth & Draw each contour at scale
    for cnt in contours:
        approx = cv2.approxPolyDP(cnt, epsilon=0.7, closed=True)
        cnt_hd = (approx.astype(np.float32) * scale_factor).astype(np.int32)
        cv2.polylines(hd_canvas_u8, [cnt_hd], isClosed=True, color=(105, 80, 58), thickness=3, lineType=cv2.LINE_AA)

    # Draw partition wall edges with sub-pixel anti-aliasing
    edge_mask = canny_hd > 55
    hd_canvas_u8[edge_mask] = [105, 80, 58]

    # 7. Draw Top-Left Legend Text & Icons (Clean and Crisp)
    legend_sharp = legend_hd > 90
    hd_canvas_u8[legend_sharp] = [252, 250, 248]

    # Re-enforce exterior background
    bg_sharp = bg_hd > 120
    hd_canvas_u8[bg_sharp] = [22, 13, 8]

    # Soft Unsharp Mask for maximum Vector clarity
    gaussian = cv2.GaussianBlur(hd_canvas_u8, (0, 0), 1.0)
    unsharp_hd = cv2.addWeighted(hd_canvas_u8, 1.2, gaussian, -0.2, 0)
    unsharp_hd[bg_sharp] = [22, 13, 8]
    unsharp_hd[legend_sharp] = [254, 252, 250]

    # Create Alpha channel
    alpha_hd = np.where(bg_sharp, 255, 255).astype(np.uint8)
    final_hd = cv2.merge([unsharp_hd[:, :, 0], unsharp_hd[:, :, 1], unsharp_hd[:, :, 2], alpha_hd])

    cv2.imwrite(dest_path, final_hd, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    print(f"Successfully generated clean map without numbers: {dest_path} ({w_hd}x{h_hd})")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    name_dark = f.replace('.png', '-dark.png')
    render_ultra_hd_clean_map(f, name_dark, scale_factor=3)

import cv2
import numpy as np

def transform_to_google_maps_dark(img_path, output_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    h, w = img.shape[:2]
    has_alpha = img.shape[2] == 4
    
    if has_alpha:
        b, g, r, a = cv2.split(img)
        bgr = cv2.merge([b, g, r])
    else:
        bgr = img
        a = np.full((h, w), 255, dtype=np.uint8)

    # Convert to HSV and Grayscale for segmentation
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    
    # Analyze brightness and saturation
    H, S, V = cv2.split(hsv)

    # Google Maps Dark Palette (BGR format for OpenCV)
    # Background outside mall: Deep dark navy (#090e17) -> BGR: (23, 14, 9)
    # Corridors: Dark blue-slate (#141e2c) -> BGR: (44, 30, 20)
    # Stores (standard units): Slate dark (#1e293b) -> BGR: (59, 41, 30)
    # Store borders/walls: Crisp slate (#334155) -> BGR: (85, 65, 51)
    # Text / Numbers: Crisp light slate/white (#e2e8f0) -> BGR: (240, 232, 226)

    # Create the new stylized canvas
    result_bgr = np.zeros_like(bgr)

    # 1. Background Mask: very light/white pixels in the original (usually background or light corridors)
    # In the original, white/near-white (V > 235 and S < 30) is the background / exterior
    is_white_bg = (V > 230) & (S < 35) & (a > 50)
    is_transparent = (a <= 50)

    # 2. Text / Lines Mask: very dark pixels in original (V < 75)
    is_text_or_lines = (V < 80) & (a > 50)

    # 3. Colored features (Anchor stores, colored badges, logos)
    is_saturated_color = (S > 50) & (V > 60) & (a > 50)

    # 4. Standard Store / Floor fills (intermediate brightness)
    is_store_fill = (~is_white_bg) & (~is_text_or_lines) & (~is_saturated_color) & (a > 50)

    # Apply Google Maps Dark styling:
    # A) Base exterior background
    result_bgr[:] = [23, 14, 9]  # #090e17

    # B) Store footprints (dark slate #1e293b)
    result_bgr[is_store_fill] = [52, 38, 28]  # #1c2634

    # C) Corridors / walkways (slightly darker tone #131d2a)
    # Detect open walkway areas
    corridor_mask = (V > 180) & (V <= 230) & (S < 40) & (a > 50)
    result_bgr[corridor_mask] = [40, 26, 17] # #111a28

    # D) Saturated / Accent areas (Anchor stores) - preserve hue but adjust for dark mode elegance
    # Mute brightness and blend with dark theme
    hsv_colored = hsv.copy()
    hsv_colored[:, :, 2] = np.clip(hsv_colored[:, :, 2] * 0.65, 30, 160).astype(np.uint8) # lower brightness
    hsv_colored[:, :, 1] = np.clip(hsv_colored[:, :, 1] * 0.85, 40, 220).astype(np.uint8) # balanced saturation
    bgr_colored = cv2.cvtColor(hsv_colored, cv2.COLOR_HSV2BGR)
    result_bgr[is_saturated_color] = bgr_colored[is_saturated_color]

    # E) Store borders and walls - edge detection on the original
    edges = cv2.Canny(gray, 40, 120)
    # Dilate edges slightly for crisp visibility
    kernel = np.ones((2, 2), np.uint8)
    edges_dilated = cv2.dilate(edges, kernel, iterations=1)
    result_bgr[edges_dilated > 0] = [85, 65, 51]  # #334155 (crisp slate wall lines)

    # F) Text and store numbers - invert dark text to crisp, luminous off-white/light blue (#e2e8f0)
    result_bgr[is_text_or_lines] = [235, 225, 215]  # Crisp high contrast white/light slate text

    # G) Edge smoothing & contrast enhancement
    # Blend with subtle bilateral filter for sleek Vector-like finish
    smoothed = cv2.bilateralFilter(result_bgr, 5, 50, 50)

    # Re-apply text and borders sharply over smoothed base
    smoothed[is_text_or_lines] = [242, 235, 228]
    smoothed[edges_dilated > 0] = [95, 75, 60]

    # Preserve alpha channel
    out_alpha = np.where(is_transparent, 0, 255).astype(np.uint8)
    final_img = cv2.merge([smoothed[:, :, 0], smoothed[:, :, 1], smoothed[:, :, 2], out_alpha])

    cv2.imwrite(output_path, final_img)
    print(f"Generated {output_path} ({w}x{h})")

transform_to_google_maps_dark('planta-uno.png', 'scratch/dark_planta_uno.png')
transform_to_google_maps_dark('planta-baja.png', 'scratch/dark_planta_baja.png')
transform_to_google_maps_dark('planta-dos.png', 'scratch/dark_planta_dos.png')

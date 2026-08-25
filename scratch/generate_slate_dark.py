import cv2
import numpy as np

def create_google_maps_dark_slate_theme(img_path, output_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    h, w = img.shape[:2]
    
    if img.shape[2] == 4:
        b, g, r, a = cv2.split(img)
        bgr = cv2.merge([b, g, r])
    else:
        bgr = img
        a = np.full((h, w), 255, dtype=np.uint8)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    # 1. Background Mask: White/near-white outer area in original
    bg_mask = (gray > 238) & (S < 30)

    # 2. Text, Numbers, Fine Lines (Dark in original)
    text_mask = (gray < 85) & (a > 30)

    # 3. Wall Lines / Outlines
    outline_mask = (gray >= 85) & (gray < 165) & (S < 40) & (a > 30)

    # 4. Corridors / Walkways
    corridor_mask = (gray >= 165) & (gray <= 238) & (S < 35) & (~bg_mask) & (a > 30)

    # 5. Cyan badges / Islands in original
    # In original, cyan is H around 85-100 in OpenCV (170-200 in 360deg)
    cyan_badge_mask = (H >= 80) & (H <= 110) & (S > 40) & (V > 80) & (a > 30)

    # 6. Store Units (all retail stores, anchor stores, etc.)
    store_mask = (~bg_mask) & (~corridor_mask) & (~text_mask) & (a > 30)

    # Clean Google Maps Dark Palette (BGR):
    # - Exterior Background: #0a0f18 -> (24, 15, 10)
    # - Corridors / Walkways: #101724 -> (36, 23, 16)
    # - Store Units (Cool Slate-Gray): #1e293b -> (59, 41, 30) in RGB, so in BGR it's (59, 41, 30)
    #   Wait! Hex #1e293b is R=30, G=41, B=59. In BGR order, B=59, G=41, R=30!
    # - Large Anchor Stores (Liverpool, Sears, etc.): #253346 (BGR: 70, 51, 37)
    # - Walls / Unit Borders: #334155 (BGR: 85, 65, 51)
    # - Crisp Text & Numbers: #f8fafc (BGR: 252, 250, 248)
    # - Cyan Island Badges: #0284c7 (BGR: 199, 132, 2) with white text

    dark_canvas = np.zeros((h, w, 3), dtype=np.uint8)

    # 1. Fill Exterior
    dark_canvas[:] = [24, 15, 10]  # #0a0f18

    # 2. Fill Corridors (Deep Navy)
    dark_canvas[corridor_mask] = [36, 23, 16]  # #101724

    # 3. Fill Retail Store Units (Cool Blue-Gray Slate #1e293b)
    dark_canvas[store_mask] = [59, 41, 30]  # #1e293b (R:30, G:41, B:59)

    # 4. Large Anchors (slightly differentiated cool slate tone #243244)
    # Detect high-area or colored anchor stores in original
    is_anchor = store_mask & (S > 35)
    dark_canvas[is_anchor] = [68, 50, 36]  # #243244

    # 5. Draw Walls & Borders (Cool Slate Border #334155)
    dark_canvas[outline_mask] = [85, 65, 51]  # #334155

    # Also detect sharp Canny edges on original to ensure all internal store partition walls are crisp
    edges = cv2.Canny(gray, 30, 100)
    kernel = np.ones((2, 2), np.uint8)
    edges_dil = cv2.dilate(edges, kernel)
    # Apply edges only inside mall interior
    dark_canvas[(edges_dil > 0) & (~bg_mask)] = [85, 65, 51]

    # 6. Preserve & Beautify Cyan Island Badges
    dark_canvas[cyan_badge_mask] = [185, 120, 10] # Vibrant Google Maps Cyan

    # 7. Draw Text & Store Numbers (Luminous Crisp White #f8fafc)
    text_clean = cv2.dilate(text_mask.astype(np.uint8), np.ones((1, 1), np.uint8))
    dark_canvas[text_clean > 0] = [252, 250, 248]

    # Ensure background is pristine
    dark_canvas[bg_mask] = [24, 15, 10]

    # Final anti-aliased composite
    alpha_out = np.where(a < 30, 0, 255).astype(np.uint8)
    final_img = cv2.merge([dark_canvas[:, :, 0], dark_canvas[:, :, 1], dark_canvas[:, :, 2], alpha_out])

    cv2.imwrite(output_path, final_img)
    print(f"Saved: {output_path}")

create_google_maps_dark_slate_theme('planta-uno.png', 'scratch/gmaps_slate_planta_uno.png')
create_google_maps_dark_slate_theme('planta-baja.png', 'scratch/gmaps_slate_planta_baja.png')
create_google_maps_dark_slate_theme('planta-dos.png', 'scratch/gmaps_slate_planta_dos.png')

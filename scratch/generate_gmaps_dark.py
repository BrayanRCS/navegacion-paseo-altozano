import cv2
import numpy as np

def generate_google_maps_dark_theme(img_path, output_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    h, w = img.shape[:2]
    
    if img.shape[2] == 4:
        b, g, r, a = cv2.split(img)
        bgr = cv2.merge([b, g, r])
    else:
        bgr = img
        a = np.full((h, w), 255, dtype=np.uint8)

    # Convert to grayscale and HSV
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    # 1. Background Mask: white/off-white background in the original map (exterior area)
    # The original background is very bright (V > 240, S < 20)
    bg_mask = (gray > 240) & (S < 25)

    # 2. Text, Numbers and Fine Wall Lines: dark in original (gray < 85)
    text_line_mask = (gray < 90) & (a > 30)

    # 3. Intermediate lines / outlines (85 <= gray < 160)
    wall_outline_mask = (gray >= 90) & (gray < 160) & (S < 45) & (a > 30)

    # 4. Open Corridors / Walkways in original (180 <= gray <= 240, low saturation)
    corridor_mask = (gray >= 170) & (gray <= 240) & (S < 35) & (~bg_mask) & (a > 30)

    # 5. Colored Units (Anchor stores, logos, badges)
    color_mask = (S >= 35) & (V > 50) & (a > 30)

    # 6. Standard Retail Units (gray tones between 120 and 200)
    store_unit_mask = (~bg_mask) & (~text_line_mask) & (~wall_outline_mask) & (~corridor_mask) & (~color_mask) & (a > 30)

    # Initialize Google Maps Dark Theme Canvas (BGR format)
    # Google Maps Dark Theme Palette:
    # Exterior: #080d16 (BGR: 22, 13, 8)
    # Corridors: #101724 (BGR: 36, 23, 16)
    # Stores: #1e293b (BGR: 59, 41, 30)
    # Walls / Borders: #38495f (BGR: 95, 73, 56)
    # Text / Numbers: #f1f5f9 (BGR: 249, 245, 241)
    
    dark_canvas = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Fill Exterior
    dark_canvas[:] = [22, 13, 8]

    # Fill Corridors (Deep Midnight Blue)
    dark_canvas[corridor_mask] = [36, 23, 16]

    # Fill Standard Commercial Units (Dark Slate Blue-Gray)
    dark_canvas[store_unit_mask] = [59, 41, 30]

    # Process Colored Anchor Units (Subtle Google Maps Dark Accent)
    if np.any(color_mask):
        # Mute the original colors to elegant dark mode shades
        hsv_accents = hsv.copy()
        # Keep hue, lower brightness to elegant 35-70 range
        hsv_accents[:, :, 2] = np.clip(hsv_accents[:, :, 2] * 0.45, 25, 75).astype(np.uint8)
        # Moderate saturation
        hsv_accents[:, :, 1] = np.clip(hsv_accents[:, :, 1] * 0.75, 40, 180).astype(np.uint8)
        bgr_accents = cv2.cvtColor(hsv_accents, cv2.COLOR_HSV2BGR)
        dark_canvas[color_mask] = bgr_accents[color_mask]

    # Draw Wall Outlines (Crisp Slate Lines)
    dark_canvas[wall_outline_mask] = [95, 73, 56]

    # Draw Text & Numbers (Luminous High-Contrast Off-White / Sky Accent)
    # Dilate text slightly to maintain needle-sharp readability
    kernel = np.ones((1, 1), np.uint8)
    text_clean = cv2.dilate(text_line_mask.astype(np.uint8), kernel)
    dark_canvas[text_clean > 0] = [249, 245, 241]

    # Clean borders using subtle edge sharpening
    blurred = cv2.GaussianBlur(dark_canvas, (0, 0), 1.0)
    unsharp = cv2.addWeighted(dark_canvas, 1.3, blurred, -0.3, 0)

    # Ensure text and exterior remain pristine
    unsharp[bg_mask] = [22, 13, 8]
    unsharp[text_clean > 0] = [252, 248, 244]

    # Alpha mask: keep exterior transparent or dark
    alpha_out = np.where(a < 30, 0, 255).astype(np.uint8)
    result = cv2.merge([unsharp[:, :, 0], unsharp[:, :, 1], unsharp[:, :, 2], alpha_out])

    cv2.imwrite(output_path, result)
    print(f"Generated {output_path}")

for f in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    out = f"scratch/gmaps_dark_{f}"
    generate_google_maps_dark_theme(f, out)

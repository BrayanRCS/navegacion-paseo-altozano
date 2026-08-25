import cv2
import numpy as np
import json
from PIL import Image, ImageDraw, ImageFont

# Let's inspect white circle markers and cyan circle markers in planta-baja, planta-uno, planta-dos
for name in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    img = cv2.imread(name)
    h, w = img.shape[:2]
    print(f"Loaded {name}: {w}x{h}")

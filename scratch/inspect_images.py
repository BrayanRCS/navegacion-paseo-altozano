import cv2
import numpy as np

for name in ['planta-baja.png', 'planta-uno.png', 'planta-dos.png']:
    img = cv2.imread(name, cv2.IMREAD_UNCHANGED)
    print(f"{name}: shape = {img.shape}, dtype = {img.dtype}")

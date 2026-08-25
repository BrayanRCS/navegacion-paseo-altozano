import cv2
import numpy as np

def inspect_numbers(img_path):
    orig = cv2.imread(img_path)
    print(f"Inspecting {img_path} shape: {orig.shape}")

inspect_numbers('planta-uno.png')
inspect_numbers('planta-baja.png')
inspect_numbers('planta-dos.png')

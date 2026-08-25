import cv2
import numpy as np

# Load original and generated dark map
orig = cv2.imread('planta-uno.png')
dark = cv2.imread('scratch/dark_planta_uno.png')

print(f"Original mean BGR: {orig.mean(axis=(0,1))}")
print(f"Dark map mean BGR: {dark.mean(axis=(0,1))}")

# Let's check a few crops around Liverpool, Totem, Sfera, Sears
crops = {
    "liverpool": dark[400:600, 200:500],
    "totem_chedraui": dark[350:550, 850:1100],
    "sfera_north": dark[180:350, 750:1000]
}

for k, c in crops.items():
    cv2.imwrite(f'scratch/crop_{k}.png', c)
    print(f"Saved scratch/crop_{k}.png: {c.shape}")

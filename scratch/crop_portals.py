import cv2
import numpy as np

img1 = cv2.imread('planta-baja.png')
img2 = cv2.imread('planta-uno.png')
img3 = cv2.imread('planta-dos.png')

# Let's create an annotated montage for each floor with high-contrast crops of escalator/elevator areas
# On Planta Uno (L2):
# 1. Sears escalator / elevator area (right side x: 1000..1250, y: 300..550)
# 2. Rotonda escalators area (center x: 550..750, y: 250..450)
# 3. Liverpool escalators area (left x: 250..450, y: 400..600)
# 4. Sanborns escalators area (bottom-center x: 550..750, y: 480..650)

cv2.imwrite('scratch/crop_l2_sears.png', img2[280:550, 1000:1280])
cv2.imwrite('scratch/crop_l2_rotonda.png', img2[220:450, 520:750])
cv2.imwrite('scratch/crop_l2_liverpool.png', img2[380:600, 250:480])
cv2.imwrite('scratch/crop_l2_sanborns.png', img2[450:680, 550:780])

# On Planta Baja (L1):
cv2.imwrite('scratch/crop_l1_liverpool.png', img1[420:640, 480:700])
cv2.imwrite('scratch/crop_l1_central.png', img1[180:400, 700:920])
cv2.imwrite('scratch/crop_l1_sanborns.png', img1[250:470, 780:1000])

# On Planta Dos (L3):
cv2.imwrite('scratch/crop_l3_cinelia.png', img3[120:340, 900:1150])
cv2.imwrite('scratch/crop_l3_central.png', img3[240:480, 720:980])
cv2.imwrite('scratch/crop_l3_terrace.png', img3[380:600, 900:1150])
cv2.imwrite('scratch/crop_l3_anytime.png', img3[200:420, 1100:1350])

print("Crops saved to scratch directory.")

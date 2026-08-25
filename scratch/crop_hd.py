import cv2

dark_hd = cv2.imread('planta-uno-dark.png')
# Crop around Totem / Sanborns / Chedraui in 3x resolution (approx y: 1050-1650, x: 2500-3300)
crop_totem = dark_hd[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_hd_totem.png', crop_totem)
print("Saved scratch/crop_hd_totem.png:", crop_totem.shape)

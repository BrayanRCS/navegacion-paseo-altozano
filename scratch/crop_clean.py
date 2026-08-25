import cv2

dark_clean = cv2.imread('planta-uno-dark.png')
# Crop around Totem / Sanborns / Chedraui (approx y: 1050-1650, x: 2500-3300)
crop_clean_totem = dark_clean[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_clean_totem.png', crop_clean_totem)
print("Saved scratch/crop_clean_totem.png:", crop_clean_totem.shape)

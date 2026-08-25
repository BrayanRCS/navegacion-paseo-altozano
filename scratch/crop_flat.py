import cv2

flat_clean = cv2.imread('planta-uno-dark.png')
# Crop around central rotunda, Sanborns, and Chedraui (y: 1050-1650, x: 2500-3300)
crop_flat = flat_clean[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_flat_totem.png', crop_flat)
print("Saved scratch/crop_flat_totem.png:", crop_flat.shape)

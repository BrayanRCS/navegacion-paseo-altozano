import cv2

entire_clean = cv2.imread('planta-uno-dark.png')
# Crop around central rotunda, Sanborns, and Chedraui (y: 1050-1650, x: 2500-3300)
crop_entire = entire_clean[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_entire_totem.png', crop_entire)
print("Saved scratch/crop_entire_totem.png:", crop_entire.shape)

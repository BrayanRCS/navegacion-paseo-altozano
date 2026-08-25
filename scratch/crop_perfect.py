import cv2

perfect = cv2.imread('planta-uno-dark.png')
# Crop around central rotunda, Sanborns, and Chedraui (y: 1050-1650, x: 2500-3300)
crop_perfect = perfect[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_perfect_totem.png', crop_perfect)
print("Saved scratch/crop_perfect_totem.png:", crop_perfect.shape)

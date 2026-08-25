import cv2

pristine = cv2.imread('planta-uno-dark.png')
# Crop around central area (y: 1050-1650, x: 2500-3300)
crop_pristine = pristine[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_pristine_totem.png', crop_pristine)
print("Saved scratch/crop_pristine_totem.png:", crop_pristine.shape)

import cv2

master = cv2.imread('planta-uno-dark.png')
# Crop around central rotunda, Sanborns, and Chedraui (y: 1050-1650, x: 2500-3300)
crop_master = master[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_master_totem.png', crop_master)
print("Saved scratch/crop_master_totem.png:", crop_master.shape)

import cv2

final_map = cv2.imread('planta-uno-dark.png')
# Crop around central rotunda, Sanborns, and Chedraui (y: 1050-1650, x: 2500-3300)
crop_final = final_map[1050:1650, 2500:3300]
cv2.imwrite('scratch/crop_final_verification.png', crop_final)
print("Saved scratch/crop_final_verification.png:", crop_final.shape)

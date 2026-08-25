import cv2
import numpy as np

orig = cv2.imread('planta-uno.png')
# Check unique colors around the exterior (top-right corner 50,50) vs corridor (700, 440) vs store Liverpool (300, 500)
print("Exterior (x=50, y=50) BGR:", orig[50, 50])
print("Corridor (x=700, y=440) BGR:", orig[440, 700])
print("Liverpool (x=300, y=500) BGR:", orig[500, 300])
print("Sanborns (x=900, y=600) BGR:", orig[600, 900])
print("Chedraui (x=1100, y=500) BGR:", orig[500, 1100])
print("Sears (x=1350, y=600) BGR:", orig[600, 1350])
print("Store 17 (x=800, y=250) BGR:", orig[250, 800])

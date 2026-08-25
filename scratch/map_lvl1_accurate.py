import cv2
import numpy as np
import json

def get_accurate_lvl1():
    # Fine-tuned pixel coordinates directly aligned with planta-baja.png (1536 x 727)
    return {
        # Stores (matching leyenda-planta-baja.png)
        "n_lvl1_store_1": {"name": "Liverpool", "type": "anchor_store", "x": 248, "y": 472},
        "n_lvl1_store_2": {"name": "Women'secret", "type": "store", "x": 499, "y": 421},
        "n_lvl1_store_3": {"name": "Springfield", "type": "store", "x": 528, "y": 405},
        "n_lvl1_store_4": {"name": "DpStreet", "type": "store", "x": 555, "y": 392},
        "n_lvl1_store_5": {"name": "Guess", "type": "store", "x": 641, "y": 370},
        "n_lvl1_store_6": {"name": "Studio F", "type": "store", "x": 680, "y": 351},
        "n_lvl1_store_7": {"name": "Natura", "type": "store", "x": 712, "y": 338},
        "n_lvl1_store_8": {"name": "American Eagle", "type": "store", "x": 758, "y": 308},
        "n_lvl1_store_9": {"name": "H&M", "type": "anchor_store", "x": 887, "y": 470},
        "n_lvl1_store_10": {"name": "Porrúa", "type": "store", "x": 813, "y": 389},
        "n_lvl1_store_11": {"name": "Adolfo Domínguez", "type": "store", "x": 786, "y": 382},
        "n_lvl1_store_12": {"name": "Pandora", "type": "store", "x": 749, "y": 393},
        "n_lvl1_store_13": {"name": "Tommy Hilfiger", "type": "store", "x": 727, "y": 405},
        "n_lvl1_store_14": {"name": "MAJA Sportwear", "type": "store", "x": 701, "y": 420},
        "n_lvl1_store_15": {"name": "Adidas", "type": "store", "x": 666, "y": 443},
        "n_lvl1_store_16": {"name": "Daily Pick", "type": "store", "x": 625, "y": 461},
        "n_lvl1_store_17": {"name": "Le Lieu", "type": "store", "x": 605, "y": 477},
        "n_lvl1_store_18": {"name": "AT&T", "type": "store", "x": 621, "y": 532},
        "n_lvl1_store_19": {"name": "Salomon", "type": "store", "x": 633, "y": 554},
        "n_lvl1_store_20": {"name": "BYD", "type": "store", "x": 689, "y": 557},
        "n_lvl1_store_21": {"name": "Banamex", "type": "store", "x": 564, "y": 611},
        "n_lvl1_store_22": {"name": "MacStore", "type": "store", "x": 565, "y": 560},
        "n_lvl1_store_23": {"name": "Fiesta Inn", "type": "anchor_store", "x": 680, "y": 239},
        "n_lvl1_store_24": {"name": "Crown City Casino", "type": "anchor_store", "x": 1077, "y": 82},
        "n_lvl1_store_25": {"name": "Honda", "type": "store", "x": 1129, "y": 82},
        "n_lvl1_store_26": {"name": "Geely", "type": "store", "x": 1205, "y": 81},
        
        # Islas
        "n_lvl1_island_1": {"name": "Casa Carcasa", "type": "island", "x": 577, "y": 524},
        "n_lvl1_island_2": {"name": "Jurassic Ride", "type": "island", "x": 584, "y": 388},
        "n_lvl1_island_3": {"name": "Flabelus", "type": "island", "x": 783, "y": 342},
        
        # Próximamente
        "n_lvl1_store_27": {"name": "Bath & Body Works (Próximamente)", "type": "store", "x": 890, "y": 215},
        "n_lvl1_store_28": {"name": "Sephora (Próximamente)", "type": "store", "x": 885, "y": 261},
        
        # Servicios & Portales
        "n_lvl1_escalator_liverpool": {"name": "Escaleras Eléctricas Plaza Liverpool", "type": "portal_escalator", "x": 564, "y": 515},
        "n_lvl1_elevator_liverpool": {"name": "Elevador Plaza Liverpool", "type": "portal_elevator", "x": 598, "y": 538},
        "n_lvl1_escalator_central": {"name": "Escaleras Eléctricas Central", "type": "portal_escalator", "x": 787, "y": 250},
        "n_lvl1_elevator_central": {"name": "Elevador Central", "type": "portal_elevator", "x": 789, "y": 268},
        "n_lvl1_escalator_oval": {"name": "Escaleras Eléctricas Plaza Oval", "type": "portal_escalator", "x": 838, "y": 348},
        "n_lvl1_restroom_1": {"name": "Sanitarios Central", "type": "restroom", "x": 714, "y": 318},
        "n_lvl1_service_maint": {"name": "Mantenimiento", "type": "service", "x": 968, "y": 181}
    }

nodes1 = get_accurate_lvl1()
img1 = cv2.imread('planta-baja.png')
for k, v in nodes1.items():
    cv2.circle(img1, (v['x'], v['y']), 7, (0, 255, 0), -1)
    cv2.circle(img1, (v['x'], v['y']), 7, (0, 0, 0), 2)
    cv2.putText(img1, k.split('_')[-1], (v['x']+8, v['y']+4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 2)
    cv2.putText(img1, k.split('_')[-1], (v['x']+8, v['y']+4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

cv2.imwrite('scratch/verify_lvl1.png', img1)
print("Saved scratch/verify_lvl1.png")

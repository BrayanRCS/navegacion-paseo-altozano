import cv2
import numpy as np
import json

lvl3_det = json.load(open('scratch/detected_lvl3.json'))

def find_nearest_detected_lvl3(x, y, max_dist=25):
    best_p = (x, y)
    min_d = max_dist
    for d in lvl3_det:
        dist = np.hypot(d['x'] - x, d['y'] - y)
        if dist < min_d:
            min_d = dist
            best_p = (d['x'], d['y'])
    return best_p

raw_lvl3_nodes = {
    # Stores
    "n_lvl3_store_1": {"name": "Scio México", "type": "store", "x": 618, "y": 212},
    "n_lvl3_store_2": {"name": "GoKartManía", "type": "anchor_store", "x": 748, "y": 105},
    "n_lvl3_store_3": {"name": "Cinelia", "type": "anchor_store", "x": 895, "y": 105},
    "n_lvl3_store_4": {"name": "Julio Cepeda Jugueterías", "type": "store", "x": 895, "y": 242},
    "n_lvl3_store_5": {"name": "Monkey Bowling Bar", "type": "store", "x": 1028, "y": 135},
    "n_lvl3_store_6": {"name": "Anytime Fitness", "type": "anchor_store", "x": 1155, "y": 205},
    "n_lvl3_store_7": {"name": "Fisher's", "type": "anchor_store", "x": 1272, "y": 362},
    "n_lvl3_store_8": {"name": "UNAGI Teppan-Yaki & Sushi Bar", "type": "store", "x": 1198, "y": 290},
    "n_lvl3_store_9": {"name": "G-Work Space", "type": "store", "x": 1018, "y": 380},
    "n_lvl3_store_10": {"name": "Mammut Pizza", "type": "store", "x": 1018, "y": 515},
    "n_lvl3_store_11": {"name": "Jana", "type": "store", "x": 970, "y": 515},
    "n_lvl3_store_12": {"name": "Casa Paula", "type": "store", "x": 930, "y": 515},
    "n_lvl3_store_13": {"name": "Funki Squad", "type": "store", "x": 770, "y": 510},
    "n_lvl3_store_14": {"name": "Carl's Jr.", "type": "store", "x": 755, "y": 375},
    "n_lvl3_store_15": {"name": "Taquería El Infierno", "type": "store", "x": 625, "y": 375},
    "n_lvl3_store_16": {"name": "Inn Salata Express", "type": "store", "x": 618, "y": 435},
    "n_lvl3_store_17": {"name": "Mikono Sushi Bar", "type": "store", "x": 605, "y": 450},
    "n_lvl3_store_18": {"name": "La Cueva de Chucho", "type": "store", "x": 592, "y": 462},
    "n_lvl3_store_19": {"name": "Domino's Pizza", "type": "store", "x": 580, "y": 478},
    "n_lvl3_store_20": {"name": "Hong Kong Express", "type": "store", "x": 566, "y": 490},
    "n_lvl3_store_21": {"name": "Intelisis", "type": "store", "x": 550, "y": 600},
    "n_lvl3_store_22": {"name": "Grupo Altozano", "type": "store", "x": 650, "y": 520},
    "n_lvl3_store_23": {"name": "Showroom", "type": "store", "x": 688, "y": 585},
    "n_lvl3_store_24": {"name": "Erre Media", "type": "store", "x": 775, "y": 585},
    "n_lvl3_store_25": {"name": "Centro de Negocios", "type": "store", "x": 688, "y": 242},
    "n_lvl3_store_26": {"name": "Raspados Jalisco", "type": "store", "x": 900, "y": 380},
    "n_lvl3_store_27": {"name": "La Gofrera", "type": "store", "x": 950, "y": 565},
    "n_lvl3_store_28": {"name": "Wingstop", "type": "store", "x": 970, "y": 565},
    
    # Próximamente
    "n_lvl3_store_29": {"name": "A Mar y Pasta (Próximamente)", "type": "store", "x": 938, "y": 405},
    
    # Servicios & Portales
    "n_lvl3_escalator_cinelia": {"name": "Escaleras Eléctricas Cinelia", "type": "portal_escalator", "x": 992, "y": 200},
    "n_lvl3_elevator_cinelia": {"name": "Elevador Cinelia", "type": "portal_elevator", "x": 992, "y": 225},
    "n_lvl3_escalator_anytime": {"name": "Escaleras Eléctricas Anytime Fitness", "type": "portal_escalator", "x": 1220, "y": 225},
    "n_lvl3_escalator_central_top": {"name": "Escaleras Eléctricas Central Norte", "type": "portal_escalator", "x": 820, "y": 375},
    "n_lvl3_escalator_central_bot": {"name": "Escaleras Eléctricas Central Sur", "type": "portal_escalator", "x": 848, "y": 425},
    "n_lvl3_escalator_terrace": {"name": "Escaleras Eléctricas Terraza", "type": "portal_escalator", "x": 1055, "y": 510},
    "n_lvl3_restroom_1": {"name": "Sanitarios Cinelia", "type": "restroom", "x": 992, "y": 185},
    "n_lvl3_restroom_2": {"name": "Sanitarios Terraza / Estacionamiento", "type": "restroom", "x": 535, "y": 555},
    "n_lvl3_service_admin": {"name": "Administración", "type": "service", "x": 576, "y": 530},
    "n_lvl3_service_parking": {"name": "Estacionamiento", "type": "service", "x": 535, "y": 530},
    "n_lvl3_games_zone": {"name": "Zona de Juegos", "type": "service", "x": 948, "y": 450}
}

final_lvl3 = {}
for k, v in raw_lvl3_nodes.items():
    if v['type'] not in ('portal_escalator', 'portal_elevator', 'restroom', 'service', 'anchor_store'):
        gx, gy = find_nearest_detected_lvl3(v['x'], v['y'], max_dist=20)
        final_lvl3[k] = {**v, 'x': gx, 'y': gy}
    else:
        final_lvl3[k] = v

img3 = cv2.imread('planta-dos.png')
for k, v in final_lvl3.items():
    cv2.circle(img3, (v['x'], v['y']), 7, (0, 255, 0), -1)
    cv2.circle(img3, (v['x'], v['y']), 7, (0, 0, 0), 2)
    cv2.putText(img3, k.split('_')[-1], (v['x']+6, v['y']+3), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 0, 0), 2)
    cv2.putText(img3, k.split('_')[-1], (v['x']+6, v['y']+3), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)

cv2.imwrite('scratch/verify_lvl3.png', img3)
print("Saved scratch/verify_lvl3.png")

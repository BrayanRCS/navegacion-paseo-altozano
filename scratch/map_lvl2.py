import cv2
import numpy as np
import json

lvl2_det = json.load(open('scratch/detected_lvl2.json'))

def find_nearest_detected(x, y, max_dist=25):
    best_p = (x, y)
    min_d = max_dist
    for d in lvl2_det:
        dist = np.hypot(d['x'] - x, d['y'] - y)
        if dist < min_d:
            min_d = dist
            best_p = (d['x'], d['y'])
    return best_p

# Candidate coordinates for Level 2
raw_lvl2_nodes = {
    # Anchor Stores
    "n_lvl2_store_1": {"name": "Liverpool", "type": "anchor_store", "x": 190, "y": 490},
    "n_lvl2_store_28": {"name": "Sears", "type": "anchor_store", "x": 1350, "y": 480},
    "n_lvl2_store_29": {"name": "Chedraui Selecto", "type": "anchor_store", "x": 1070, "y": 420},
    "n_lvl2_store_42": {"name": "H&M", "type": "anchor_store", "x": 674, "y": 455},
    "n_lvl2_store_37": {"name": "Sanborns", "type": "anchor_store", "x": 815, "y": 478},
    "n_lvl2_store_43": {"name": "Inter Home", "type": "anchor_store", "x": 525, "y": 560},
    
    # Stores 2 to 27
    "n_lvl2_store_2": {"name": "5.11 Outdoor and Adventure", "type": "store", "x": 303, "y": 422},
    "n_lvl2_store_3": {"name": "Fame", "type": "store", "x": 312, "y": 342},
    "n_lvl2_store_4": {"name": "Telcel", "type": "store", "x": 412, "y": 380},
    "n_lvl2_store_5": {"name": "Watch 2 Go", "type": "store", "x": 428, "y": 368},
    "n_lvl2_store_6": {"name": "GNC", "type": "store", "x": 448, "y": 355},
    "n_lvl2_store_7": {"name": "Lids", "type": "store", "x": 466, "y": 342},
    "n_lvl2_store_8": {"name": "Hey Guapa", "type": "store", "x": 484, "y": 330},
    "n_lvl2_store_9": {"name": "La Casa de las Carcasas", "type": "store", "x": 501, "y": 318},
    "n_lvl2_store_10": {"name": "Urani", "type": "store", "x": 522, "y": 308},
    "n_lvl2_store_11": {"name": "Miniso", "type": "store", "x": 565, "y": 305},
    "n_lvl2_store_12": {"name": "Zanati", "type": "store", "x": 594, "y": 238},
    "n_lvl2_store_13": {"name": "Dportenis", "type": "store", "x": 704, "y": 238},
    "n_lvl2_store_14": {"name": "Sally Beauty", "type": "store", "x": 725, "y": 242},
    "n_lvl2_store_15": {"name": "Mi Cha", "type": "store", "x": 740, "y": 242},
    "n_lvl2_store_16": {"name": "Dairy Queen", "type": "store", "x": 796, "y": 245},
    "n_lvl2_store_17": {"name": "Sfera", "type": "store", "x": 855, "y": 175},
    "n_lvl2_store_18": {"name": "Honda", "type": "store", "x": 938, "y": 178},
    "n_lvl2_store_19": {"name": "Geely", "type": "store", "x": 968, "y": 92},
    "n_lvl2_store_20": {"name": "Smart Trampoline", "type": "store", "x": 1055, "y": 148},
    "n_lvl2_store_21": {"name": "Taller Creativo de Oscar Torres", "type": "store", "x": 1119, "y": 175},
    "n_lvl2_store_22": {"name": "Floristorio", "type": "store", "x": 1119, "y": 158},
    "n_lvl2_store_23": {"name": "Estrella Dorada", "type": "store", "x": 1189, "y": 208},
    "n_lvl2_store_24": {"name": "Showroom Fame", "type": "store", "x": 1255, "y": 170},
    "n_lvl2_store_25": {"name": "Toyota", "type": "store", "x": 1348, "y": 235},
    "n_lvl2_store_26": {"name": "Taller BYD", "type": "store", "x": 1380, "y": 260},
    "n_lvl2_store_27": {"name": "KIA", "type": "store", "x": 1316, "y": 278},
    
    # Stores 30 to 50
    "n_lvl2_store_30": {"name": "Palet", "type": "store", "x": 1078, "y": 290},
    "n_lvl2_store_31": {"name": "Dolphy", "type": "store", "x": 992, "y": 348},
    "n_lvl2_store_32": {"name": "Flexi", "type": "store", "x": 912, "y": 470},
    "n_lvl2_store_33": {"name": "New York Coffee", "type": "store", "x": 912, "y": 440},
    "n_lvl2_store_34": {"name": "Café Europa", "type": "store", "x": 916, "y": 418},
    "n_lvl2_store_35": {"name": "Vía Uno", "type": "store", "x": 900, "y": 418},
    "n_lvl2_store_36": {"name": "Beau", "type": "store", "x": 880, "y": 418},
    "n_lvl2_store_38": {"name": "Ópticas Kauffman", "type": "store", "x": 805, "y": 390},
    "n_lvl2_store_39": {"name": "Hill's Collection", "type": "store", "x": 776, "y": 385},
    "n_lvl2_store_40": {"name": "Nutrisa", "type": "store", "x": 755, "y": 380},
    "n_lvl2_store_41": {"name": "Ópticas Lux", "type": "store", "x": 732, "y": 372},
    "n_lvl2_store_44": {"name": "Banana Republic", "type": "store", "x": 580, "y": 462},
    "n_lvl2_store_45": {"name": "Fabletics", "type": "store", "x": 580, "y": 400},
    "n_lvl2_store_46": {"name": "GAP", "type": "store", "x": 535, "y": 438},
    "n_lvl2_store_47": {"name": "Steren", "type": "store", "x": 490, "y": 450},
    "n_lvl2_store_48": {"name": "Luuna", "type": "store", "x": 465, "y": 468},
    "n_lvl2_store_49": {"name": "Havoc", "type": "store", "x": 428, "y": 482},
    "n_lvl2_store_50": {"name": "Axen Health", "type": "store", "x": 366, "y": 580},
    
    # Stores 51 to 63 (Central Island Strip)
    "n_lvl2_store_51": {"name": "Starbucks Coffee", "type": "store", "x": 725, "y": 310},
    "n_lvl2_store_52": {"name": "Enki's Barbería", "type": "store", "x": 768, "y": 328},
    "n_lvl2_store_53": {"name": "Todomoda", "type": "store", "x": 786, "y": 330},
    "n_lvl2_store_54": {"name": "Studio Mix", "type": "store", "x": 810, "y": 335},
    "n_lvl2_store_55": {"name": "Bizzarro", "type": "store", "x": 838, "y": 340},
    "n_lvl2_store_56": {"name": "Ben & Frank", "type": "store", "x": 866, "y": 346},
    "n_lvl2_store_57": {"name": "Yuscase", "type": "store", "x": 892, "y": 350},
    "n_lvl2_store_58": {"name": "Sunglass Hut", "type": "store", "x": 918, "y": 355},
    "n_lvl2_store_59": {"name": "Adidas", "type": "store", "x": 912, "y": 318},
    "n_lvl2_store_60": {"name": "Crocs", "type": "store", "x": 885, "y": 315},
    "n_lvl2_store_61": {"name": "Taste Top", "type": "store", "x": 862, "y": 308},
    "n_lvl2_store_62": {"name": "Di Luca Gelato Gourmet", "type": "store", "x": 840, "y": 308},
    "n_lvl2_store_63": {"name": "Pies & Salud", "type": "store", "x": 818, "y": 305},
    
    # Islas 1 to 12
    "n_lvl2_island_1": {"name": "De Regil Chocolat", "type": "island", "x": 580, "y": 348},
    "n_lvl2_island_2": {"name": "Elotería La Cerrada", "type": "island", "x": 632, "y": 242},
    "n_lvl2_island_3": {"name": "Casa Carcasa", "type": "island", "x": 714, "y": 345},
    "n_lvl2_island_4": {"name": "Mingos", "type": "island", "x": 755, "y": 355},
    "n_lvl2_island_5": {"name": "Straight A Head", "type": "island", "x": 785, "y": 362},
    "n_lvl2_island_6": {"name": "Olivia", "type": "island", "x": 845, "y": 372},
    "n_lvl2_island_7": {"name": "Obey Yourr Body", "type": "island", "x": 875, "y": 380},
    "n_lvl2_island_8": {"name": "M&L Joyas", "type": "island", "x": 915, "y": 390},
    "n_lvl2_island_9": {"name": "Delicrepé", "type": "island", "x": 960, "y": 325},
    "n_lvl2_island_10": {"name": "Moyo", "type": "island", "x": 960, "y": 380},
    "n_lvl2_island_11": {"name": "La Casa de las Carcasas", "type": "island", "x": 960, "y": 435},
    "n_lvl2_island_12": {"name": "M-Caps", "type": "island", "x": 960, "y": 490},
    
    # Proximamente
    "n_lvl2_store_64": {"name": "Coven (Próximamente)", "type": "store", "x": 455, "y": 472}, # yellow 1 near 48
    "n_lvl2_store_65": {"name": "Telcel CAC (Próximamente)", "type": "store", "x": 992, "y": 290}, # yellow 2 near Chedraui
    
    # Portales & Servicios
    "n_lvl2_escalator_liverpool": {"name": "Escaleras Eléctricas Plaza Liverpool", "type": "portal_escalator", "x": 338, "y": 518},
    "n_lvl2_elevator_liverpool": {"name": "Elevador Plaza Liverpool", "type": "portal_elevator", "x": 412, "y": 518},
    "n_lvl2_escalator_rotunda_left": {"name": "Escaleras Eléctricas Rotonda Izquierda", "type": "portal_escalator", "x": 605, "y": 325},
    "n_lvl2_escalator_rotunda_bottom": {"name": "Escaleras Eléctricas Rotonda Inferior", "type": "portal_escalator", "x": 625, "y": 360},
    "n_lvl2_escalator_rotunda_right": {"name": "Escaleras Eléctricas Rotonda Derecha", "type": "portal_escalator", "x": 670, "y": 360},
    "n_lvl2_escalator_sanborns": {"name": "Escaleras Eléctricas Sanborns", "type": "portal_escalator", "x": 635, "y": 560},
    "n_lvl2_escalator_sears": {"name": "Escaleras Eléctricas Sears", "type": "portal_escalator", "x": 1180, "y": 465},
    "n_lvl2_elevator_chedraui": {"name": "Elevador Chedraui", "type": "portal_elevator", "x": 1148, "y": 495},
    "n_lvl2_restroom_1": {"name": "Sanitarios Fiesta Inn", "type": "restroom", "x": 515, "y": 325},
    "n_lvl2_restroom_2": {"name": "Sanitarios Plaza Sears", "type": "restroom", "x": 1119, "y": 138},
    
    # Tótem Activo (Punto 12)
    "n_totem_12": {"name": "📍 Tótem Punto 12", "type": "totem", "x": 960, "y": 510} # Near M-Caps / Pasillo Chedraui-Sanborns
}

# Snap to nearest detected circle if within 20px
final_lvl2 = {}
for k, v in raw_lvl2_nodes.items():
    if v['type'] not in ('portal_escalator', 'portal_elevator', 'restroom', 'totem', 'anchor_store'):
        gx, gy = find_nearest_detected(v['x'], v['y'], max_dist=20)
        final_lvl2[k] = {**v, 'x': gx, 'y': gy}
    else:
        final_lvl2[k] = v

img2 = cv2.imread('planta-uno.png')
for k, v in final_lvl2.items():
    cv2.circle(img2, (v['x'], v['y']), 7, (0, 255, 0), -1)
    cv2.circle(img2, (v['x'], v['y']), 7, (0, 0, 0), 2)
    cv2.putText(img2, k.split('_')[-1], (v['x']+6, v['y']+3), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 0, 0), 2)
    cv2.putText(img2, k.split('_')[-1], (v['x']+6, v['y']+3), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)

cv2.imwrite('scratch/verify_lvl2.png', img2)
print("Saved scratch/verify_lvl2.png")

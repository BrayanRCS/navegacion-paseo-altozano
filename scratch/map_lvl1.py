import json
import cv2
import numpy as np

# Load detected points for all levels
lvl1_det = json.load(open('scratch/detected_lvl1.json'))
lvl2_det = json.load(open('scratch/detected_lvl2.json'))
lvl3_det = json.load(open('scratch/detected_lvl3.json'))

def get_pt(det_list, ptype, idx):
    for item in det_list:
        if item['type'] == ptype and item['idx'] == idx:
            return item['x'], item['y']
    return None

# Let's map Level 1 points directly from the montage indices
lvl1_nodes = {
    # Stores
    "store_1": (248, 660), # Liverpool (Anchor)
    "store_2": get_pt(lvl1_det, 'white', 39), # Women'secret
    "store_3": get_pt(lvl1_det, 'white', 40), # Springfield
    "store_4": get_pt(lvl1_det, 'white', 41), # DpStreet
    "store_5": get_pt(lvl1_det, 'white', 29), # Guess
    "store_6": get_pt(lvl1_det, 'white', 30), # Studio F
    "store_7": (712, 452), # Natura (near 6 and 8)
    "store_8": get_pt(lvl1_det, 'white', 60), # American Eagle
    "store_9": get_pt(lvl1_det, 'white', 46) or (887, 508), # H&M (Anchor)
    "store_10": get_pt(lvl1_det, 'white', 42), # Porrúa
    "store_11": get_pt(lvl1_det, 'white', 43), # Adolfo Domínguez
    "store_12": get_pt(lvl1_det, 'white', 18), # Pandora
    "store_13": get_pt(lvl1_det, 'white', 17), # Tommy Hilfiger
    "store_14": get_pt(lvl1_det, 'white', 16), # MAJA Sportwear
    "store_15": get_pt(lvl1_det, 'white', 15), # Adidas
    "store_16": get_pt(lvl1_det, 'white', 14), # Daily Pick
    "store_17": (605, 655), # Le Lieu
    "store_18": get_pt(lvl1_det, 'white', 12), # AT&T
    "store_19": get_pt(lvl1_det, 'white', 11), # Salomon
    "store_20": get_pt(lvl1_det, 'white', 10), # BYD
    "store_21": get_pt(lvl1_det, 'white', 0), # Banamex
    "store_22": get_pt(lvl1_det, 'white', 1), # MacStore
    "store_23": get_pt(lvl1_det, 'white', 64), # Fiesta Inn
    "store_24": get_pt(lvl1_det, 'white', 99), # Crown City Casino
    "store_25": get_pt(lvl1_det, 'white', 98), # Honda
    "store_26": get_pt(lvl1_det, 'white', 97), # Geely
    
    # Islas
    "island_1": get_pt(lvl1_det, 'white', 2) or get_pt(lvl1_det, 'cyan', 0), # Casa Carcasa
    "island_2": get_pt(lvl1_det, 'white', 19) or get_pt(lvl1_det, 'cyan', 5), # Jurassic Ride
    "island_3": get_pt(lvl1_det, 'white', 24) or get_pt(lvl1_det, 'cyan', 7), # Flabelus
    
    # Proximamente
    "store_27": (865, 275), # Bath & Body Works (near Crown City walkway / yellow 1)
    "store_28": get_pt(lvl1_det, 'white', 69) or (887, 355), # Sephora (yellow 2)
    
    # Portals & Services
    "escalator_liverpool": (564, 672),
    "escalator_central": (787, 348),
    "escalator_oval": (838, 458),
    "elevator_liverpool": (598, 700),
    "elevator_central": (789, 335),
    "restroom_1": (714, 432),
    "maintenance_1": get_pt(lvl1_det, 'white', 70) or (967, 248)
}

print("Lvl 1 mapped nodes:")
for k, v in lvl1_nodes.items():
    print(f"  {k}: {v}")

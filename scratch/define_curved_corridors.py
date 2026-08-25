import json
import math

# Load current data
data = json.load(open('mall_graph.json', encoding='utf-8'))
stores = [n for n in data['nodes'] if n['type'] in ('store', 'anchor_store', 'island', 'portal_escalator', 'portal_elevator', 'totem', 'service', 'restroom')]

print(f"Total stores/destinations/portals to connect: {len(stores)}")

# Define smooth, curved corridor spines for each level with natural waypoints
# PLANTA BAJA (L1)
corridors_lvl1 = [
    # Liverpool area
    {"id": "n_lvl1_c_01", "name": "Pasillo Liverpool", "level": 1, "coordinates": {"x": 480, "y": 500}, "context_element": "Liverpool PB"},
    {"id": "n_lvl1_c_02", "name": "Pasillo Plaza Liverpool", "level": 1, "coordinates": {"x": 520, "y": 480}, "context_element": "Women'secret"},
    {"id": "n_lvl1_c_03", "name": "Acceso Escaleras Liverpool", "level": 1, "coordinates": {"x": 560, "y": 460}, "context_element": "Escaleras Liverpool"},
    {"id": "n_lvl1_c_04", "name": "Pasillo DpStreet / Guess", "level": 1, "coordinates": {"x": 610, "y": 430}, "context_element": "Guess"},
    {"id": "n_lvl1_c_05", "name": "Pasillo Central Poniente", "level": 1, "coordinates": {"x": 660, "y": 400}, "context_element": "Studio F"},
    {"id": "n_lvl1_c_06", "name": "Pasillo Central", "level": 1, "coordinates": {"x": 710, "y": 370}, "context_element": "American Eagle"},
    {"id": "n_lvl1_c_07", "name": "Cruce Fuente Central", "level": 1, "coordinates": {"x": 760, "y": 340}, "context_element": "Fuente Central"},
    {"id": "n_lvl1_c_08", "name": "Pasillo Plaza Oval", "level": 1, "coordinates": {"x": 810, "y": 320}, "context_element": "H&M PB"},
    {"id": "n_lvl1_c_09", "name": "Pasillo Porrúa / Adolfo Domínguez", "level": 1, "coordinates": {"x": 860, "y": 280}, "context_element": "Librería Porrúa"},
    {"id": "n_lvl1_c_10", "name": "Acceso Fiesta Inn", "level": 1, "coordinates": {"x": 880, "y": 220}, "context_element": "Hotel Fiesta Inn"},
    {"id": "n_lvl1_c_11", "name": "Pasillo Banamex / MacStore", "level": 1, "coordinates": {"x": 930, "y": 180}, "context_element": "MacStore"},
    {"id": "n_lvl1_c_12", "name": "Pasillo Crown City Casino", "level": 1, "coordinates": {"x": 990, "y": 150}, "context_element": "Casino Crown City"},
    {"id": "n_lvl1_c_13", "name": "Pasillo Automotriz Honda / Geely", "level": 1, "coordinates": {"x": 1050, "y": 130}, "context_element": "Honda / Geely"}
]

# PLANTA 1 (L2) - High fidelity curved network
corridors_lvl2 = [
    # Liverpool Wing (West)
    {"id": "n_lvl2_c_01", "name": "Pasillo Acceso Liverpool", "level": 2, "coordinates": {"x": 320, "y": 500}, "context_element": "Liverpool"},
    {"id": "n_lvl2_c_02", "name": "Pasillo Plaza Liverpool", "level": 2, "coordinates": {"x": 370, "y": 480}, "context_element": "Escaleras Liverpool"},
    {"id": "n_lvl2_c_03", "name": "Pasillo GAP / Aeropostale", "level": 2, "coordinates": {"x": 430, "y": 440}, "context_element": "Aeropostale"},
    {"id": "n_lvl2_c_04", "name": "Pasillo Steren / Innovasport", "level": 2, "coordinates": {"x": 490, "y": 410}, "context_element": "Innovasport"},
    {"id": "n_lvl2_c_05", "name": "Pasillo Acceso Rotonda Poniente", "level": 2, "coordinates": {"x": 550, "y": 370}, "context_element": "L'Occitane"},
    
    # Rotonda Ring (Circular/Oval)
    {"id": "n_lvl2_c_06", "name": "Rotonda Poniente", "level": 2, "coordinates": {"x": 590, "y": 340}, "context_element": "Rotonda Poniente"},
    {"id": "n_lvl2_c_07", "name": "Rotonda Norponiente", "level": 2, "coordinates": {"x": 610, "y": 280}, "context_element": "Miniso"},
    {"id": "n_lvl2_c_08", "name": "Rotonda Norte", "level": 2, "coordinates": {"x": 660, "y": 260}, "context_element": "Zanati"},
    {"id": "n_lvl2_c_09", "name": "Rotonda Nororiente", "level": 2, "coordinates": {"x": 710, "y": 290}, "context_element": "Dportenis"},
    {"id": "n_lvl2_c_10", "name": "Rotonda Sur", "level": 2, "coordinates": {"x": 650, "y": 370}, "context_element": "Starbucks Coffee"},
    {"id": "n_lvl2_c_11", "name": "Rotonda Centro", "level": 2, "coordinates": {"x": 650, "y": 320}, "context_element": "Centro Rotonda"},

    # North Concourse (Towards Sfera / C&A / Sears)
    {"id": "n_lvl2_c_12", "name": "Pasillo Norte Dportenis", "level": 2, "coordinates": {"x": 750, "y": 270}, "context_element": "Dairy Queen"},
    {"id": "n_lvl2_c_13", "name": "Pasillo Sfera / C&A Poniente", "level": 2, "coordinates": {"x": 810, "y": 260}, "context_element": "C&A"},
    {"id": "n_lvl2_c_14", "name": "Pasillo Frente a Sfera", "level": 2, "coordinates": {"x": 880, "y": 250}, "context_element": "Sfera"},
    {"id": "n_lvl2_c_15", "name": "Pasillo Sfera Oriente", "level": 2, "coordinates": {"x": 960, "y": 250}, "context_element": "Sephora"},
    {"id": "n_lvl2_c_16", "name": "Pasillo Plaza Norte Sears", "level": 2, "coordinates": {"x": 1050, "y": 250}, "context_element": "H&M N1"},
    {"id": "n_lvl2_c_17", "name": "Acceso Norte Sears", "level": 2, "coordinates": {"x": 1150, "y": 260}, "context_element": "Sears Norte"},

    # Central-South Concourse (Starbucks -> Sanborns -> Chedraui -> Tótem 12 -> Sears)
    {"id": "n_lvl2_c_18", "name": "Pasillo Sanborns Poniente", "level": 2, "coordinates": {"x": 720, "y": 380}, "context_element": "Nutrisa"},
    {"id": "n_lvl2_c_19", "name": "Pasillo Frente a Sanborns", "level": 2, "coordinates": {"x": 790, "y": 390}, "context_element": "Sanborns"},
    {"id": "n_lvl2_c_20", "name": "Pasillo Chedraui / Sanborns", "level": 2, "coordinates": {"x": 870, "y": 420}, "context_element": "Chedraui Selecto"},
    {"id": "n_lvl2_c_21", "name": "Pasillo Delicrepé / Moyo", "level": 2, "coordinates": {"x": 920, "y": 450}, "context_element": "Moyo"},
    {"id": "n_lvl2_c_22", "name": "Pasillo Tótem Punto 12", "level": 2, "coordinates": {"x": 960, "y": 490}, "context_element": "M-Caps / Tótem Punto 12"},
    {"id": "n_lvl2_c_23", "name": "Pasillo Flexi / Sears Sur", "level": 2, "coordinates": {"x": 1040, "y": 470}, "context_element": "Flexi"},
    {"id": "n_lvl2_c_24", "name": "Acceso Escaleras Sears", "level": 2, "coordinates": {"x": 1130, "y": 460}, "context_element": "Escaleras Sears"},
    {"id": "n_lvl2_c_25", "name": "Plaza Sears Sur", "level": 2, "coordinates": {"x": 1200, "y": 440}, "context_element": "Sears Sur"},

    # Vertical Inter-Concourse link in front of Sears
    {"id": "n_lvl2_c_26", "name": "Pasillo Conector Sears", "level": 2, "coordinates": {"x": 1150, "y": 350}, "context_element": "Pasillo Sears"},
    {"id": "n_lvl2_c_27", "name": "Pasillo Automotriz Este", "level": 2, "coordinates": {"x": 1220, "y": 300}, "context_element": "Agencias Automotrices"}
]

# PLANTA 2 (L3) - Superior Concourse Network
corridors_lvl3 = [
    # Fast food & Entertainment (West)
    {"id": "n_lvl3_c_01", "name": "Pasillo Comida Rápida Poniente", "level": 3, "coordinates": {"x": 580, "y": 380}, "context_element": "Carl's Jr."},
    {"id": "n_lvl3_c_02", "name": "Pasillo Zona de Comida", "level": 3, "coordinates": {"x": 650, "y": 370}, "context_element": "Domino's / El Infierno"},
    {"id": "n_lvl3_c_03", "name": "Pasillo Monkey Bowling", "level": 3, "coordinates": {"x": 730, "y": 360}, "context_element": "Monkey Bowling"},
    
    # Central Hallway (Escalators from Rotonda)
    {"id": "n_lvl3_c_04", "name": "Pasillo Central Nivel 2", "level": 3, "coordinates": {"x": 800, "y": 340}, "context_element": "Escaleras Centrales"},
    {"id": "n_lvl3_c_05", "name": "Cruce Cinelia / Restaurantes", "level": 3, "coordinates": {"x": 870, "y": 300}, "context_element": "Fisher's / UNAGI"},
    
    # Cinelia Concourse (North-Center)
    {"id": "n_lvl3_c_06", "name": "Pasillo Acceso Cinelia", "level": 3, "coordinates": {"x": 920, "y": 240}, "context_element": "Taquilla Cinelia"},
    {"id": "n_lvl3_c_07", "name": "Frente a Salas Cinelia", "level": 3, "coordinates": {"x": 980, "y": 220}, "context_element": "Cinelia"},
    {"id": "n_lvl3_c_08", "name": "Acceso Escaleras Cinelia", "level": 3, "coordinates": {"x": 1030, "y": 220}, "context_element": "Escaleras Cinelia / Sears"},
    
    # Terrace & Casual Dining (South Loop)
    {"id": "n_lvl3_c_09", "name": "Pasillo Terraza Poniente", "level": 3, "coordinates": {"x": 920, "y": 420}, "context_element": "Mammut Pizza"},
    {"id": "n_lvl3_c_10", "name": "Pasillo Terraza Central", "level": 3, "coordinates": {"x": 1000, "y": 460}, "context_element": "Jana / Casa Paula"},
    {"id": "n_lvl3_c_11", "name": "Acceso Escaleras Terraza", "level": 3, "coordinates": {"x": 1050, "y": 480}, "context_element": "Escaleras Terraza"},

    # Business Center & Fitness (East Wing)
    {"id": "n_lvl3_c_12", "name": "Pasillo Centro de Negocios", "level": 3, "coordinates": {"x": 1100, "y": 320}, "context_element": "Centro de Negocios"},
    {"id": "n_lvl3_c_13", "name": "Pasillo Anytime Fitness", "level": 3, "coordinates": {"x": 1180, "y": 300}, "context_element": "Anytime Fitness"}
]

print(f"Defined {len(corridors_lvl1)} L1, {len(corridors_lvl2)} L2, {len(corridors_lvl3)} L3 smooth corridor waypoints.")

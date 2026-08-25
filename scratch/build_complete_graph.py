import json
import numpy as np

def build_graph():
    # --- LEVEL 1: PLANTA BAJA (NIVEL INFERIOR) ---
    lvl1_nodes = [
        # Anchor stores & Stores
        {"id": "n_lvl1_store_1", "level": 1, "type": "anchor_store", "name": "Liverpool", "coordinates": {"x": 383, "y": 472}, "context_element": None},
        {"id": "n_lvl1_store_2", "level": 1, "type": "store", "name": "Women'secret", "coordinates": {"x": 499, "y": 421}, "context_element": None},
        {"id": "n_lvl1_store_3", "level": 1, "type": "store", "name": "Springfield", "coordinates": {"x": 528, "y": 405}, "context_element": None},
        {"id": "n_lvl1_store_4", "level": 1, "type": "store", "name": "DpStreet", "coordinates": {"x": 555, "y": 392}, "context_element": None},
        {"id": "n_lvl1_store_5", "level": 1, "type": "store", "name": "Guess", "coordinates": {"x": 641, "y": 370}, "context_element": None},
        {"id": "n_lvl1_store_6", "level": 1, "type": "store", "name": "Studio F", "coordinates": {"x": 680, "y": 351}, "context_element": None},
        {"id": "n_lvl1_store_7", "level": 1, "type": "store", "name": "Natura", "coordinates": {"x": 712, "y": 338}, "context_element": None},
        {"id": "n_lvl1_store_8", "level": 1, "type": "store", "name": "American Eagle", "coordinates": {"x": 758, "y": 308}, "context_element": None},
        {"id": "n_lvl1_store_9", "level": 1, "type": "anchor_store", "name": "H&M", "coordinates": {"x": 897, "y": 470}, "context_element": None},
        {"id": "n_lvl1_store_10", "level": 1, "type": "store", "name": "Porrúa", "coordinates": {"x": 813, "y": 389}, "context_element": None},
        {"id": "n_lvl1_store_11", "level": 1, "type": "store", "name": "Adolfo Domínguez", "coordinates": {"x": 786, "y": 382}, "context_element": None},
        {"id": "n_lvl1_store_12", "level": 1, "type": "store", "name": "Pandora", "coordinates": {"x": 749, "y": 393}, "context_element": None},
        {"id": "n_lvl1_store_13", "level": 1, "type": "store", "name": "Tommy Hilfiger", "coordinates": {"x": 727, "y": 405}, "context_element": None},
        {"id": "n_lvl1_store_14", "level": 1, "type": "store", "name": "MAJA Sportwear", "coordinates": {"x": 701, "y": 420}, "context_element": None},
        {"id": "n_lvl1_store_15", "level": 1, "type": "store", "name": "Adidas", "coordinates": {"x": 666, "y": 443}, "context_element": None},
        {"id": "n_lvl1_store_16", "level": 1, "type": "store", "name": "Daily Pick", "coordinates": {"x": 625, "y": 461}, "context_element": None},
        {"id": "n_lvl1_store_17", "level": 1, "type": "store", "name": "Le Lieu", "coordinates": {"x": 605, "y": 477}, "context_element": None},
        {"id": "n_lvl1_store_18", "level": 1, "type": "store", "name": "AT&T", "coordinates": {"x": 621, "y": 532}, "context_element": None},
        {"id": "n_lvl1_store_19", "level": 1, "type": "store", "name": "Salomon", "coordinates": {"x": 633, "y": 554}, "context_element": None},
        {"id": "n_lvl1_store_20", "level": 1, "type": "store", "name": "BYD", "coordinates": {"x": 689, "y": 557}, "context_element": None},
        {"id": "n_lvl1_store_21", "level": 1, "type": "store", "name": "Banamex", "coordinates": {"x": 564, "y": 611}, "context_element": None},
        {"id": "n_lvl1_store_22", "level": 1, "type": "store", "name": "MacStore", "coordinates": {"x": 565, "y": 560}, "context_element": None},
        {"id": "n_lvl1_store_23", "level": 1, "type": "anchor_store", "name": "Fiesta Inn", "coordinates": {"x": 680, "y": 239}, "context_element": None},
        {"id": "n_lvl1_store_24", "level": 1, "type": "anchor_store", "name": "Crown City Casino", "coordinates": {"x": 1077, "y": 82}, "context_element": None},
        {"id": "n_lvl1_store_25", "level": 1, "type": "store", "name": "Honda", "coordinates": {"x": 1129, "y": 82}, "context_element": None},
        {"id": "n_lvl1_store_26", "level": 1, "type": "store", "name": "Geely", "coordinates": {"x": 1205, "y": 81}, "context_element": None},
        
        # Islas
        {"id": "n_lvl1_island_1", "level": 1, "type": "island", "name": "Casa Carcasa", "coordinates": {"x": 612, "y": 390}, "context_element": None},
        {"id": "n_lvl1_island_2", "level": 1, "type": "island", "name": "Jurassic Ride", "coordinates": {"x": 584, "y": 388}, "context_element": None},
        {"id": "n_lvl1_island_3", "level": 1, "type": "island", "name": "Flabelus", "coordinates": {"x": 783, "y": 342}, "context_element": None},
        
        # Próximamente
        {"id": "n_lvl1_store_27", "level": 1, "type": "store", "name": "Bath & Body Works (Próximamente)", "coordinates": {"x": 890, "y": 215}, "context_element": None},
        {"id": "n_lvl1_store_28", "level": 1, "type": "store", "name": "Sephora (Próximamente)", "coordinates": {"x": 885, "y": 261}, "context_element": None},
        
        # Servicios & Portales
        {"id": "n_lvl1_portal_esc_liverpool", "level": 1, "type": "portal_escalator", "name": "Escaleras Eléctricas Plaza Liverpool", "coordinates": {"x": 564, "y": 515}, "context_element": "Liverpool"},
        {"id": "n_lvl1_portal_elev_liverpool", "level": 1, "type": "portal_elevator", "name": "Elevador Plaza Liverpool", "coordinates": {"x": 598, "y": 538}, "context_element": "Liverpool"},
        {"id": "n_lvl1_portal_esc_central", "level": 1, "type": "portal_escalator", "name": "Escaleras Eléctricas Central", "coordinates": {"x": 787, "y": 250}, "context_element": "Fiesta Inn"},
        {"id": "n_lvl1_portal_elev_central", "level": 1, "type": "portal_elevator", "name": "Elevador Central", "coordinates": {"x": 789, "y": 268}, "context_element": "Fiesta Inn"},
        {"id": "n_lvl1_portal_esc_oval", "level": 1, "type": "portal_escalator", "name": "Escaleras Eléctricas Plaza Oval", "coordinates": {"x": 838, "y": 348}, "context_element": "H&M"},
        {"id": "n_lvl1_restroom_1", "level": 1, "type": "restroom", "name": "Sanitarios PB Central", "coordinates": {"x": 714, "y": 318}, "context_element": "Natura"},
        {"id": "n_lvl1_service_maint", "level": 1, "type": "service", "name": "Mantenimiento", "coordinates": {"x": 968, "y": 181}, "context_element": None},
        
        # Corridor Waypoints & Intersections (PB)
        {"id": "n_lvl1_corridor_liverpool", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 480, "y": 480}, "context_element": "Liverpool"},
        {"id": "n_lvl1_corridor_mid_west", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 560, "y": 440}, "context_element": "Jurassic Ride"},
        {"id": "n_lvl1_corridor_center", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 650, "y": 400}, "context_element": "Casa Carcasa"},
        {"id": "n_lvl1_corridor_mid_east", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 740, "y": 370}, "context_element": "Flabelus"},
        {"id": "n_lvl1_corridor_oval", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 820, "y": 350}, "context_element": "Plaza Oval"},
        {"id": "n_lvl1_corridor_fountain", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 820, "y": 250}, "context_element": "Fuente Central"},
        {"id": "n_lvl1_corridor_casino_bridge", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 980, "y": 150}, "context_element": "Crown City Casino"},
        {"id": "n_lvl1_corridor_south_branch", "level": 1, "type": "corridor_intersection", "name": None, "coordinates": {"x": 580, "y": 540}, "context_element": "MacStore / BYD"}
    ]

    # --- LEVEL 2: PLANTA 1 (NIVEL PRINCIPAL) ---
    lvl2_nodes = [
        # Anchor Stores
        {"id": "n_lvl2_store_1", "level": 2, "type": "anchor_store", "name": "Liverpool", "coordinates": {"x": 190, "y": 490}, "context_element": None},
        {"id": "n_lvl2_store_28", "level": 2, "type": "anchor_store", "name": "Sears", "coordinates": {"x": 1350, "y": 480}, "context_element": None},
        {"id": "n_lvl2_store_29", "level": 2, "type": "anchor_store", "name": "Chedraui Selecto", "coordinates": {"x": 1070, "y": 420}, "context_element": None},
        {"id": "n_lvl2_store_37", "level": 2, "type": "anchor_store", "name": "Sanborns", "coordinates": {"x": 815, "y": 478}, "context_element": None},
        {"id": "n_lvl2_store_42", "level": 2, "type": "anchor_store", "name": "H&M", "coordinates": {"x": 674, "y": 455}, "context_element": None},
        {"id": "n_lvl2_store_43", "level": 2, "type": "anchor_store", "name": "Inter Home", "coordinates": {"x": 525, "y": 560}, "context_element": None},
        
        # Stores 2-27
        {"id": "n_lvl2_store_2", "level": 2, "type": "store", "name": "5.11 Outdoor and Adventure", "coordinates": {"x": 303, "y": 422}, "context_element": None},
        {"id": "n_lvl2_store_3", "level": 2, "type": "store", "name": "Fame", "coordinates": {"x": 312, "y": 342}, "context_element": None},
        {"id": "n_lvl2_store_4", "level": 2, "type": "store", "name": "Telcel", "coordinates": {"x": 412, "y": 380}, "context_element": None},
        {"id": "n_lvl2_store_5", "level": 2, "type": "store", "name": "Watch 2 Go", "coordinates": {"x": 428, "y": 368}, "context_element": None},
        {"id": "n_lvl2_store_6", "level": 2, "type": "store", "name": "GNC", "coordinates": {"x": 448, "y": 355}, "context_element": None},
        {"id": "n_lvl2_store_7", "level": 2, "type": "store", "name": "Lids", "coordinates": {"x": 466, "y": 342}, "context_element": None},
        {"id": "n_lvl2_store_8", "level": 2, "type": "store", "name": "Hey Guapa", "coordinates": {"x": 484, "y": 330}, "context_element": None},
        {"id": "n_lvl2_store_9", "level": 2, "type": "store", "name": "La Casa de las Carcasas", "coordinates": {"x": 501, "y": 318}, "context_element": None},
        {"id": "n_lvl2_store_10", "level": 2, "type": "store", "name": "Urani", "coordinates": {"x": 522, "y": 308}, "context_element": None},
        {"id": "n_lvl2_store_11", "level": 2, "type": "store", "name": "Miniso", "coordinates": {"x": 565, "y": 305}, "context_element": None},
        {"id": "n_lvl2_store_12", "level": 2, "type": "store", "name": "Zanati", "coordinates": {"x": 594, "y": 238}, "context_element": None},
        {"id": "n_lvl2_store_13", "level": 2, "type": "store", "name": "Dportenis", "coordinates": {"x": 704, "y": 238}, "context_element": None},
        {"id": "n_lvl2_store_14", "level": 2, "type": "store", "name": "Sally Beauty", "coordinates": {"x": 725, "y": 242}, "context_element": None},
        {"id": "n_lvl2_store_15", "level": 2, "type": "store", "name": "Mi Cha", "coordinates": {"x": 740, "y": 242}, "context_element": None},
        {"id": "n_lvl2_store_16", "level": 2, "type": "store", "name": "Dairy Queen", "coordinates": {"x": 796, "y": 245}, "context_element": None},
        {"id": "n_lvl2_store_17", "level": 2, "type": "store", "name": "Sfera", "coordinates": {"x": 855, "y": 175}, "context_element": None},
        {"id": "n_lvl2_store_18", "level": 2, "type": "store", "name": "Honda", "coordinates": {"x": 938, "y": 178}, "context_element": None},
        {"id": "n_lvl2_store_19", "level": 2, "type": "store", "name": "Geely", "coordinates": {"x": 968, "y": 92}, "context_element": None},
        {"id": "n_lvl2_store_20", "level": 2, "type": "store", "name": "Smart Trampoline", "coordinates": {"x": 1055, "y": 148}, "context_element": None},
        {"id": "n_lvl2_store_21", "level": 2, "type": "store", "name": "Taller Creativo de Oscar Torres", "coordinates": {"x": 1119, "y": 175}, "context_element": None},
        {"id": "n_lvl2_store_22", "level": 2, "type": "store", "name": "Floristorio", "coordinates": {"x": 1119, "y": 158}, "context_element": None},
        {"id": "n_lvl2_store_23", "level": 2, "type": "store", "name": "Estrella Dorada", "coordinates": {"x": 1189, "y": 208}, "context_element": None},
        {"id": "n_lvl2_store_24", "level": 2, "type": "store", "name": "Showroom Fame", "coordinates": {"x": 1255, "y": 170}, "context_element": None},
        {"id": "n_lvl2_store_25", "level": 2, "type": "store", "name": "Toyota", "coordinates": {"x": 1348, "y": 235}, "context_element": None},
        {"id": "n_lvl2_store_26", "level": 2, "type": "store", "name": "Taller BYD", "coordinates": {"x": 1380, "y": 260}, "context_element": None},
        {"id": "n_lvl2_store_27", "level": 2, "type": "store", "name": "KIA", "coordinates": {"x": 1316, "y": 278}, "context_element": None},
        
        # Stores 30-50
        {"id": "n_lvl2_store_30", "level": 2, "type": "store", "name": "Palet", "coordinates": {"x": 1078, "y": 290}, "context_element": None},
        {"id": "n_lvl2_store_31", "level": 2, "type": "store", "name": "Dolphy", "coordinates": {"x": 992, "y": 348}, "context_element": None},
        {"id": "n_lvl2_store_32", "level": 2, "type": "store", "name": "Flexi", "coordinates": {"x": 912, "y": 470}, "context_element": None},
        {"id": "n_lvl2_store_33", "level": 2, "type": "store", "name": "New York Coffee", "coordinates": {"x": 912, "y": 440}, "context_element": None},
        {"id": "n_lvl2_store_34", "level": 2, "type": "store", "name": "Café Europa", "coordinates": {"x": 916, "y": 418}, "context_element": None},
        {"id": "n_lvl2_store_35", "level": 2, "type": "store", "name": "Vía Uno", "coordinates": {"x": 900, "y": 418}, "context_element": None},
        {"id": "n_lvl2_store_36", "level": 2, "type": "store", "name": "Beau", "coordinates": {"x": 880, "y": 418}, "context_element": None},
        {"id": "n_lvl2_store_38", "level": 2, "type": "store", "name": "Ópticas Kauffman", "coordinates": {"x": 805, "y": 390}, "context_element": None},
        {"id": "n_lvl2_store_39", "level": 2, "type": "store", "name": "Hill's Collection", "coordinates": {"x": 776, "y": 385}, "context_element": None},
        {"id": "n_lvl2_store_40", "level": 2, "type": "store", "name": "Nutrisa", "coordinates": {"x": 755, "y": 380}, "context_element": None},
        {"id": "n_lvl2_store_41", "level": 2, "type": "store", "name": "Ópticas Lux", "coordinates": {"x": 732, "y": 372}, "context_element": None},
        {"id": "n_lvl2_store_44", "level": 2, "type": "store", "name": "Banana Republic", "coordinates": {"x": 580, "y": 462}, "context_element": None},
        {"id": "n_lvl2_store_45", "level": 2, "type": "store", "name": "Fabletics", "coordinates": {"x": 580, "y": 400}, "context_element": None},
        {"id": "n_lvl2_store_46", "level": 2, "type": "store", "name": "GAP", "coordinates": {"x": 535, "y": 438}, "context_element": None},
        {"id": "n_lvl2_store_47", "level": 2, "type": "store", "name": "Steren", "coordinates": {"x": 490, "y": 450}, "context_element": None},
        {"id": "n_lvl2_store_48", "level": 2, "type": "store", "name": "Luuna", "coordinates": {"x": 465, "y": 468}, "context_element": None},
        {"id": "n_lvl2_store_49", "level": 2, "type": "store", "name": "Havoc", "coordinates": {"x": 428, "y": 482}, "context_element": None},
        {"id": "n_lvl2_store_50", "level": 2, "type": "store", "name": "Axen Health", "coordinates": {"x": 366, "y": 580}, "context_element": None},
        
        # Central strip stores 51-63
        {"id": "n_lvl2_store_51", "level": 2, "type": "store", "name": "Starbucks Coffee", "coordinates": {"x": 725, "y": 310}, "context_element": None},
        {"id": "n_lvl2_store_52", "level": 2, "type": "store", "name": "Enki's Barbería", "coordinates": {"x": 768, "y": 328}, "context_element": None},
        {"id": "n_lvl2_store_53", "level": 2, "type": "store", "name": "Todomoda", "coordinates": {"x": 786, "y": 330}, "context_element": None},
        {"id": "n_lvl2_store_54", "level": 2, "type": "store", "name": "Studio Mix", "coordinates": {"x": 810, "y": 335}, "context_element": None},
        {"id": "n_lvl2_store_55", "level": 2, "type": "store", "name": "Bizzarro", "coordinates": {"x": 838, "y": 340}, "context_element": None},
        {"id": "n_lvl2_store_56", "level": 2, "type": "store", "name": "Ben & Frank", "coordinates": {"x": 866, "y": 346}, "context_element": None},
        {"id": "n_lvl2_store_57", "level": 2, "type": "store", "name": "Yuscase", "coordinates": {"x": 892, "y": 350}, "context_element": None},
        {"id": "n_lvl2_store_58", "level": 2, "type": "store", "name": "Sunglass Hut", "coordinates": {"x": 918, "y": 355}, "context_element": None},
        {"id": "n_lvl2_store_59", "level": 2, "type": "store", "name": "Adidas", "coordinates": {"x": 912, "y": 318}, "context_element": None},
        {"id": "n_lvl2_store_60", "level": 2, "type": "store", "name": "Crocs", "coordinates": {"x": 885, "y": 315}, "context_element": None},
        {"id": "n_lvl2_store_61", "level": 2, "type": "store", "name": "Taste Top", "coordinates": {"x": 862, "y": 308}, "context_element": None},
        {"id": "n_lvl2_store_62", "level": 2, "type": "store", "name": "Di Luca Gelato Gourmet", "coordinates": {"x": 840, "y": 308}, "context_element": None},
        {"id": "n_lvl2_store_63", "level": 2, "type": "store", "name": "Pies & Salud", "coordinates": {"x": 818, "y": 305}, "context_element": None},
        
        # Islas 1-12
        {"id": "n_lvl2_island_1", "level": 2, "type": "island", "name": "De Regil Chocolat", "coordinates": {"x": 580, "y": 348}, "context_element": None},
        {"id": "n_lvl2_island_2", "level": 2, "type": "island", "name": "Elotería La Cerrada", "coordinates": {"x": 632, "y": 242}, "context_element": None},
        {"id": "n_lvl2_island_3", "level": 2, "type": "island", "name": "Casa Carcasa", "coordinates": {"x": 714, "y": 345}, "context_element": None},
        {"id": "n_lvl2_island_4", "level": 2, "type": "island", "name": "Mingos", "coordinates": {"x": 755, "y": 355}, "context_element": None},
        {"id": "n_lvl2_island_5", "level": 2, "type": "island", "name": "Straight A Head", "coordinates": {"x": 785, "y": 362}, "context_element": None},
        {"id": "n_lvl2_island_6", "level": 2, "type": "island", "name": "Olivia", "coordinates": {"x": 845, "y": 372}, "context_element": None},
        {"id": "n_lvl2_island_7", "level": 2, "type": "island", "name": "Obey Yourr Body", "coordinates": {"x": 875, "y": 380}, "context_element": None},
        {"id": "n_lvl2_island_8", "level": 2, "type": "island", "name": "M&L Joyas", "coordinates": {"x": 915, "y": 390}, "context_element": None},
        {"id": "n_lvl2_island_9", "level": 2, "type": "island", "name": "Delicrepé", "coordinates": {"x": 960, "y": 325}, "context_element": None},
        {"id": "n_lvl2_island_10", "level": 2, "type": "island", "name": "Moyo", "coordinates": {"x": 960, "y": 380}, "context_element": None},
        {"id": "n_lvl2_island_11", "level": 2, "type": "island", "name": "La Casa de las Carcasas", "coordinates": {"x": 960, "y": 435}, "context_element": None},
        {"id": "n_lvl2_island_12", "level": 2, "type": "island", "name": "M-Caps", "coordinates": {"x": 960, "y": 490}, "context_element": None},
        
        # Próximamente
        {"id": "n_lvl2_store_64", "level": 2, "type": "store", "name": "Coven (Próximamente)", "coordinates": {"x": 455, "y": 472}, "context_element": None},
        {"id": "n_lvl2_store_65", "level": 2, "type": "store", "name": "Telcel CAC (Próximamente)", "coordinates": {"x": 992, "y": 290}, "context_element": None},
        
        # Portales & Servicios
        {"id": "n_lvl2_portal_esc_liverpool", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Plaza Liverpool", "coordinates": {"x": 338, "y": 518}, "context_element": "Liverpool"},
        {"id": "n_lvl2_portal_elev_liverpool", "level": 2, "type": "portal_elevator", "name": "Elevador Plaza Liverpool", "coordinates": {"x": 412, "y": 518}, "context_element": "Liverpool"},
        {"id": "n_lvl2_portal_esc_rotunda_left", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Rotonda Izquierda", "coordinates": {"x": 605, "y": 325}, "context_element": "Rotonda Central"},
        {"id": "n_lvl2_portal_esc_rotunda_bot", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Rotonda Inferior", "coordinates": {"x": 625, "y": 360}, "context_element": "Rotonda Central"},
        {"id": "n_lvl2_portal_esc_rotunda_right", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Rotonda Derecha", "coordinates": {"x": 670, "y": 360}, "context_element": "Rotonda Central"},
        {"id": "n_lvl2_portal_esc_sanborns", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Sanborns", "coordinates": {"x": 635, "y": 560}, "context_element": "Sanborns"},
        {"id": "n_lvl2_portal_esc_sears", "level": 2, "type": "portal_escalator", "name": "Escaleras Eléctricas Sears", "coordinates": {"x": 1180, "y": 465}, "context_element": "Sears"},
        {"id": "n_lvl2_portal_elev_chedraui", "level": 2, "type": "portal_elevator", "name": "Elevador Chedraui", "coordinates": {"x": 1148, "y": 495}, "context_element": "Chedraui Selecto"},
        {"id": "n_lvl2_restroom_1", "level": 2, "type": "restroom", "name": "Sanitarios Fiesta Inn / Urani", "coordinates": {"x": 515, "y": 325}, "context_element": "Urani"},
        {"id": "n_lvl2_restroom_2", "level": 2, "type": "restroom", "name": "Sanitarios Plaza Sears", "coordinates": {"x": 1119, "y": 138}, "context_element": "Plaza Sears"},
        
        # Tótem Activo (Punto 12)
        {"id": "n_totem_12", "level": 2, "type": "totem", "name": "📍 Tótem Punto 12", "coordinates": {"x": 960, "y": 510}, "context_element": "M-Caps / Chedraui"},
        
        # Walkway Corridors Level 2
        {"id": "n_lvl2_corridor_liverpool", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 370, "y": 460}, "context_element": "Liverpool"},
        {"id": "n_lvl2_corridor_west_mid", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 480, "y": 400}, "context_element": "GAP / Steren"},
        {"id": "n_lvl2_corridor_rotunda_w", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 590, "y": 340}, "context_element": "Miniso"},
        {"id": "n_lvl2_corridor_rotunda_center", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 640, "y": 330}, "context_element": "Rotonda Central"},
        {"id": "n_lvl2_corridor_north_branch", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 750, "y": 270}, "context_element": "Dportenis / Dairy Queen"},
        {"id": "n_lvl2_corridor_sfera", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 880, "y": 250}, "context_element": "Sfera / Honda"},
        {"id": "n_lvl2_corridor_sears_plaza", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 1200, "y": 260}, "context_element": "Plaza Sears"},
        {"id": "n_lvl2_corridor_central_north", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 800, "y": 295}, "context_element": "Starbucks / Taste Top"},
        {"id": "n_lvl2_corridor_central_south", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 800, "y": 365}, "context_element": "Sanborns / Nutrisa"},
        {"id": "n_lvl2_corridor_chedraui_junc", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 960, "y": 350}, "context_element": "Chedraui / Moyo"},
        {"id": "n_lvl2_corridor_totem_12", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 960, "y": 460}, "context_element": "Tótem Punto 12"},
        {"id": "n_lvl2_corridor_sears_entrance", "level": 2, "type": "corridor_intersection", "name": None, "coordinates": {"x": 1240, "y": 440}, "context_element": "Sears"}
    ]

    # --- LEVEL 3: PLANTA 2 (NIVEL SUPERIOR) ---
    lvl3_nodes = [
        # Stores & Anchors (Exact pixel coordinates from planta-dos.png)
        {"id": "n_lvl3_store_1", "level": 3, "type": "store", "name": "Scio México", "coordinates": {"x": 618, "y": 208}, "context_element": None},
        {"id": "n_lvl3_store_2", "level": 3, "type": "anchor_store", "name": "GoKartManía", "coordinates": {"x": 744, "y": 106}, "context_element": None},
        {"id": "n_lvl3_store_3", "level": 3, "type": "anchor_store", "name": "Cinelia", "coordinates": {"x": 889, "y": 104}, "context_element": None},
        {"id": "n_lvl3_store_4", "level": 3, "type": "store", "name": "Julio Cepeda Jugueterías", "coordinates": {"x": 891, "y": 229}, "context_element": None},
        {"id": "n_lvl3_store_5", "level": 3, "type": "store", "name": "Monkey Bowling Bar", "coordinates": {"x": 1024, "y": 123}, "context_element": None},
        {"id": "n_lvl3_store_6", "level": 3, "type": "anchor_store", "name": "Anytime Fitness", "coordinates": {"x": 1149, "y": 163}, "context_element": None},
        {"id": "n_lvl3_store_7", "level": 3, "type": "anchor_store", "name": "Fisher's", "coordinates": {"x": 1279, "y": 311}, "context_element": None},
        {"id": "n_lvl3_store_8", "level": 3, "type": "store", "name": "UNAGI Teppan-Yaki & Sushi Bar", "coordinates": {"x": 1197, "y": 259}, "context_element": None},
        {"id": "n_lvl3_store_9", "level": 3, "type": "store", "name": "G-Work Space", "coordinates": {"x": 1016, "y": 350}, "context_element": None},
        {"id": "n_lvl3_store_10", "level": 3, "type": "store", "name": "Mammut Pizza", "coordinates": {"x": 1016, "y": 456}, "context_element": None},
        {"id": "n_lvl3_store_11", "level": 3, "type": "store", "name": "Jana", "coordinates": {"x": 969, "y": 457}, "context_element": None},
        {"id": "n_lvl3_store_12", "level": 3, "type": "store", "name": "Casa Paula", "coordinates": {"x": 935, "y": 458}, "context_element": None},
        {"id": "n_lvl3_store_13", "level": 3, "type": "store", "name": "Funki Squad", "coordinates": {"x": 774, "y": 453}, "context_element": None},
        {"id": "n_lvl3_store_14", "level": 3, "type": "store", "name": "Carl's Jr.", "coordinates": {"x": 749, "y": 339}, "context_element": None},
        {"id": "n_lvl3_store_15", "level": 3, "type": "store", "name": "Taquería El Infierno", "coordinates": {"x": 623, "y": 338}, "context_element": None},
        {"id": "n_lvl3_store_16", "level": 3, "type": "store", "name": "Inn Salata Express", "coordinates": {"x": 615, "y": 384}, "context_element": None},
        {"id": "n_lvl3_store_17", "level": 3, "type": "store", "name": "Mikono Sushi Bar", "coordinates": {"x": 605, "y": 401}, "context_element": None},
        {"id": "n_lvl3_store_18", "level": 3, "type": "store", "name": "La Cueva de Chucho", "coordinates": {"x": 593, "y": 415}, "context_element": None},
        {"id": "n_lvl3_store_19", "level": 3, "type": "store", "name": "Domino's Pizza", "coordinates": {"x": 578, "y": 427}, "context_element": None},
        {"id": "n_lvl3_store_20", "level": 3, "type": "store", "name": "Hong Kong Express", "coordinates": {"x": 563, "y": 437}, "context_element": None},
        {"id": "n_lvl3_store_21", "level": 3, "type": "store", "name": "Intelisis", "coordinates": {"x": 552, "y": 532}, "context_element": None},
        {"id": "n_lvl3_store_22", "level": 3, "type": "store", "name": "Grupo Altozano", "coordinates": {"x": 647, "y": 460}, "context_element": None},
        {"id": "n_lvl3_store_23", "level": 3, "type": "store", "name": "Showroom", "coordinates": {"x": 688, "y": 512}, "context_element": None},
        {"id": "n_lvl3_store_24", "level": 3, "type": "store", "name": "Erre Media", "coordinates": {"x": 776, "y": 510}, "context_element": None},
        {"id": "n_lvl3_store_25", "level": 3, "type": "store", "name": "Centro de Negocios", "coordinates": {"x": 684, "y": 236}, "context_element": None},
        {"id": "n_lvl3_store_26", "level": 3, "type": "store", "name": "Raspados Jalisco", "coordinates": {"x": 901, "y": 343}, "context_element": None},
        {"id": "n_lvl3_store_27", "level": 3, "type": "store", "name": "La Gofrera", "coordinates": {"x": 950, "y": 501}, "context_element": None},
        {"id": "n_lvl3_store_28", "level": 3, "type": "store", "name": "Wingstop", "coordinates": {"x": 975, "y": 501}, "context_element": None},
        
        # Próximamente
        {"id": "n_lvl3_store_29", "level": 3, "type": "store", "name": "A Mar y Pasta (Próximamente)", "coordinates": {"x": 942, "y": 356}, "context_element": None},
        
        # Servicios & Portales
        {"id": "n_lvl3_portal_esc_cinelia", "level": 3, "type": "portal_escalator", "name": "Escaleras Eléctricas Cinelia", "coordinates": {"x": 998, "y": 208}, "context_element": "Cinelia"},
        {"id": "n_lvl3_portal_elev_cinelia", "level": 3, "type": "portal_elevator", "name": "Elevador Cinelia", "coordinates": {"x": 1004, "y": 208}, "context_element": "Cinelia"},
        {"id": "n_lvl3_portal_esc_anytime", "level": 3, "type": "portal_escalator", "name": "Escaleras Eléctricas Anytime Fitness", "coordinates": {"x": 1220, "y": 300}, "context_element": "Anytime Fitness"},
        {"id": "n_lvl3_portal_esc_central_top", "level": 3, "type": "portal_escalator", "name": "Escaleras Eléctricas Central Norte", "coordinates": {"x": 820, "y": 338}, "context_element": "Carl's Jr."},
        {"id": "n_lvl3_portal_esc_central_bot", "level": 3, "type": "portal_escalator", "name": "Escaleras Eléctricas Central Sur", "coordinates": {"x": 847, "y": 382}, "context_element": "Funki Squad"},
        {"id": "n_lvl3_portal_esc_terrace", "level": 3, "type": "portal_escalator", "name": "Escaleras Eléctricas Terraza", "coordinates": {"x": 1022, "y": 487}, "context_element": "Terraza"},
        {"id": "n_lvl3_restroom_1", "level": 3, "type": "restroom", "name": "Sanitarios Cinelia", "coordinates": {"x": 996, "y": 173}, "context_element": "Cinelia"},
        {"id": "n_lvl3_restroom_2", "level": 3, "type": "restroom", "name": "Sanitarios Estacionamiento", "coordinates": {"x": 540, "y": 487}, "context_element": "Estacionamiento"},
        {"id": "n_lvl3_service_admin", "level": 3, "type": "service", "name": "Administración", "coordinates": {"x": 577, "y": 470}, "context_element": None},
        {"id": "n_lvl3_service_parking", "level": 3, "type": "service", "name": "Estacionamiento", "coordinates": {"x": 536, "y": 460}, "context_element": None},
        {"id": "n_lvl3_games_zone", "level": 3, "type": "service", "name": "Zona de Juegos", "coordinates": {"x": 948, "y": 400}, "context_element": None},
        
        # Walkway Corridors Level 3
        {"id": "n_lvl3_corridor_rotunda", "level": 3, "type": "corridor_intersection", "name": None, "coordinates": {"x": 600, "y": 280}, "context_element": "Rotonda Superior"},
        {"id": "n_lvl3_corridor_cinelia_front", "level": 3, "type": "corridor_intersection", "name": None, "coordinates": {"x": 895, "y": 260}, "context_element": "Cinelia"},
        {"id": "n_lvl3_corridor_central", "level": 3, "type": "corridor_intersection", "name": None, "coordinates": {"x": 830, "y": 350}, "context_element": "Zona Central"},
        {"id": "n_lvl3_corridor_terrace", "level": 3, "type": "corridor_intersection", "name": None, "coordinates": {"x": 1050, "y": 330}, "context_element": "Fisher's / Terraza"},
        {"id": "n_lvl3_corridor_food_court", "level": 3, "type": "corridor_intersection", "name": None, "coordinates": {"x": 650, "y": 380}, "context_element": "Taquería / Fast Food"}
    ]

    all_nodes = lvl1_nodes + lvl2_nodes + lvl3_nodes
    node_map = {n['id']: n for n in all_nodes}

    # --- EDGES CONSTRUCTION ---
    edges = []

    def add_bi_edge(u_id, v_id, custom_w=None, edge_type="walk"):
        u = node_map.get(u_id)
        v = node_map.get(v_id)
        if not u or not v:
            return
        if custom_w is not None:
            w = custom_w
        else:
            dx = u['coordinates']['x'] - v['coordinates']['x']
            dy = u['coordinates']['y'] - v['coordinates']['y']
            w = round(np.hypot(dx, dy), 1)
        edges.append({"from": u_id, "to": v_id, "weight": w, "type": edge_type})
        edges.append({"from": v_id, "to": u_id, "weight": w, "type": edge_type})

    # --- Level 1 Corridors ---
    add_bi_edge("n_lvl1_corridor_liverpool", "n_lvl1_corridor_mid_west")
    add_bi_edge("n_lvl1_corridor_mid_west", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_corridor_center", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_corridor_mid_east", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_corridor_oval", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_corridor_fountain", "n_lvl1_corridor_casino_bridge")
    add_bi_edge("n_lvl1_corridor_liverpool", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_corridor_south_branch", "n_lvl1_corridor_center")

    # Connect L1 stores to corridors
    add_bi_edge("n_lvl1_store_1", "n_lvl1_corridor_liverpool")
    add_bi_edge("n_lvl1_store_2", "n_lvl1_corridor_liverpool")
    add_bi_edge("n_lvl1_store_3", "n_lvl1_corridor_mid_west")
    add_bi_edge("n_lvl1_store_4", "n_lvl1_corridor_mid_west")
    add_bi_edge("n_lvl1_island_2", "n_lvl1_corridor_mid_west")
    add_bi_edge("n_lvl1_store_5", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_store_6", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_island_1", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_store_16", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_store_15", "n_lvl1_corridor_center")
    add_bi_edge("n_lvl1_store_14", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_store_13", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_store_12", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_store_7", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_restroom_1", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_island_3", "n_lvl1_corridor_mid_east")
    add_bi_edge("n_lvl1_store_8", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_store_9", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_store_10", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_store_11", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_portal_esc_oval", "n_lvl1_corridor_oval")
    add_bi_edge("n_lvl1_store_23", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_store_27", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_store_28", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_portal_esc_central", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_portal_elev_central", "n_lvl1_corridor_fountain")
    add_bi_edge("n_lvl1_service_maint", "n_lvl1_corridor_casino_bridge")
    add_bi_edge("n_lvl1_store_24", "n_lvl1_corridor_casino_bridge")
    add_bi_edge("n_lvl1_store_25", "n_lvl1_corridor_casino_bridge")
    add_bi_edge("n_lvl1_store_26", "n_lvl1_corridor_casino_bridge")
    add_bi_edge("n_lvl1_store_17", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_store_18", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_store_19", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_store_20", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_store_21", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_store_22", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_portal_esc_liverpool", "n_lvl1_corridor_south_branch")
    add_bi_edge("n_lvl1_portal_elev_liverpool", "n_lvl1_corridor_south_branch")

    # --- Level 2 Corridors ---
    add_bi_edge("n_lvl2_corridor_liverpool", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_corridor_west_mid", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_corridor_rotunda_w", "n_lvl2_corridor_rotunda_center")
    add_bi_edge("n_lvl2_corridor_rotunda_center", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_corridor_north_branch", "n_lvl2_corridor_sfera")
    add_bi_edge("n_lvl2_corridor_sfera", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_corridor_rotunda_center", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_corridor_rotunda_center", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_corridor_central_north", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_corridor_central_south", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_corridor_chedraui_junc", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_corridor_totem_12", "n_lvl2_corridor_sears_entrance")
    add_bi_edge("n_lvl2_corridor_sears_plaza", "n_lvl2_corridor_sears_entrance")

    # Connect L2 stores to corridors
    add_bi_edge("n_lvl2_store_1", "n_lvl2_corridor_liverpool")
    add_bi_edge("n_lvl2_store_2", "n_lvl2_corridor_liverpool")
    add_bi_edge("n_lvl2_store_3", "n_lvl2_corridor_liverpool")
    add_bi_edge("n_lvl2_store_50", "n_lvl2_corridor_liverpool")
    add_bi_edge("n_lvl2_portal_esc_liverpool", "n_lvl2_corridor_liverpool")
    add_bi_edge("n_lvl2_portal_elev_liverpool", "n_lvl2_corridor_liverpool")
    
    add_bi_edge("n_lvl2_store_4", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_5", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_6", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_7", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_49", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_48", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_47", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_46", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_64", "n_lvl2_corridor_west_mid")
    add_bi_edge("n_lvl2_store_43", "n_lvl2_corridor_west_mid")

    add_bi_edge("n_lvl2_store_8", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_store_9", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_store_10", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_store_11", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_store_45", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_store_44", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_island_1", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_restroom_1", "n_lvl2_corridor_rotunda_w")
    add_bi_edge("n_lvl2_portal_esc_rotunda_left", "n_lvl2_corridor_rotunda_w")

    add_bi_edge("n_lvl2_portal_esc_rotunda_bot", "n_lvl2_corridor_rotunda_center")
    add_bi_edge("n_lvl2_portal_esc_rotunda_right", "n_lvl2_corridor_rotunda_center")
    add_bi_edge("n_lvl2_store_42", "n_lvl2_corridor_rotunda_center")
    add_bi_edge("n_lvl2_island_2", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_store_12", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_store_13", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_store_14", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_store_15", "n_lvl2_corridor_north_branch")
    add_bi_edge("n_lvl2_store_16", "n_lvl2_corridor_north_branch")

    add_bi_edge("n_lvl2_store_17", "n_lvl2_corridor_sfera")
    add_bi_edge("n_lvl2_store_18", "n_lvl2_corridor_sfera")
    add_bi_edge("n_lvl2_store_19", "n_lvl2_corridor_sfera")
    add_bi_edge("n_lvl2_store_20", "n_lvl2_corridor_sfera")

    add_bi_edge("n_lvl2_store_21", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_22", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_23", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_24", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_25", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_26", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_store_27", "n_lvl2_corridor_sears_plaza")
    add_bi_edge("n_lvl2_restroom_2", "n_lvl2_corridor_sears_plaza")

    # Central strip north
    add_bi_edge("n_lvl2_store_51", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_store_63", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_store_62", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_store_61", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_store_60", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_store_59", "n_lvl2_corridor_central_north")

    # Central strip south & Sanborns
    add_bi_edge("n_lvl2_store_37", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_38", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_39", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_40", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_41", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_52", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_53", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_54", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_55", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_56", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_57", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_store_58", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_portal_esc_sanborns", "n_lvl2_corridor_central_south")

    # Islands along corridor
    add_bi_edge("n_lvl2_island_3", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_island_4", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_island_5", "n_lvl2_corridor_central_north")
    add_bi_edge("n_lvl2_island_6", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_island_7", "n_lvl2_corridor_central_south")
    add_bi_edge("n_lvl2_island_8", "n_lvl2_corridor_central_south")

    # Chedraui junction & Totem area
    add_bi_edge("n_lvl2_store_29", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_store_30", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_store_31", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_store_65", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_island_9", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_island_10", "n_lvl2_corridor_chedraui_junc")
    add_bi_edge("n_lvl2_island_11", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_island_12", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_totem_12", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_store_32", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_store_33", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_store_34", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_store_35", "n_lvl2_corridor_totem_12")
    add_bi_edge("n_lvl2_store_36", "n_lvl2_corridor_totem_12")

    # Sears junction
    add_bi_edge("n_lvl2_store_28", "n_lvl2_corridor_sears_entrance")
    add_bi_edge("n_lvl2_portal_esc_sears", "n_lvl2_corridor_sears_entrance")
    add_bi_edge("n_lvl2_portal_elev_chedraui", "n_lvl2_corridor_sears_entrance")

    # --- Level 3 Corridors ---
    add_bi_edge("n_lvl3_corridor_rotunda", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_corridor_cinelia_front", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_corridor_central", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_corridor_rotunda", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_corridor_food_court", "n_lvl3_corridor_central")

    # Connect L3 stores to corridors
    add_bi_edge("n_lvl3_store_1", "n_lvl3_corridor_rotunda")
    add_bi_edge("n_lvl3_store_25", "n_lvl3_corridor_rotunda")
    add_bi_edge("n_lvl3_store_2", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_store_3", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_store_4", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_store_5", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_portal_esc_cinelia", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_portal_elev_cinelia", "n_lvl3_corridor_cinelia_front")
    add_bi_edge("n_lvl3_restroom_1", "n_lvl3_corridor_cinelia_front")

    add_bi_edge("n_lvl3_store_6", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_store_7", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_store_8", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_store_9", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_portal_esc_anytime", "n_lvl3_corridor_terrace")
    add_bi_edge("n_lvl3_portal_esc_terrace", "n_lvl3_corridor_terrace")

    add_bi_edge("n_lvl3_store_10", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_11", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_12", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_13", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_14", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_26", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_27", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_28", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_store_29", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_games_zone", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_portal_esc_central_top", "n_lvl3_corridor_central")
    add_bi_edge("n_lvl3_portal_esc_central_bot", "n_lvl3_corridor_central")

    add_bi_edge("n_lvl3_store_15", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_16", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_17", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_18", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_19", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_20", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_21", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_22", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_23", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_store_24", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_service_admin", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_service_parking", "n_lvl3_corridor_food_court")
    add_bi_edge("n_lvl3_restroom_2", "n_lvl3_corridor_food_court")

    # --- INTER-FLOOR PORTAL CONNECTIONS ---
    # Liverpool Vertical Link (L1 <-> L2)
    add_bi_edge("n_lvl1_portal_esc_liverpool", "n_lvl2_portal_esc_liverpool", custom_w=50, edge_type="escalator")
    add_bi_edge("n_lvl1_portal_elev_liverpool", "n_lvl2_portal_elev_liverpool", custom_w=80, edge_type="elevator")

    # Central Escalators (L1 <-> L2, L2 <-> L3)
    add_bi_edge("n_lvl1_portal_esc_central", "n_lvl2_portal_esc_rotunda_left", custom_w=50, edge_type="escalator")
    add_bi_edge("n_lvl1_portal_elev_central", "n_lvl2_portal_elev_chedraui", custom_w=80, edge_type="elevator")
    add_bi_edge("n_lvl2_portal_esc_rotunda_bot", "n_lvl3_portal_esc_central_bot", custom_w=50, edge_type="escalator")
    add_bi_edge("n_lvl2_portal_esc_rotunda_right", "n_lvl3_portal_esc_central_top", custom_w=50, edge_type="escalator")

    # Sears & Cinelia Vertical Links (L2 <-> L3)
    add_bi_edge("n_lvl2_portal_esc_sears", "n_lvl3_portal_esc_cinelia", custom_w=50, edge_type="escalator")
    add_bi_edge("n_lvl2_portal_elev_chedraui", "n_lvl3_portal_elev_cinelia", custom_w=80, edge_type="elevator")
    add_bi_edge("n_lvl2_portal_esc_sanborns", "n_lvl3_portal_esc_terrace", custom_w=50, edge_type="escalator")

    graph_data = {
        "metadata": {
            "version": "2.0",
            "name": "Paseo Altozano Interactive Navigation Graph",
            "total_nodes": len(all_nodes),
            "total_edges": len(edges)
        },
        "nodes": all_nodes,
        "edges": edges
    }

    with open('mall_graph.json', 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, indent=2, ensure_ascii=False)

    print(f"Generated mall_graph.json: {len(all_nodes)} nodes, {len(edges)} edges.")

if __name__ == '__main__':
    build_graph()

def get_terrain_costs_by_name():
    return { 
            'water': 20, 
            'sand': 10, 
            'grass': 5, 
            'forest': 10, 
            'mountain': 10, 
            'road': 1, 
            'wall': 0
        }

def get_terrain_costs_by_index():
    costs = get_terrain_costs_by_name()
    # Define costs based on your terrain types
    return { 
        0: costs['water'], 
        1: costs['sand'], 
        2: costs['grass'], 
        3: costs['forest'], 
        4: costs['mountain'], 
        5: costs['road'], 
        6: costs['wall']
    }
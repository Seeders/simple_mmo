overworld_map_types = ['ocean','river', 'coast', 'grass',  'desert',  'forest', 'mountain', 'volcanic', 'mystical', 'ruins']

perimeter_type = 0

overworld_size = 32

perimeter_size = 5

def player_overworld_start_position():
    map_size = overworld_size
    return { 'x': map_size / 2, 'y': map_size - 7 }


terrain_weights = {
    'ocean': {
        'ocean': 50, 'coast': 25, 'river': 5, 'grass': 0, 'forest': 0, 'desert': 0, 'mountain': 0, 'ruins': 0, 'mystical': 0, 'volcanic': 0
    },
    'coast': {
        'ocean': 20, 'coast': 40, 'river': 5, 'grass': 40, 'forest': 0, 'desert': 0, 'mountain': 0, 'ruins': 0, 'mystical': 0, 'volcanic': 0
    },
    'river': {
       'ocean': 0, 'coast': 25, 'river': 5, 'grass': 30, 'forest': 10, 'desert': 0, 'mountain': 5, 'ruins': 0, 'mystical': 0, 'volcanic': 0
    },
    'grass': {
        'ocean': 0, 'coast': 10, 'river': 3, 'grass': 30, 'forest': 25, 'desert': 5, 'mountain': 5, 'ruins': 0, 'mystical': 0, 'volcanic': 0
    },
    'forest': {
        'ocean': 0, 'coast': 0, 'river': 2, 'grass': 25, 'forest': 40, 'desert': 0, 'mountain': 10, 'ruins': 1, 'mystical': 0, 'volcanic': 0
    },
    'desert': {
        'ocean': 0, 'coast': 0, 'river': 1, 'grass': 5, 'forest': 0, 'desert': 50, 'mountain': 5, 'ruins': 1, 'mystical': 1, 'volcanic': 0
    },
    'mountain': {
        'ocean': 0, 'coast': 0, 'river': 1, 'grass': 10, 'forest': 15, 'desert': 25, 'mountain': 40, 'ruins': 1, 'mystical': 0, 'volcanic': 0
    },
    'ruins': {
        'ocean': 0, 'coast': 0, 'river': 0, 'grass': 10, 'forest': 20, 'desert': 5, 'mountain': 10, 'ruins': 50, 'mystical': 5, 'volcanic': 0
    },
    'mystical': {
        'ocean': 0, 'coast': 0, 'river': 0, 'grass': 0, 'forest': 20, 'desert': 0, 'mountain': 10, 'ruins': 20, 'mystical': 50, 'volcanic': 0
    },
    'volcanic': {
        'ocean': 0, 'coast': 0, 'river': 0, 'grass': 0, 'forest': 0, 'desert': 20, 'mountain': 30, 'ruins': 0, 'mystical': 0, 'volcanic': 50
    }
}

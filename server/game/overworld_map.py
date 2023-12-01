class OverworldMap:
    def __init__(self, size):
        self.size = size        
        self.tiles = [[OverworldTile("empty") for _ in range(size)] for _ in range(size)]

    def get_tile(self, x, y):
        return self.tiles[y][x]

    # Additional methods to manipulate or query the overworld map can be added here
class OverworldTile:
    def __init__(self, tile_type, explored=False):
        self.tile_type = tile_type
        self.explored = explored
        # Additional properties like difficulty, resources, etc., can be added here


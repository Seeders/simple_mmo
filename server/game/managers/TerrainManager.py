import random
from ..config.world_size import world_size
from ..terrain import Terrain
from ..config.terrain_layers import terrain_layers
from ..config.terrain_costs import get_terrain_costs_by_name, get_terrain_costs_by_index
class TerrainManager:
    def __init__(self, world):        
        self.world = world
        w_size = world_size()
        self.terrain = Terrain(w_size, w_size)         
        self.terrain_layers = terrain_layers()
        self.terrain_costs_by_name = get_terrain_costs_by_name()
        self.terrain_costs_by_index = get_terrain_costs_by_index()        
        self.ramps = []

    def generate_ramps(self):
        terrain = self.terrain.terrain
        ramp_candidates = []

        for y in range(len(terrain)):
            for x in range(len(terrain[0])):
                if self.is_border_tile(x, y, 'grass', 'forest'):
                    ramp_candidates.append({'x': x, 'y': y})

        num_ramps = random.randint(1, len(ramp_candidates) // 2)  # Adjust the number of ramps as needed
        for _ in range(num_ramps):
            ramp_tile = random.choice(ramp_candidates)
            ramp_candidates.remove(ramp_tile)
            self.place_ramp(ramp_tile)
    
    

    def is_border_tile(self, x, y, type1, type2):
        terrain = self.terrain.terrain
        current_type = self.terrain_layers[terrain[y][x]]

        if current_type != type1 and current_type != type2:
            return False

        # Check horizontal neighbors (left and right)
        if 0 <= x - 1 < len(terrain[0]) and 0 <= x + 1 < len(terrain[0]):
            left_type = self.terrain_layers[terrain[y][x - 1]]
            right_type = self.terrain_layers[terrain[y][x + 1]]
            if current_type == left_type == right_type == type2:
                # Check vertical neighbors (top and bottom)
                if 0 <= y - 1 < len(terrain) and 0 <= y + 1 < len(terrain):
                    top_type = self.terrain_layers[terrain[y - 1][x]]
                    bottom_type = self.terrain_layers[terrain[y + 1][x]]
                    if (top_type != bottom_type) and (top_type == type1 or top_type == type2) and (bottom_type == type1 or bottom_type == type2):
                        return True

        # Check vertical neighbors (top and bottom)
        if 0 <= y - 1 < len(terrain) and 0 <= y + 1 < len(terrain):
            top_type = self.terrain_layers[terrain[y - 1][x]]
            bottom_type = self.terrain_layers[terrain[y + 1][x]]
            if current_type == top_type == bottom_type == type2:
                # Check horizontal neighbors (left and right)
                if 0 <= x - 1 < len(terrain[0]) and 0 <= x + 1 < len(terrain[0]):
                    left_type = self.terrain_layers[terrain[y][x - 1]]
                    right_type = self.terrain_layers[terrain[y][x + 1]]
                    if (left_type != right_type) and (left_type == type1 or left_type == type2) and (right_type == type1 or right_type == type2):
                        return True

        return False


    def place_ramp(self, position):
        # Update the terrain data to reflect a ramp at the given position
        # This might involve setting a specific value or flag in the terrain array
        # Example:
        treeIndex = self.world.is_tree_at_position(position)
        if treeIndex >= 0:
            self.world.tree_manager.remove_tree_at_index(treeIndex)
        self.ramps.append(position)
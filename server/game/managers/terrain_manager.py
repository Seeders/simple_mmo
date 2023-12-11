import random
from ..config.world_size import world_size
from ..terrain import Terrain
from ..config.terrain_layers import terrain_layers
from ..config.terrain_costs import get_terrain_costs_by_name, get_terrain_costs_by_index
class TerrainManager:
    def __init__(self, world):        
        self.world = world
        w_size = world_size
        self.terrain = Terrain(w_size, w_size)         
        self.terrain_layers = terrain_layers
        self.terrain_costs_by_name = get_terrain_costs_by_name()
        self.terrain_costs_by_index = get_terrain_costs_by_index()        
        self.ramps = []

    def map_world(self):
        self.tree_manager = self.world.tree_manager
        self.road_manager = self.world.road_manager

    def init(self):
        self.map_world()   
        self.generate_ramps()

    def generate_ramps(self):
        terrain = self.terrain.terrain
        ramp_candidates = []

        for y in range(len(terrain)):
            for x in range(len(terrain[0])):
                if self.is_border_tile(x, y, 'grass', 'forest'):
                    ramp_candidates.append({'x': x, 'y': y})

        if len(ramp_candidates) > 0:
            num_ramps = random.randint(1, len(ramp_candidates) // 2)  # Adjust the number of ramps as needed
            for _ in range(num_ramps):
                ramp_tile = random.choice(ramp_candidates)
                ramp_candidates.remove(ramp_tile)
                self.place_ramp(ramp_tile)
    
    def is_land(self, x, y):
        world_map = self.terrain.terrain
        if 0 <= y < len(world_map) and 0 <= x < len(world_map[0]):
            return self.terrain_layers[world_map[y][x]] != 'water'
        else:
            return False  # Out of bounds, treat as non-land

    def is_ramp_at_position(self, position):
        for index, ramp in enumerate(self.ramps):
            # Convert position dictionary to a tuple for comparison
            if position == ramp:
                return index
        return -1

    
    def is_position_valid(self, position):
        x = int(position['x'])
        y = int(position['y'])
        terrain = self.terrain.terrain

        if x < 0 or y < 0 or x >= len(terrain[0]) or y >= len(terrain):
            return False

        terrain_type = self.terrain_layers[terrain[y][x]]
        if terrain_type == 'water' and not self.road_manager.is_road_at_position(position):
            return False

        return True

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
        treeIndex = self.tree_manager.is_tree_at_position(position)
        if treeIndex >= 0:
            self.tree_manager.remove_tree_at_index(treeIndex)
        self.ramps.append(position)

    

    
    def is_tile_type_nearby(self, tile_type, position):
        """
        Checks if the specified tile type is in the neighboring tiles of the given position.

        :param tile_type: The type of tile to check for.
        :param position: Dictionary with 'x' and 'y' keys representing the building position.
        :return: Boolean indicating if the specified tile type is nearby.
        """
        x, y = position['x'], position['y']
        terrain = self.terrain.terrain

        # Check each direction: up, down, left, right
        directions = [(0, -1), (0, 1), (-1, 0), (1, 0)]
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy

            # Check if the new position is within the bounds of the terrain
            if 0 <= new_x < len(terrain) and 0 <= new_y < len(terrain[0]):
                if terrain[new_y][new_x] == tile_type:
                    return True

        return False

    def tile_type_id_at_position(self, position):
        if 0 <= position['x'] < len(self.terrain.terrain) and 0 <= position['y'] < len(self.terrain.terrain[0]):
            return self.terrain.terrain[position['y']][position['x']]
        return 0

    def tile_type_at_position(self, position):
        if 0 <= position['x'] < len(self.terrain.terrain) and 0 <= position['y'] < len(self.terrain.terrain[0]):
            return self.terrain_layers[self.terrain.terrain[position['y']][position['x']]]
        return 0



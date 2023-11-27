from .config.world_size import world_size
from utils.utils import position_to_tuple
from utils.SpatialGrid import SpatialGrid
from utils.Pathfinding import Pathfinding
from .managers.TerrainManager import TerrainManager
from .managers.TownManager import TownManager
from .managers.RoadManager import RoadManager
from .managers.FactionManager import FactionManager
from .managers.PlayerManager import PlayerManager
from .managers.NPCManager import NPCManager
from .managers.TreeManager import TreeManager
from .managers.StoneManager import StoneManager
from .config.terrain_costs import get_terrain_costs_by_index

class World:
    def __init__(self, game_manager):
        w_size = world_size()
        self.game_manager = game_manager
        self.terrain_manager = TerrainManager(self)
        self.tree_manager = TreeManager(self)
        self.stone_manager = StoneManager(self)
        self.player_manager = PlayerManager(self)
        self.spacial_grid = SpatialGrid(w_size, w_size, 1)
        self.pathfinder = Pathfinding(self.terrain_manager.terrain.terrain, get_terrain_costs_by_index()) 
        self.town_manager = TownManager(self)
        self.road_manager = RoadManager(self)
        self.faction_manager = FactionManager(self)
        self.npc_manager = NPCManager(self)
        self.terrain_manager.generate_ramps()
        self.tree_manager.remove_trees_on_roads()   
        self.tree_manager.update_tree_indices()   
        self.items_on_ground = {}     
    
    def update(self, current_time):
        pass

    def find_path(self, start, goal):
        type1 = "forest"
        type2 = "grass"
        if self.terrain_manager.terrain_layers[self.terrain_manager.terrain.terrain[start['y']][start['x']]] == "forest": 
            type1 = "grass"
            type2 = "forest"
        
        tempTerrain = []
        for i in range(len(self.terrain_manager.terrain.terrain)):
            tempTerrain.append([])
            for j in range(len(self.terrain_manager.terrain.terrain[i])):
                tempTerrain[i].append(self.terrain_manager.terrain.terrain[i][j])
                #Check if the current tile is a forest tile
                if len(self.terrain_manager.terrain_layers) > tempTerrain[i][j] and self.terrain_manager.terrain_layers[tempTerrain[i][j]] == type1:
                    #Check the neighboring tiles in cardinal directions
                    for dy in range(-1, 2):
                        for dx in range(-1, 2):
                            #Skip diagonal neighbors and the current tile itself
                            if abs(dy) == abs(dx):
                                continue
                
                            #Ensure we don't go out of bounds
                            if i + dy >= 0 and i + dy < len(self.terrain_manager.terrain.terrain) and j + dx >= 0 and j + dx < len(self.terrain_manager.terrain.terrain[i]):
                                #Check if the neighboring tile is grass
                                if self.terrain_manager.terrain_layers[self.terrain_manager.terrain.terrain[i + dy][j + dx]] == type2:
                                    tempTerrain[i][j] = self.terrain_manager.terrain_layers.index('wall')   #Update the current tile type to 8
                                    break #No need to check other neighbors once we find grass
                        
                        if tempTerrain[i][j] == self.terrain_manager.terrain_layers.index('wall'):
                            break #Break the outer loop as well if we've updated the tile
            
        
        for i in range(len(self.terrain_manager.ramps)):
            ramp = self.terrain_manager.ramps[i]
            tempTerrain[ramp['y']][ramp['x']] = self.terrain_manager.terrain_layers.index('forest')   
            for dy in range(-1, 2):
                for dx in range(-1, 2):
                    # Skip diagonal neighbors and the current tile itself
                    if abs(dy) == abs(dx):
                        continue
                            
                    # Ensure we don't go out of bounds
                    if ramp['y'] + dy >= 0 and ramp['y'] + dy < len(self.terrain_manager.terrain.terrain) and ramp['x'] + dx >= 0 and ramp['x'] + dx < len(self.terrain_manager.terrain.terrain[ramp['y']]):
                        # Check if the neighboring tile is grass
                        if self.terrain_manager.terrain_layers[self.terrain_manager.terrain.terrain[ramp['y'] + dy][ramp['x'] + dx]] == "grass":
                            tempTerrain[ramp['y'] + dy][ramp['x'] + dx] = self.terrain_manager.terrain_layers.index('grass')   
            
        
        for i in range(len(self.road_manager.roads)):
            for j in range(len(self.road_manager.roads[i])):
                road = self.road_manager.roads[i][j]
                tempTerrain[road[1]][road[0]] = self.terrain_manager.terrain_layers.index('road')           
        
        for i in range(len(self.tree_manager.trees)):
            tree = self.tree_manager.trees[i]
            if tree['health'] > 0 and tree['type'] != 'stump' and not tree['position'] == start:
                tempTerrain[tree['position']['y']][tree['position']['x']] = self.terrain_manager.terrain_layers.index('wall')                        
        
        for i in range(len(self.stone_manager.stones)):
            stone = self.stone_manager.stones[i]
            tempTerrain[stone['position']['y']][stone['position']['x']] = self.terrain_manager.terrain_layers.index('wall')                  
       
        self.pathfinder = Pathfinding(tempTerrain, get_terrain_costs_by_index())
        path = self.pathfinder.a_star(position_to_tuple(start), position_to_tuple(goal))
        
        return path

  
    def is_land(self, x, y):
        world_map = self.terrain_manager.terrain.terrain
        if 0 <= y < len(world_map) and 0 <= x < len(world_map[0]):
            return self.terrain_manager.terrain_layers[world_map[y][x]] != 'water'
        else:
            return False  # Out of bounds, treat as non-land


    def is_position_valid(self, position):
        x = int(position['x'])
        y = int(position['y'])
        terrain = self.terrain_manager.terrain.terrain

        if x < 0 or y < 0 or x >= len(terrain[0]) or y >= len(terrain):
            return False

        terrain_type = self.terrain_manager.terrain_layers[terrain[y][x]]
        if terrain_type == 'water' and not self.is_road_at_position(position):
            return False

        return True

    def is_road_at_position(self, position):
        return self.road_manager.is_road_at_position(position)
    
    def is_town_at_position(self, position):
        for town in self.town_manager.towns:
            if position == town.position:
                return True
        return False

    def is_tree_at_position(self, position):
        for index, tree in enumerate(self.tree_manager.trees):
            # Convert position dictionary to a tuple for comparison
            if position == tree['position']:
                return index
        return -1
    
    def is_stone_at_position(self, position):
        for index, stone in enumerate(self.stone_manager.stones):
            # Convert position dictionary to a tuple for comparison
            if position == stone['position']:
                return index
        return -1
    
    def is_ramp_at_position(self, position):
        for index, ramp in enumerate(self.terrain_manager.ramps):
            # Convert position dictionary to a tuple for comparison
            if position == ramp:
                return index
        return -1

    def is_building_at_position(self, position):
        for tindex, town in enumerate(self.town_manager.towns):
            # Convert position dictionary to a tuple for comparison
            coordinate = {'x': position['x'], 'y': position['y']}
            for building_index, building_id in enumerate(town.layout):
                building = town.layout[building_id]
                if coordinate == building.position:
                    return (tindex, building_id)
        return (-1, -1)
    
    
    def is_tile_type_nearby(self, tile_type, position):
        """
        Checks if the specified tile type is in the neighboring tiles of the given position.

        :param tile_type: The type of tile to check for.
        :param position: Dictionary with 'x' and 'y' keys representing the building position.
        :return: Boolean indicating if the specified tile type is nearby.
        """
        x, y = position['x'], position['y']
        terrain = self.terrain_manager.terrain.terrain

        # Check each direction: up, down, left, right
        directions = [(0, -1), (0, 1), (-1, 0), (1, 0)]
        for dx, dy in directions:
            new_x, new_y = x + dx, y + dy

            # Check if the new position is within the bounds of the terrain
            if 0 <= new_x < len(terrain) and 0 <= new_y < len(terrain[0]):
                if terrain[new_y][new_x] == tile_type:
                    return True

        return False

    def tile_type_at_position(self, position):
        if 0 <= position['x'] < len(self.terrain_manager.terrain.terrain) and 0 <= position['y'] < len(self.terrain_manager.terrain.terrain[0]):
            return self.terrain_manager.terrain_layers[self.terrain_manager.terrain.terrain[position['y']][position['x']]]
        return 0



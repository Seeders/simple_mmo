from .config.world_size import world_size
from utils.utils import position_to_tuple
from utils.SpatialGrid import SpatialGrid
from utils.Pathfinding import Pathfinding
from .managers.terrain_manager import TerrainManager
from .managers.town_manager import TownManager
from .managers.road_manager import RoadManager
from .managers.faction_manager import FactionManager
from .managers.player_manager import PlayerManager
from .managers.npc_manager import NPCManager
from .managers.tree_manager import TreeManager
from .managers.stone_manager import StoneManager
from .config.terrain_costs import get_terrain_costs_by_index

class World:
    def __init__(self, overworld_manager, game_manager, overworld_position):
        w_size = world_size()        
        self.overworld_manager = overworld_manager
        self.overworld_position = overworld_position
        self.game_manager = game_manager
        self.spacial_grid = SpatialGrid(w_size, w_size, 1)
        self.terrain_manager = TerrainManager(self)
        self.tree_manager = TreeManager(self)
        self.stone_manager = StoneManager(self)
        self.player_manager = PlayerManager(self)
        self.town_manager = TownManager(self)
        self.road_manager = RoadManager(self)
        self.faction_manager = FactionManager(self)
        self.npc_manager = NPCManager(self)
        self.terrain_manager.init()
        self.tree_manager.init()
        self.stone_manager.init()
        self.town_manager.init()
        self.road_manager.init()
        self.npc_manager.init()

        self.pathfinder = Pathfinding(self.terrain_manager.terrain.terrain, get_terrain_costs_by_index()) 
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

  

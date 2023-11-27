import random
from ..config.terrain_layers import terrain_layers
class StoneManager:
    def __init__(self, world):        
        self.world = world
        self.stones = self.spawn_stones(self.world.terrain_manager.terrain.terrain, 'stone')    
    
    def remove_stone_at_index(self, stone_index):
        del self.stones[stone_index]

    def spawn_stones(self, world_map, type):
        stones = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                if self.world.is_tree_at_position({"x":x,"y":y}) >= 0:
                    continue
                tileType = terrain_layers()[tile]
                if tileType == "water" and random.randint(0, 40) > 0:
                    continue   
                if tileType == "sand" and random.randint(0, 30) > 0:
                    continue   
                if tileType == "grass" and random.randint(0, 20) > 0:
                    continue  
                if tileType == "forest" and random.randint(0, 10) > 0:
                    continue  
                if tileType == "mountain" and random.randint(0, 5) > 0:
                    continue   
                stone = {
                    "type": type,
                    "position": {"x": x, "y": y},
                    "health": 200
                }
                stones.append(stone)
        return stones
    

import random
from ..config.terrain_layers import terrain_layers
class TreeManager:
    def __init__(self, world):    
        self.world = world     
        self.trees = []

    def mapWorld(self):
        self.terrain_manager = self.world.terrain_manager
        self.road_manager = self.world.road_manager

    def init(self):
        self.mapWorld()
        self.trees = self.spawn_trees(self.terrain_manager.terrain.terrain)

    def is_tree_at_position(self, position):
        for index, tree in enumerate(self.trees):
            # Convert position dictionary to a tuple for comparison
            if position == tree['position']:
                return index
        return -1
    
    def remove_tree_at_index(self, tree_index):
        del self.trees[tree_index]

    def spawn_trees(self, world_map):
        trees = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                tileType = terrain_layers()[tile]
                tree_type = ""
                if tileType == "grass":  # Assuming "forest" is the identifier for forest tiles
                    if random.randint(0, 9) > 0:
                        continue
                    tree_type = 'pine'
                if tileType == "forest":
                    if random.randint(0, 10) > 5:
                        continue                    
                    tree_type = 'pine'
                if tileType == "mountain":
                    if random.randint(0, 10) > 3:
                        continue                    
                    tree_type = 'pine'
                if tileType == "sand":
                    if random.randint(0, 10) > 0:
                        continue
                    tree_type = 'palm'
                if tree_type == '':
                    continue
                tree = {
                    "type": tree_type,
                    "position": {"x": x, "y": y},
                    "health": 20,
                    "index": len(trees)
                }
                trees.append(tree)

        return trees
    
    def remove_trees_on_roads(self):
        road_tiles = set()
        for road in self.road_manager.roads:
            for tile in road:
                road_tiles.add((tile[0], tile[1]))  # Add road tile coordinates to the set

        self.trees = [tree for tree in self.trees if (tree["position"]["x"], tree["position"]["y"]) not in road_tiles]

    def update_tree_indices(self):
        for i, tree in enumerate(self.trees):
            tree['index'] = i
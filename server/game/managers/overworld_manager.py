from ..overworld_map import OverworldMap
from ..world import World
class OverworldManager:
    def __init__(self, game_manager, size):
        self.game_manager = game_manager
        self.overworld_map = OverworldMap(size)
        self.world_instances = {}  # Key: (x, y) tile coordinates, Value: GameManager instance
        self.player_locations = {}  # Key: player_id, Value: (x, y) location

    def move_player(self, player_id, x, y):
        # Update player location
        self.player_locations[player_id] = { 'x': x, 'y': y }
        # Handle logic to instantiate/load a GameManager if not already present
        if (x, y) not in self.world_instances:
            self.load_tile(x, y)
        # Additional logic here

    def load_tile(self, x, y):
        # Load a GameManager for the specified tile
        world = World(self, self.game_manager, { 'x': x, 'y': y })
        self.world_instances[(x, y)] = world
        return world

    def get_world_instance(self, x, y):
        if (x, y) not in self.world_instances:
            self.load_tile(x, y)
        # Return the GameManager instance for the specified tile
        return self.world_instances.get((x, y))
    
    def get_world_of_player(self, player_id):
        player_location = self.player_locations.get(player_id)
        if player_location:
            return self.get_world_instance(player_location['x'], player_location['y'])
        return None
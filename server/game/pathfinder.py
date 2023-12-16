from utils.utils import tuple_to_position
from .config.terrain_costs import get_terrain_costs_by_index
from .config.world_size import tile_size
class Pathfinder:
    def __init__(self, world, parent, move_speed):
        self.world = world
        self.parent = parent
        self.destination = None
        self.path = []  # Store the path
        self.state = "idle"  # States: "idle", "moving", "gathering", "returning"
        self.last_action_time = 0  # Time of the last action
        self.move_speed = move_speed  # Movement speed (tiles per second)
        self.t = 0  # Interpolation factor

    def set_destination(self, dest):
        self.destination = dest
        tile_position = {'x': int(self.parent.position['x'] / tile_size), 'y': int(self.parent.position['y'] / tile_size)}
        self.path = self.world.find_path(tile_position, self.destination) 
        self.t = 0  # Reset interpolation factor for new path

    def update(self, current_time):
        if self.destination is not None:
            self.move_towards_target(current_time)

    def move_towards_target(self, current_time):
        if self.path and len(self.path) > 1:
            self.follow_path(current_time)
        elif len(self.path) == 1:
            self.state = "idle"
            self.last_action_time = current_time
            self.destination = None
            self.path = []
        else:
            self.path = []
            self.state = "idle"
            self.destination = None

    def follow_path(self, current_time):
        if self.t < 1:
            update_rate = current_time - self.last_action_time  # Dynamic update rate
            tile_position = {'x': int(self.parent.position['x'] / tile_size), 'y': int(self.parent.position['y']/ tile_size)}
            tile_type = self.world.terrain_manager.tile_type_id_at_position(tile_position)
            if self.world.road_manager.is_road_at_position(tile_position):
                tile_type = 5
            terrain_cost = get_terrain_costs_by_index()[tile_type]

            road_bonus = 1.5 if tile_type == 5 else 1  # Assuming 5 is the road tile type

            self.t += .25 * road_bonus * self.move_speed / terrain_cost
            end = tuple_to_position(self.path[1])
            if self.t >= 1:
                print(end)
                self.parent.position = {'x': int(end['x'] * tile_size), 'y': int(end['y'] * tile_size)}
                self.t = 0
                self.path.pop(1)  # Move to the next step in the path

        self.last_action_time = current_time

    def interpolate(self, start, end, t):
        new_x = start["x"] + (end["x"] - start["x"]) * t
        new_y = start["y"] + (end["y"] - start["y"]) * t
        return {"x": new_x, "y": new_y}

    
    def is_adjacent(self, pos1, pos2):
        adjacent = (abs(pos1["x"] - pos2["x"]) == 1 and abs(pos1["y"] - pos2["y"]) == 0) or (abs(pos1["x"] - pos2["x"]) == 0 and abs(pos1["y"] - pos2["y"]) == 1)
       # print(f"Checking adjacency between {pos1} and {pos2}: {adjacent}")
        return adjacent
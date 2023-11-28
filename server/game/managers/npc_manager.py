import random
import asyncio
from ..npc import NPC, npc_types
from ..worker import Worker
from ..config.world_size import world_size
class NPCManager:
    def __init__(self, world):        
        self.world = world
        self.world_size = world_size()
        self.npc_counter = 0
        self.npcs = {}
        self.npc_spawns = ['green_slime', 'mammoth', 'giant_crab', 'pirate_grunt', 'pirate_gunner', 'pirate_captain']

    def mapWorld(self):
        self.town_manager = self.world.town_manager
        self.is_land = self.world.terrain_manager.is_land
        self.find_path = self.world.find_path

    def init(self):
        self.mapWorld()
        self.spawn_workers()
     
    def is_world_full(self):
        """ Check if the world has enough space to spawn new entities. """
        land_count = self.world_size * self.world_size
        return land_count <= len(self.npcs)
    
    def spawn_workers(self):
        # Logic to spawn workers
        for i in range(5):
            worker_id = f"Worker{self.npc_counter}"
            worker_position = { 'x': self.town_manager.towns[0].position['x'] + i - 2, 'y': self.town_manager.towns[0].position['y'] + 1 }
            npc_id = f"NPC{self.npc_counter}"
            patrol_route = self.generate_patrol_route(worker_position)  # Pass dictionary directly
            full_path = self.generate_full_path(patrol_route)
            full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
            self.npcs[npc_id] = NPC(self.world, npc_id, 0, 'peasant', worker_position, full_path_coords)
            self.npcs[npc_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
            self.npcs[npc_id].worker = Worker(self.world, self.npcs[npc_id], worker_id, 0)
            self.npc_counter = self.npc_counter + 1


    def spawn_npcs(self, num_npcs, world_width, world_height):
        npcs = {}
        for i in range(num_npcs):
            while True:
                x = random.randint(0, world_width - 1)
                y = random.randint(0, world_height - 1)
                if x < world_height / 2 and y > world_height / 2:
                    continue
                if self.is_land(x, y):
                    npc_id = f"NPC{self.npc_counter}"
                    npc_position = {"x": x, "y": y}
                    random_npc_type = npc_types[random.choice(self.npc_spawns)]
                    patrol_route = self.generate_patrol_route(npc_position)  # Pass dictionary directly
                    full_path = self.generate_full_path(patrol_route)
                    full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                    npcs[npc_id] = NPC(self.world, npc_id, 1, random_npc_type, npc_position, full_path_coords)
                    self.npc_counter = self.npc_counter + 1
                    npcs[npc_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                    break
        return npcs
    
    def spawn_new_npc(self, max_attempts=100):
        """ Spawn a single new npc at a random land location. """
        attempts = 0
        while attempts < max_attempts:
            x = random.randint(0, self.world_size - 1)
            y = random.randint(0, self.world_size - 1)
            if x < self.world_size / 2 and y > self.world_size / 2:
                continue
            if self.is_land(x, y):
                npc_id = f"NPC{self.npc_counter}"
                self.npc_counter += 1  # Increment the counter for each new npc
                random_npc_type = random.choice(self.npc_spawns)
                npc_position = {"x": x, "y": y}
                random_npc_type = random.choice(self.npc_spawns)
                patrol_route = self.generate_patrol_route(npc_position)  # Pass dictionary directly
                full_path = self.generate_full_path(patrol_route)
                full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                self.npcs[npc_id] = NPC(self.world, npc_id, 1, random_npc_type, npc_position, full_path_coords)
                self.npcs[npc_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                return self.npcs[npc_id]
            attempts += 1
        print("Failed to spawn a new npc after max attempts")
        return False

    def maintain_npc_count(self, desired_count):
        """ Maintain a fixed number of npcs in the game world. """
        if self.is_world_full():
            print("World is too full to spawn new npcs")
            return False

        if len(self.npcs) < desired_count:
            return self.spawn_new_npc()                
                        
        return False
    
        
    def generate_patrol_route(self, start_position, num_waypoints=2, max_distance=10, max_attempts=10):
        route = [start_position]  # start_position should be a tuple (x, y)
        for _ in range(num_waypoints - 1):
            for attempt in range(max_attempts):
                x = start_position['x'] - max_distance + random.randint(0, max_distance * 2)
                y = start_position['y'] - max_distance + random.randint(0, max_distance * 2)
                if( x < 0 ): 
                    x = 0
                if( y < 0 ):
                    y = 0
                if( x > self.world_size ):
                    x = self.world_size - 1
                if( y > self.world_size ):
                    y = self.world_size - 1
                
                if self.is_land(x, y):
                    waypoint = {"x": x, "y": y}  # Create waypoint as a dictionary
                    route.append(waypoint)
                    break
                if attempt == max_attempts - 1:
                    print(f"Failed to find a land waypoint after {max_attempts} attempts.")
        return route

    def generate_full_path(self, patrol_route):
        full_path = []
        for i in range(len(patrol_route) - 1):
            path_segment = self.find_path(patrol_route[i], patrol_route[i+1])
            full_path.extend(path_segment)
        return full_path

   
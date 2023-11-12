import asyncio
from .enemy import Enemy, enemy_types
import heapq
import random
from .terrain import Terrain
class World:
    def __init__(self):
        self.players = {}
        self.terrain = Terrain(100, 100) 
        self.enemies = self.spawn_enemies(50, 100, 100, self.terrain.terrain)       
        self.items_on_ground = {}
        self.towns = self.place_towns()
        self.roads = self.generate_roads()
        self.trees = self.spawn_trees(self.terrain.terrain, 'pine')
        self.enemy_counter = len(self.enemies)

    def a_star(self, start, end):
        # Helper functions
        def heuristic(a, b):
            return abs(a[0] - b[0]) + abs(a[1] - b[1])

        def get_neighbors(node):
            directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # Four directions: up, right, down, left
            neighbors = []
            for dx, dy in directions:
                x, y = node[0] + dx, node[1] + dy
                if 0 <= x < len(self.terrain.terrain[0]) and 0 <= y < len(self.terrain.terrain):
                    neighbors.append((x, y))
            return neighbors

        # A* algorithm
        open_set = set([start])
        came_from = {}
        g_score = {start: 0}
        f_score = {start: heuristic(start, end)}

        while open_set:
            current = min(open_set, key=lambda x: f_score.get(x, float('inf')))
            if current == end:
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                return path[::-1]

            open_set.remove(current)
            for neighbor in get_neighbors(current):
                tentative_g_score = g_score[current] + 1  # Assuming uniform cost for simplicity
                if tentative_g_score < g_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + heuristic(neighbor, end)
                    open_set.add(neighbor)

        return []  # No path found
    
    def is_land(self, x, y, world_map):
        if 0 <= y < len(world_map) and 0 <= x < len(world_map[0]):
            return world_map[y][x] != 'water'
        else:
            return False  # Out of bounds, treat as non-land

    
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
                if( x > self.terrain.width ):
                    x = self.terrain.width - 1
                if( y > self.terrain.height ):
                    y = self.terrain.height - 1

                
                if self.is_land(x, y, self.terrain.terrain):
                    waypoint = {"x": x, "y": y}  # Create waypoint as a dictionary
                    route.append(waypoint)
                    break
                if attempt == max_attempts - 1:
                    print(f"Failed to find a land waypoint after {max_attempts} attempts.")
        return route

    def generate_full_path(self, patrol_route):
        full_path = []
        for i in range(len(patrol_route) - 1):
            start = (patrol_route[i]["x"], patrol_route[i]["y"])  # Convert to tuple for A* algorithm
            end = (patrol_route[i + 1]["x"], patrol_route[i + 1]["y"])  # Convert to tuple
            path_segment = self.a_star(start, end)
            full_path.extend(path_segment)
        return full_path

    def spawn_enemies(self, num_enemies, world_width, world_height, world_map):
        enemies = {}
        for i in range(num_enemies):
            while True:
                x = random.randint(0, world_width - 1)
                y = random.randint(0, world_height - 1)
                if self.is_land(x, y, world_map):
                    enemy_id = f"Enemy{i}"
                    enemy_position = {"x": x, "y": y}
                    random_enemy_type = random.choice(list(enemy_types.keys()))
                    patrol_route = self.generate_patrol_route(enemy_position)  # Pass dictionary directly
                    full_path = self.generate_full_path(patrol_route)
                    full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                    enemies[enemy_id] = Enemy(enemy_id, random_enemy_type, enemy_position, full_path_coords)
                    enemies[enemy_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                    break
        return enemies


    
    def spawn_trees(self, world_map, tree_type):
        trees = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                if tile in ["forest", "grass"]:  # Assuming "forest" is the identifier for forest tiles
                    tree = {
                        "type": tree_type,
                        "position": {"x": x, "y": y}
                    }
                    trees.append(tree)
        return trees
    
    def place_towns(self):
        towns = []
        for _ in range(10):  # Number of towns
            while True:
                x = random.randint(0, self.terrain.width - 1)
                y = random.randint(0, self.terrain.width - 1)
                # Place towns on grass or sand tiles
                if self.terrain.terrain[y][x] in ['grass', 'sand']:
                    towns.append((x, y))
                    break
        return towns

    def generate_roads(self):
        roads = []
        for i in range(len(self.towns) - 1):
            start = self.towns[i]
            end = self.towns[i + 1]
            road = self.connect_towns(start, end)
            roads.append(road)
        return roads

    def connect_towns(self, start, end):
        # A* pathfinding
        open_set = []
        heapq.heappush(open_set, (0, start))
        came_from = {}
        g_score = {start: 0}
        f_score = {start: self.heuristic(start, end)}

        while open_set:
            current = heapq.heappop(open_set)[1]

            if current == end:
                return self.reconstruct_road(came_from, current)

            for neighbor in self.get_neighbors(current):
                tentative_g_score = g_score[current] + self.terrain_cost(current, neighbor)
                if tentative_g_score < g_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self.heuristic(neighbor, end)
                    if neighbor not in [i[1] for i in open_set]:
                        heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return []

    def reconstruct_road(self, came_from, current):
        # Reconstruct the road from end to start
        road_path = [current]
        while current in came_from:
            current = came_from[current]
            road_path.append(current)
        return road_path[::-1]  # Reverse the path to start from the beginning

    def heuristic(self, a, b):
        # Simple heuristic: Euclidean distance
        return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    def terrain_cost(self, current, neighbor):
        # Define the cost of moving from current to neighbor based on terrain type
        terrain_type = self.terrain.terrain[neighbor[1]][neighbor[0]]
        if terrain_type == 'water':
            return 10  # High cost for water
        elif terrain_type == 'forest':
            return 5   # Medium cost for forest
        else:
            return 1   # Low cost for other types

    def get_neighbors(self, node):
        # Get all valid neighboring tiles
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # Four directions: up, right, down, left
        neighbors = []
        for dx, dy in directions:
            x, y = node[0] + dx, node[1] + dy
            if 0 <= x < self.terrain.width and 0 <= y < self.terrain.width:
                neighbors.append((x, y))
        return neighbors

    def reconstruct_path(self, came_from, current):
        # Reconstruct the path from end to start
        total_path = [current]
        while current in came_from:
            current = came_from[current]
            total_path.append(current)
        return total_path[::-1]  # Reverse the path
    
    def spawn_new_enemy(self, max_attempts=100):
        """ Spawn a single new enemy at a random land location. """
        attempts = 0
        while attempts < max_attempts:
            x = random.randint(0, self.terrain.width - 1)
            y = random.randint(0, self.terrain.width - 1)
            if self.is_land(x, y, self.terrain.terrain):
                enemy_id = f"Enemy{self.enemy_counter}"
                self.enemy_counter += 1  # Increment the counter for each new enemy
                random_enemy_type = random.choice(list(enemy_types.keys()))
                enemy_position = {"x": x, "y": y}
                random_enemy_type = random.choice(list(enemy_types.keys()))
                patrol_route = self.generate_patrol_route(enemy_position)  # Pass dictionary directly
                full_path = self.generate_full_path(patrol_route)
                full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                self.enemies[enemy_id] = Enemy(enemy_id, random_enemy_type, enemy_position, full_path_coords)
                self.enemies[enemy_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                print(f"Spawned enemy {enemy_id}[{random_enemy_type}] at ({x}, {y}) with {self.enemies[enemy_id].stats['health']}/{self.enemies[enemy_id].stats['max_health']} hp")  
                return self.enemies[enemy_id]
            attempts += 1
            print(f"Attempt {attempts}: Failed to find land for enemy")
        print("Failed to spawn a new enemy after max attempts")
        return False

    def maintain_enemy_count(self, desired_count):
        """ Maintain a fixed number of enemies in the game world. """
        if self.is_world_full():
            print("World is too full to spawn new enemies")
            return False

        if len(self.enemies) < desired_count:
            print(f"Current enemy count: {len(self.enemies)}, Desired count: {desired_count}")
            return self.spawn_new_enemy()                
                        
        return False
    
    def is_world_full(self):
        """ Check if the world has enough space to spawn new entities. """
        land_count = sum(1 for row in self.terrain.terrain for tile in row if tile != 'water')
        return land_count <= len(self.enemies)
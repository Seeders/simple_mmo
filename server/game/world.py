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

    def is_land(self, x, y, world_map):
        print(world_map[y][x])
        # Assuming 'land' is the value for land tiles in your world_map
        return world_map[y][x] != 'water'


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
                    enemies[enemy_id] = Enemy(enemy_id, random_enemy_type, enemy_position)
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
                self.enemies[enemy_id] = Enemy(enemy_id, random_enemy_type, {"x": x, "y": y})
                print(f"Spawned enemy {enemy_id} at ({x}, {y})")  
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
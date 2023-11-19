import asyncio
from .enemy import Enemy, enemy_types
import heapq
import random
from .terrain import Terrain
class World:
    def __init__(self, game_manager):
        self.game_manager = game_manager
        self.players = {}
        self.terrain = Terrain(100, 100) 
        self.terrainLayers = ["water", "sand", "grass", "forest", "mountain"]
        self.enemy_spawns = ['green_slime', 'mammoth', 'giant_crab', 'pirate_grunt', 'pirate_gunner', 'pirate_captain']
        self.building_types = ['house', 'market', 'tavern', 'blacksmith', 'temple', 'barracks', 'dock']
        self.trees = self.spawn_trees(self.terrain.terrain)
        self.enemies = self.spawn_enemies(50, 100, 100, self.terrain.terrain)       
        self.items_on_ground = {}
        self.towns = self.place_towns()
        self.roads = [] 
        self.roads = self.generate_roads()
        self.stones = self.spawn_stones(self.terrain.terrain, 'stone')
        self.remove_trees_on_roads() 
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
            return self.terrainLayers[world_map[y][x]] != 'water'
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
                    random_enemy_type = random.choice(self.enemy_spawns)
                    patrol_route = self.generate_patrol_route(enemy_position)  # Pass dictionary directly
                    full_path = self.generate_full_path(patrol_route)
                    full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                    enemies[enemy_id] = Enemy(self.game_manager, enemy_id, random_enemy_type, enemy_position, full_path_coords)
                    enemies[enemy_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                    break
        return enemies

    def remove_trees_on_roads(self):
        road_tiles = set()
        for road in self.roads:
            for tile in road:
                road_tiles.add((tile[0], tile[1]))  # Add road tile coordinates to the set

        self.trees = [tree for tree in self.trees if (tree["position"]["x"], tree["position"]["y"]) not in road_tiles]

    
    def spawn_trees(self, world_map):
        trees = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                tileType = self.terrainLayers[tile]
                tree_type = ""
                if tileType == "grass":  # Assuming "forest" is the identifier for forest tiles
                    if random.randint(0, 9) > 0:
                        continue
                    tree_type = 'pine'
                if tileType == "forest":
                    if random.randint(0, 10) > 9:
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
                    "health": 200
                }
                trees.append(tree)
        return trees
    
    def spawn_stones(self, world_map, type):
        stones = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                if self.is_tree_at_position({"x":x,"y":y}):
                    continue
                tileType = self.terrainLayers[tile]
                if tileType == "water" and random.randint(0, 40) > 0:
                    continue   
                if tileType == "sand" and random.randint(0, 30) > 0:
                    continue   
                if tileType == "grass" and random.randint(0, 20) > 0:
                    continue   
                stone = {
                    "type": type,
                    "position": {"x": x, "y": y},
                    "health": 200
                }
                stones.append(stone)
        return stones
    
    def place_towns(self, num_towns=5):
        towns = []
        min_distance = 20  # Minimum distance between towns

        while len(towns) < num_towns:
            x = random.randint(0, self.terrain.width - 1)
            y = random.randint(0, self.terrain.height - 1)

            if all(self.heuristic((x, y), (town["center"])) >= min_distance for town in towns):
                tileType = self.terrainLayers[self.terrain.terrain[y][x]]
                if tileType == 'grass' or tileType == 'sand':
                    town_center = (x, y)
                    town_width = 10
                    town_height = 10
                    total_buildings = 15
                    building_counts = {
                        'house': 10,
                        'market': 2,
                        'tavern': 2,
                        'blacksmith': 1,
                        'temple': 1,
                        'barracks': 1,
                        'dock': 3
                    }

                    town_layout = self.generate_town(town_center, town_width, town_height, total_buildings, building_counts)
                    towns.append({'center': town_center, 'layout': town_layout})

        return towns
    
    def generate_roads(self):
        roads = []
        for town in self.towns:
            nearest_neighbors = self.find_nearest_neighbors(town["center"], 2)  # Find two nearest neighbors
            for neighbor in nearest_neighbors:
                if not self.is_road_exists(town["center"], neighbor, roads):
                    new_road = self.connect_towns(town["center"], neighbor)
                    roads.append(new_road)
        return roads

    def find_nearest_neighbors(self, town, count):
        distances = [(self.heuristic(town, other_town["center"]), other_town["center"]) for other_town in self.towns if other_town != town]
        distances.sort()
        return [town for _, town in distances[:count]]

    def is_road_exists(self, town1, town2, roads):
        for road in roads:
            if (town1 in road and town2 in road):
                return True
        return False

    def remove_extra_paths(self, town, roads):
        for road in roads:
            if self.is_road_near_town(town, road) and not self.is_road_connected_to_town(town, road):
                for road2 in roads:
                    if self.is_road_connected_to_town(town, road2):
                        roads.remove(road2)
                # Optionally, modify the road to stop before reaching the town
                # road = self.shorten_road_before_town(town, road)
        return roads

    def is_road_near_town(self, town, road, threshold=5):
        # Implement logic to check if the road is near the town
        # This could involve checking the distance of road segments from the town
        return any(self.heuristic(town, segment) < threshold for segment in road)

    def is_road_connected_to_town(self, town, road):
        # Check if the road is connected to the town
        # This could be based on the endpoints of the road
        return town in [road[0], road[-1]]

    def shorten_road_before_town(self, town, road):
        # Shorten the road so it stops before reaching the town
        # Implement logic based on your game's requirements
        # Example: return road[:-5] to remove the last 5 segments
        pass


    def connect_towns(self, start, end):
        # A* pathfinding with modifications for more natural roads
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
                # Adjusted cost calculation with strong preference for existing roads
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
        terrain_type = self.terrainLayers[self.terrain.terrain[neighbor[1]][neighbor[0]]]
        road_weight = 1  # Lower cost for road tiles

        if self.is_road_at_position({'x': neighbor[0], 'y': neighbor[1]}):
            return road_weight  # Prefer paths on existing roads
        
        if self.is_building_at_position({'x': neighbor[0], 'y': neighbor[1]}):
            return 1000  # Prefer paths on existing roads
        
        if terrain_type == 'water':
            return 1000  # High cost for water
        elif terrain_type == 'forest' or terrain_type == 'sand':
            return 500   # Medium cost for forest
        else:
            return 100   # Low cost for other types

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
                self.enemies[enemy_id] = Enemy(self.game_manager, enemy_id, random_enemy_type, enemy_position, full_path_coords)
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
        land_count = sum(1 for row in self.terrain.terrain for tile in row if tile != 0)
        return land_count <= len(self.enemies)

    def is_position_valid(self, position):
        x = int(position['x'])
        y = int(position['y'])
        terrain = self.terrain.terrain

        if x < 0 or y < 0 or x >= len(terrain[0]) or y >= len(terrain):
            return False

        terrain_type = self.terrainLayers[terrain[y][x]]
        if terrain_type == 'water' and not self.is_road_at_position(position):
            return False

        return True

    def is_road_at_position(self, position):
        for road in self.roads:
            if (position['x'], position['y']) in road:
                return True
        return False
    
    def is_town_at_position(self, position):
        for town in self.towns:
            # Convert position dictionary to a tuple for comparison
            position_tuple = (position['x'], position['y'])
            if position_tuple == town['center']:
                return True
        return False

    def is_tree_at_position(self, position):
        for tree in self.trees:
            # Convert position dictionary to a tuple for comparison
            if position == tree['position']:
                return True
        return False
    
    def is_building_at_position(self, position):
        for town in self.towns:
            # Convert position dictionary to a tuple for comparison
            coordinate = {'x': position['x'], 'y': position['y']}
            for building in town['layout']:
                if coordinate == building['position']:
                    return True
        return False
    
    def generate_town(self, town_center, town_width, town_height, total_buildings, building_counts):
        town_layout = []
        building_locations = []

        # Generate building positions
        while len(building_locations) < total_buildings:
            x_offset = random.randint(-town_width // 2, town_width // 2)
            y_offset = random.randint(-town_height // 2, town_height // 2)
            if x_offset == 0 and y_offset == 0: 
                continue  # Avoid spawning on town center
            x, y = town_center[0] + x_offset, town_center[1] + y_offset

            position = {'x': x, 'y': y}
            if self.is_land(x, y, self.terrain.terrain) and not self.is_tree_at_position(position) and position not in building_locations:
                building_locations.append(position)

        counts = []
        for building_name in building_counts:
            counts.append(building_counts[building_name])
        # Assign building types based on neighboring tiles
        for position in building_locations:
            building_type = self.determine_building_type(town_center, position, building_counts)
            if counts[building_type] > 0:
                counts[building_type] = counts[building_type] - 1
                town_layout.append({'type': self.building_types[building_type], 'position': position})
            else:
                town_layout.append({'type': self.building_types[0], 'position': position})# default to hut

        return town_layout

    def determine_building_type(self, town_center, position, building_counts):
        """
        Determines the building type based on neighboring tiles.

        :param position: Dictionary with 'x' and 'y' keys representing the building position.
        :return: Integer representing the building type.
        """
        distance_to_town = ((town_center[0] - position['x'])**2 + (town_center[1] - position['y'])**2)**0.5

        # Example logic for determining building type
        if self.is_tile_type_nearby(0, position):
            dock_index = self.building_types.index('dock')
            return dock_index
        if distance_to_town < 4:
            return random.randint(1, 4)
        else:
            # Other logic to determine building type
            return 0  # Example types

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

    def merge_overlapping_segments(self, road1, road2, merge_threshold=2):
        merged_road = []
        i, j = 0, 0
        merge_point = None

        while i < len(road1) and j < len(road2):
            if self.heuristic(road1[i], road2[j]) <= merge_threshold:
                # Merge overlapping segments
                merge_point = (i, j)
                while i < len(road1) and j < len(road2) and self.heuristic(road1[i], road2[j]) <= merge_threshold:
                    merged_segment = self.average_position(road1[i], road2[j])
                    merged_road.append(merged_segment)
                    i += 1
                    j += 1
            else:
                # Add the non-overlapping segments
                if i < len(road1):
                    merged_road.append(road1[i])
                    i += 1
                if j < len(road2):
                    merged_road.append(road2[j])
                    j += 1

        # Check if both roads lead to the same town and merge accordingly
        if merge_point and self.leads_to_same_town(road1[merge_point[0]:], road2[merge_point[1]:]):
            merged_road.extend(self.choose_one_path(road1[merge_point[0]:], road2[merge_point[1]:]))
        else:
            # Append remaining segments if any
            while i < len(road1):
                merged_road.append(road1[i])
                i += 1
            while j < len(road2):
                merged_road.append(road2[j])
                j += 1

        return merged_road

    def leads_to_same_town(self, path1, path2):
        # Implement logic to check if both paths lead to the same town
        # This could be based on the end coordinates of the paths
        return path1[-1] == path2[-1]

    def choose_one_path(self, path1, path2):
        # Implement logic to choose one path over the other
        # This could be based on the length of the path, terrain, etc.
        return path1 if len(path1) < len(path2) else path2


    def average_position(self, pos1, pos2):
        return ((pos1[0] + pos2[0]) // 2, (pos1[1] + pos2[1]) // 2)
import asyncio
from .enemy import Enemy, enemy_types
import heapq
import random
from utils.broadcast import broadcast
from utils.utils import position_to_tuple
from .terrain import Terrain
from .structure import Structure
from .town import Town
from .worker import Worker
from utils.SpatialGrid import SpatialGrid
from utils.Pathfinding import Pathfinding

class World:
    def __init__(self, game_manager):
        self.game_manager = game_manager
        self.players = {}
        self.enemy_counter = 0
        self.terrain = Terrain(100, 100) 
        self.spacial_grid = SpatialGrid(100, 100, 1)
        self.terrainLayers = ["water", "sand", "grass", "forest", "mountain"]
        self.enemy_spawns = ['green_slime', 'mammoth', 'giant_crab', 'pirate_grunt', 'pirate_gunner', 'pirate_captain']
        self.building_types = ['house', 'market', 'tavern', 'blacksmith', 'temple', 'barracks', 'dock']
        self.pathfinder = Pathfinding(self.terrain.terrain, self.get_terrain_costs())
        self.trees = self.spawn_trees(self.terrain.terrain)
        self.stones = self.spawn_stones(self.terrain.terrain, 'stone')
        self.enemies = self.spawn_enemies(50, 100, 100, self.terrain.terrain)       
        self.items_on_ground = {}
        self.factions = []
        for i in range(5):
            self.factions.append(self.get_faction(i))
        self.towns = self.place_towns()
        self.roads = [] 
        self.roads = self.generate_roads()
        self.remove_trees_on_roads() 
        self.ramps = []
        self.generate_ramps()
        self.spawn_workers()
        for i, tree in enumerate(self.trees):
            tree['index'] = i

    def get_faction(self, faction):
         return { 
                'faction': faction,
                'resources': self.get_starting_resources()
            }
    def get_starting_resources(self):
        return {
                    'wood': 0,
                    'stone': 0
                }


    def find_path(self, start, goal):
        type1 = "forest"
        type2 = "grass"
        if self.terrainLayers[self.terrain.terrain[start['y']][start['x']]] == "forest": 
            type1 = "grass"
            type2 = "forest"
        
        tempTerrain = []
        for i in range(len(self.terrain.terrain)):
            tempTerrain.append([])
            for j in range(len(self.terrain.terrain[i])):
                tempTerrain[i].append(self.terrain.terrain[i][j])
        
                #Check if the current tile is a forest tile
                if len(self.terrainLayers) > tempTerrain[i][j] and self.terrainLayers[tempTerrain[i][j]] == type1:
                    #Check the neighboring tiles in cardinal directions
                    for dx in range(-1, 1):
                        for dy in range(-1, 1):
                            #Skip diagonal neighbors and the current tile itself
                            if abs(dx) == abs(dy):
                                continue
                            
                
                            #Ensure we don't go out of bounds
                            if i + dx >= 0 and i + dx < len(self.terrain.terrain) and j + dy >= 0 and j + dy < len(self.terrain.terrain[i]):
                                #Check if the neighboring tile is grass
                                if self.terrainLayers[self.terrain.terrain[i + dx][j + dy]] == type2:
                                    tempTerrain[i][j] = 8 #Update the current tile type to 8
                                   #self.renderManager.renderRoundedRect(self.debugCtx, (j) * CONFIG.tileSize + self.offsetX, (i) * CONFIG.tileSize + self.offsetY, CONFIG.tileSize, CONFIG.tileSize, 2, 'red')
                                    break #No need to check other neighbors once we find grass
                                
                            
                        
                        if tempTerrain[i][j] == 8:
                            break #Break the outer loop as well if we've updated the tile
            
        
        for i in range(len(self.ramps)):
            ramp = self.ramps[i]
            tempTerrain[ramp['y']][ramp['x']] = self.terrainLayers.index("forest") 
            for dx in range(-1, 1):
                for  dy in range(-1, 1):
                    # Skip diagonal neighbors and the current tile itself
                    if abs(dx) == abs(dy):
                        continue
                    
        
                    # Ensure we don't go out of bounds
                    if ramp['y'] + dx >= 0 and ramp['y'] + dx < len(self.terrain.terrain) and ramp['x'] + dy >= 0 and ramp['x'] + dy < len(self.terrain.terrain[ramp['y']]):
                        # Check if the neighboring tile is grass
                        if self.terrainLayers[self.terrain.terrain[ramp['y'] + dx][ramp['x'] + dy]] == "grass":
                            tempTerrain[ramp['y'] + dx][ramp['x'] + dy] = self.terrainLayers.index("grass") 
            
        
        for i in range(len(self.roads)):
            for j in range(len(self.roads[i])):
                road = self.roads[i][j]
                tempTerrain[road[1]][road[0]] = 5
            
        
        
        for i in range(len(self.trees)):
            tree = self.trees[i]
            if tree['health'] > 0 and tree['type'] != 'stump' and not tree['position'] == start:
                tempTerrain[tree['position']['y']][tree['position']['x']] = 6            
            
        
        for i in range(len(self.stones)):
            stone = self.stones[i]
            tempTerrain[stone['position']['y']][stone['position']['x']] = 7           
        
       
        self.pathfinder = Pathfinding(tempTerrain, self.get_terrain_costs())
        path = self.pathfinder.a_star(position_to_tuple(start), position_to_tuple(goal))
        
        return path
    


    def get_terrain_costs(self):
        # Define costs based on your terrain types
        return { 
            0: 20, 
            1: 10, 
            2: 5, 
            3: 10, 
            4: 10, 
            5: 1, 
            6: 0, 
            7: 0, 
            8: 0
        }
    
    def update(self, current_time):
        pass

    def spawn_workers(self):
        # Logic to spawn workers
        for i in range(5):
            worker_id = f"Worker{self.enemy_counter}"
            worker_position = { 'x': self.towns[0].position['x'] + i - 2, 'y': self.towns[0].position['y'] + 1 }
            enemy_id = f"Enemy{self.enemy_counter}"
            patrol_route = self.generate_patrol_route(worker_position)  # Pass dictionary directly
            full_path = self.generate_full_path(patrol_route)
            full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
            self.enemies[enemy_id] = Enemy(self, enemy_id, 0, 'peasant', worker_position, full_path_coords)
            self.enemies[enemy_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
            self.enemies[enemy_id].worker = Worker(self, self.enemies[enemy_id], worker_id, 0)
            self.enemy_counter = self.enemy_counter + 1

    def generate_ramps(self):
        terrain = self.terrain.terrain
        ramp_candidates = []

        for y in range(len(terrain)):
            for x in range(len(terrain[0])):
                if self.is_border_tile(x, y, 'grass', 'forest'):
                    ramp_candidates.append({'x': x, 'y': y})

        num_ramps = random.randint(1, len(ramp_candidates) // 2)  # Adjust the number of ramps as needed
        for _ in range(num_ramps):
            ramp_tile = random.choice(ramp_candidates)
            ramp_candidates.remove(ramp_tile)
            self.place_ramp(ramp_tile)

    def is_border_tile(self, x, y, type1, type2):
        terrain = self.terrain.terrain
        current_type = self.terrainLayers[terrain[y][x]]

        if current_type != type1 and current_type != type2:
            return False

        # Check horizontal neighbors (left and right)
        if 0 <= x - 1 < len(terrain[0]) and 0 <= x + 1 < len(terrain[0]):
            left_type = self.terrainLayers[terrain[y][x - 1]]
            right_type = self.terrainLayers[terrain[y][x + 1]]
            if current_type == left_type == right_type == type2:
                # Check vertical neighbors (top and bottom)
                if 0 <= y - 1 < len(terrain) and 0 <= y + 1 < len(terrain):
                    top_type = self.terrainLayers[terrain[y - 1][x]]
                    bottom_type = self.terrainLayers[terrain[y + 1][x]]
                    if (top_type != bottom_type) and (top_type == type1 or top_type == type2) and (bottom_type == type1 or bottom_type == type2):
                        return True

        # Check vertical neighbors (top and bottom)
        if 0 <= y - 1 < len(terrain) and 0 <= y + 1 < len(terrain):
            top_type = self.terrainLayers[terrain[y - 1][x]]
            bottom_type = self.terrainLayers[terrain[y + 1][x]]
            if current_type == top_type == bottom_type == type2:
                # Check horizontal neighbors (left and right)
                if 0 <= x - 1 < len(terrain[0]) and 0 <= x + 1 < len(terrain[0]):
                    left_type = self.terrainLayers[terrain[y][x - 1]]
                    right_type = self.terrainLayers[terrain[y][x + 1]]
                    if (left_type != right_type) and (left_type == type1 or left_type == type2) and (right_type == type1 or right_type == type2):
                        return True

        return False


    def place_ramp(self, position):
        # Update the terrain data to reflect a ramp at the given position
        # This might involve setting a specific value or flag in the terrain array
        # Example:
        treeIndex = self.is_tree_at_position(position)
        if treeIndex >= 0:
            del self.trees[treeIndex]
        self.ramps.append(position)

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
            start = (patrol_route[i]["x"], patrol_route[i]["y"])
            end = (patrol_route[i + 1]["x"], patrol_route[i + 1]["y"])
            path_segment = self.pathfinder.a_star(start, end)
            full_path.extend(path_segment)
        return full_path

    def spawn_enemies(self, num_enemies, world_width, world_height, world_map):
        enemies = {}
        for i in range(num_enemies):
            while True:
                x = random.randint(0, world_width - 1)
                y = random.randint(0, world_height - 1)
                if x < world_height / 2 and y > world_height / 2:
                    continue
                if self.is_land(x, y, world_map):
                    enemy_id = f"Enemy{self.enemy_counter}"
                    enemy_position = {"x": x, "y": y}
                    random_enemy_type = random.choice(self.enemy_spawns)
                    patrol_route = self.generate_patrol_route(enemy_position)  # Pass dictionary directly
                    full_path = self.generate_full_path(patrol_route)
                    full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                    enemies[enemy_id] = Enemy(self, enemy_id, 1, random_enemy_type, enemy_position, full_path_coords)
                    self.enemy_counter = self.enemy_counter + 1
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
    
    def spawn_stones(self, world_map, type):
        stones = []
        for y, row in enumerate(world_map):
            for x, tile in enumerate(row):
                if self.is_tree_at_position({"x":x,"y":y}) >= 0:
                    continue
                tileType = self.terrainLayers[tile]
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
    
    def place_towns(self):
        # Define corner positions for the towns
        padding = min(10, self.terrain.width // 2, self.terrain.height // 2)

        # Define corner positions with padding
        opposing_town_1 = (padding, self.terrain.height - 1 - padding)  # Bottom left
        opposing_town_2 = (self.terrain.width - 1 - padding, padding)  # Top right
        neutral_town_1 = (padding, padding)  # Top left
        neutral_town_2 = (self.terrain.width - 1 - padding, self.terrain.height - 1 - padding)  # Bottom right
        bandit_town = (int(self.terrain.width / 2), int(self.terrain.height / 2))  # Bottom right

        town_centers = [opposing_town_1, opposing_town_2, neutral_town_1, neutral_town_2, bandit_town]
        towns = []
        town_type = 0
        for town_center in town_centers:
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
            town = Town(self, town_type, town_type, town_center)
            if town_center == opposing_town_1 or town_center == opposing_town_2:
                town_layout = {} 
            else:
                town_layout = self.generate_town(town, town_center, town_type, town_width, town_height, total_buildings, building_counts)
            
            town.set_layout(town_layout)
            towns.append(town)
            town_type += 1

        return towns
    
    def generate_roads(self):
        roads = []

        # Assuming the first town is bottom left and second is top right (opposing towns),
        # and the third is top left and fourth is bottom right (neutral towns)
        bottom_left_opposing = self.towns[0]
        top_right_opposing = self.towns[1]
        top_left_neutral = self.towns[2]
        bottom_right_neutral = self.towns[3]
        center_bandit = self.towns[4]

        # Connect the bottom left opposing town to the top left neutral town
        road_bottom_left_to_top_left = self.connect_towns(bottom_left_opposing.center, top_left_neutral.center)
        self.add_road_and_remove_obstacles(road_bottom_left_to_top_left, roads)

        # Connect the top right opposing town to the bottom right neutral town
        road_top_right_to_bottom_right = self.connect_towns(top_right_opposing.center, bottom_right_neutral.center)
        self.add_road_and_remove_obstacles(road_top_right_to_bottom_right, roads)

        # Generate a road between the two opposing towns by connecting them both to the center
        road_between_opposing1 = self.connect_towns(bottom_left_opposing.center, center_bandit.center)
        self.add_road_and_remove_obstacles(road_between_opposing1, roads)

        road_between_opposing2 = self.connect_towns(top_right_opposing.center, center_bandit.center)
        self.add_road_and_remove_obstacles(road_between_opposing2, roads)

        return roads

    def add_road_and_remove_obstacles(self, road, roads):
        for road_segment in road:
            tree_index = self.is_tree_at_position({'x': road_segment[0], 'y': road_segment[1]})
            if tree_index >= 0:
                del self.trees[tree_index]

            stone_index = self.is_stone_at_position({'x': road_segment[0], 'y': road_segment[1]})
            if stone_index >= 0:
                del self.stones[stone_index]

        roads.append(road)

    def find_nearest_neighbors(self, town, count):
        distances = [(self.heuristic(town, other_town.center), other_town.center) for other_town in self.towns if other_town != town]
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
        
        if self.is_building_at_position({'x': neighbor[0], 'y': neighbor[1]}) != (-1, -1):
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
            if x < self.terrain.width / 2 and y > self.terrain.width / 2:
                continue
            if self.is_land(x, y, self.terrain.terrain):
                enemy_id = f"Enemy{self.enemy_counter}"
                self.enemy_counter += 1  # Increment the counter for each new enemy
                random_enemy_type = random.choice(list(enemy_types.keys()))
                enemy_position = {"x": x, "y": y}
                random_enemy_type = random.choice(list(enemy_types.keys()))
                patrol_route = self.generate_patrol_route(enemy_position)  # Pass dictionary directly
                full_path = self.generate_full_path(patrol_route)
                full_path_coords = [{"x": p[0], "y": p[1]} for p in full_path]
                self.enemies[enemy_id] = Enemy(self, enemy_id, 1, random_enemy_type, enemy_position, full_path_coords)
                self.enemies[enemy_id].last_waypoint_arrival_time = asyncio.get_event_loop().time()
                return self.enemies[enemy_id]
            attempts += 1
        print("Failed to spawn a new enemy after max attempts")
        return False

    def maintain_enemy_count(self, desired_count):
        """ Maintain a fixed number of enemies in the game world. """
        if self.is_world_full():
            print("World is too full to spawn new enemies")
            return False

        if len(self.enemies) < desired_count:
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
            if position == town.position:
                return True
        return False

    def is_tree_at_position(self, position):
        for index, tree in enumerate(self.trees):
            # Convert position dictionary to a tuple for comparison
            if position == tree['position']:
                return index
        return -1
    
    def is_stone_at_position(self, position):
        for index, stone in enumerate(self.stones):
            # Convert position dictionary to a tuple for comparison
            if position == stone['position']:
                return index
        return -1
    
    def is_ramp_at_position(self, position):
        for index, ramp in enumerate(self.ramps):
            # Convert position dictionary to a tuple for comparison
            if position == ramp:
                return index
        return -1

    def is_building_at_position(self, position):
        for tindex, town in enumerate(self.towns):
            # Convert position dictionary to a tuple for comparison
            coordinate = {'x': position['x'], 'y': position['y']}
            for building_index, building_id in enumerate(town.layout):
                building = town.layout[building_id]
                if coordinate == building.position:
                    return (tindex, building_id)
        return (-1, -1)
    
    def build_structure(self, data):
        faction = data["faction"]
        structure = data["item"]
        position = data["position"]
        requires = structure["requires"]
        player = self.game_manager.connected[data["playerId"]]
        canAfford = True
        for price in requires:
            type = price["type"]
            amount = price["amount"]
            if player.stats["resources"][type] < amount:
                canAfford = False


        if canAfford:
            for price in requires:
                type = price["type"]
                amount = price["amount"]            
                player.stats["resources"][type] = player.stats["resources"][type] - amount

            if faction < len(self.towns):
                town = self.towns[faction]
                if town:
                    building = Structure(self, town.structure_counter, faction, structure["name"], position)
                    town.structure_counter = town.structure_counter + 1
                    town.layout[building.id] = building

            towns = []
            for town in self.towns:
                towns.append(town.to_dict())
            asyncio.create_task(broadcast({
                "type": "update_towns",
                "towns": towns
            }, self.game_manager.connected, self.game_manager.connections))

            asyncio.create_task(broadcast({
                "type": "update_player_resources",
                "playerId": player.id,
                "resources": player.stats["resources"]
            }, self.game_manager.connected, self.game_manager.connections))

    def generate_town(self, town, town_center, faction, town_width, town_height, total_buildings, building_counts):
        town_layout = {}
        building_locations = []

        # Generate building positions
        while len(building_locations) < total_buildings:
            x_offset = random.randint(-town_width // 2, town_width // 2)
            y_offset = random.randint(-town_height // 2, town_height // 2)
            if x_offset == 0 and y_offset == 0: 
                continue  # Avoid spawning on town center
            x, y = town_center[0] + x_offset, town_center[1] + y_offset

            position = {'x': x, 'y': y}
            if self.is_land(x, y, self.terrain.terrain) and self.is_tree_at_position(position) == -1 and self.is_stone_at_position(position) == -1 and position not in building_locations:
                building_locations.append(position)

        counts = []
        for building_name in building_counts:
            counts.append(building_counts[building_name])
        # Assign building types based on neighboring tiles
        for position in building_locations:
            building_type = self.determine_building_type(town_center, position, building_counts)
            building = {}
            if counts[building_type] > 0:
                counts[building_type] = counts[building_type] - 1                
                building = Structure(self, town.structure_counter, faction, self.building_types[building_type], position)
                town.structure_counter = town.structure_counter + 1
            else:
                building = Structure(self, town.structure_counter, faction, self.building_types[0], position)
                town.structure_counter = town.structure_counter + 1
                
            town_layout[building.id] = building# default to hut

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

    def tile_type_at_position(self, position):
        if 0 <= position['x'] < len(self.terrain.terrain) and 0 <= position['y'] < len(self.terrain.terrain[0]):
            return self.terrainLayers[self.terrain.terrain[position['y']][position['x']]]
        return 0

    def average_position(self, pos1, pos2):
        return ((pos1[0] + pos2[0]) // 2, (pos1[1] + pos2[1]) // 2)
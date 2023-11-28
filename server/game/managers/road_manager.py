
import heapq
class RoadManager:
    def __init__(self, world):        
        self.world = world
        self.roads = []

    def mapWorld(self):
        self.town_manager = self.world.town_manager
        self.terrain_manager = self.world.terrain_manager
        self.stone_manager = self.world.stone_manager
        self.tree_manager = self.world.tree_manager
        self.is_tree_at_position = self.world.tree_manager.is_tree_at_position
        self.is_stone_at_position = self.world.stone_manager.is_stone_at_position
        self.is_building_at_position = self.world.town_manager.is_building_at_position

    def init(self):
        self.mapWorld()
        self.roads = self.generate_roads()
   
    def generate_roads(self):
        roads = []

        # Assuming the first town is bottom left and second is top right (opposing towns),
        # and the third is top left and fourth is bottom right (neutral towns)
        bottom_left_opposing = self.town_manager.towns[0]
        top_right_opposing = self.town_manager.towns[1]
        top_left_neutral = self.town_manager.towns[2]
        bottom_right_neutral = self.town_manager.towns[3]
        center_bandit = self.town_manager.towns[4]

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
                self.tree_manager.remove_tree_at_index(tree_index)

            stone_index = self.is_stone_at_position({'x': road_segment[0], 'y': road_segment[1]})
            if stone_index >= 0:
                self.stone_manager.remove_stone_at_index(stone_index)

        roads.append(road)

    def find_nearest_neighbors(self, town, count):
        distances = [(self.heuristic(town, other_town.center), other_town.center) for other_town in self.town_manager.towns if other_town != town]
        distances.sort()
        return [town for _, town in distances[:count]]

    def is_road_exists(self, town1, town2, roads):
        for road in roads:
            if (town1 in road and town2 in road):
                return True
        return False

    def is_road_at_position(self, position):
        for road in self.roads:
            if (position['x'], position['y']) in road:
                return True
        return False

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
        terrain_type = self.terrain_manager.terrain_layers[self.terrain_manager.terrain.terrain[neighbor[1]][neighbor[0]]]
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
            if 0 <= x < self.terrain_manager.terrain.width and 0 <= y < self.terrain_manager.terrain.width:
                neighbors.append((x, y))
        return neighbors

    def reconstruct_path(self, came_from, current):
        # Reconstruct the path from end to start
        total_path = [current]
        while current in came_from:
            current = came_from[current]
            total_path.append(current)
        return total_path[::-1]  # Reverse the path
    
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
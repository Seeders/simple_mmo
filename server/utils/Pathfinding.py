import heapq
class Pathfinding:
    def __init__(self, terrain, costs):
        self.terrain = terrain  # 2D grid representing the terrain
        self.costs = costs      # Dictionary mapping terrain types to movement costs

    def a_star(self, start, goal):
        goal = self.modify_goal_if_unreachable(start, goal)
        if start == goal:
            #print('start is goal', start, goal)
            return [start]  # or [goal], since they are the same

        # If the goal is an immediate neighbor of the start and is accessible
        if goal in self.get_neighbors(start):
            #print('immediate neighbor', start, goal)
            return [start, goal]
        frontier = PriorityQueue()
        frontier.put(start, 0)
        came_from = {start: None}
        cost_so_far = {start: 0}

        while not frontier.empty():
            current = frontier.get()

            if current == goal:
                break

            for next in self.get_neighbors(current):
                new_cost = cost_so_far[current] + self.cost(next)
                if next not in cost_so_far or new_cost < cost_so_far[next]:
                    cost_so_far[next] = new_cost
                    priority = new_cost + self.heuristic(goal, next)
                    frontier.put(next, priority)
                    came_from[next] = current

        return self.reconstruct_path(came_from, start, goal)

    def heuristic(self, nodeA, nodeB):
        # Use Manhattan distance as the heuristic
        return abs(nodeA[0] - nodeB[0]) + abs(nodeA[1] - nodeB[1])

    def cost(self, node):
        # Use the node's position to get the terrain type, and then the cost for that type
        terrainType = self.terrain[node[1]][node[0]]
        return self.costs[terrainType]

    def get_neighbors(self, node):
        neighbors = []
        directions = [(0, -1), (0, 1), (-1, 0), (1, 0)]
        for dx, dy in directions:
            newX, newY = node[0] + dx, node[1] + dy
            if 0 <= newX < len(self.terrain[0]) and 0 <= newY < len(self.terrain):
                if self.costs[self.terrain[newY][newX]] > 0:  # Check if passable
                    neighbors.append((newX, newY))
        return neighbors

    def reconstruct_path(self, came_from, start, goal):
        if goal not in came_from:
        # Handle the case where no path was found
            return []  # or some other indication that no path was found

        current = goal
        path = []
        while current != start:
            path.append(current)
            current = came_from[current]
        path.append(start)
        path.reverse()
        return path

    def modify_goal_if_unreachable(self, start, goal):
        if not self.is_passable(goal):
            return self.find_nearest_accessible_tile(goal, start)
        return goal

    def is_passable(self, node):
        return self.costs[self.terrain[node[1]][node[0]]] > 0

    def find_nearest_accessible_tile(self, target, start):
        neighbors = self.get_neighbors(target)
        # Sort neighbors by their distance to the start position
        neighbors.sort(key=lambda n: self.heuristic(n, start))
        for neighbor in neighbors:
            if self.is_passable(neighbor):
                return neighbor
        return start  # Fallback in case no accessible neighbors are found

class PriorityQueue:
    def __init__(self):
        self.elements = []
    
    def empty(self):
        return len(self.elements) == 0

    def put(self, item, priority):
        heapq.heappush(self.elements, (priority, item))

    def get(self):
        return heapq.heappop(self.elements)[1]

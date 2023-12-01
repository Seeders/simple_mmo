from utils.utils import position_to_tuple, tuple_to_position
import asyncio
from utils.broadcast import broadcast 
class Worker:
    def __init__(self, world, parent, worker_id, home_town):
        self.world = world
        self.id = worker_id
        self.parent = parent
        self.target_tree = None
        self.carrying_resource = None
        self.resource_amount = 0
        self.path_to_tree = []  # Store the path to the tree
        self.path_to_base = []  # Store the path to the base
        self.state = "idle"  # States: "idle", "moving", "gathering", "returning"
        self.home_town = home_town  # Worker"s town or base position
        self.last_action_time = 0  # Time of the last action
        self.gathering_rate = 1  # Time in seconds to gather resources
        self.move_speed = 1  # Movement speed of the worker (tiles per second)
        self.can_not_reach_tree_ids = []

    def update(self, current_time):
        # Check if it"s time to perform the next action based on move speed or gathering rate
        time_since_last_action = current_time - self.last_action_time

        if self.state == "idle":
            self.find_nearest_tree()

      #  print(self.id, time_since_last_action, self.state)
        if self.state == "moving" and time_since_last_action >= 1 / self.move_speed:
       #     print(self.id, "moving")  
            self.move_towards_target(current_time)
        elif self.state == "gathering" and time_since_last_action >= self.gathering_rate:
        #    print(self.id, "gathering")  
            self.gather_resources(current_time)
        elif self.state == "returning" and time_since_last_action >= 1 / self.move_speed:
         #   print(self.id, "returning")  
            self.return_resources(current_time)

    def move_towards_target(self, current_time):
        if self.target_tree:    
            if len(self.path_to_tree) == 0:        
                #print(self.id, "find path to tree")
                self.path_to_tree = self.world.find_path(self.parent.position, self.target_tree["position"])
           # print(self.id, "move_towards_target", self.target_tree, self.path_to_tree)
            if self.path_to_tree and len(self.path_to_tree) > 1:
                self.follow_path(self.path_to_tree, current_time)
            elif len(self.path_to_tree) == 1:
                self.state = "gathering"
                self.last_action_time = current_time
               # print(self.id, "begin gathering")
            else:
                self.path_to_tree = []
                self.state = "idle"
        else:            
            #print(self.id, "no target tree")
            pass

    def return_resources(self, current_time): 
        #print(self.id, "return_resources", self.path_to_base)     

        if len(self.path_to_base) == 0:
            #print(self.id, "find path to home")
            self.path_to_base = self.world.find_path(self.parent.position, self.world.town_manager.towns[self.home_town].position)
        elif self.path_to_base and len(self.path_to_base) > 1:
            #print(self.id, "follow_path to home", self.path_to_base)
            self.follow_path(self.path_to_base, current_time)
        else:
            self.state = "idle"



    def follow_path(self, path, current_time):
        #print(self.id, "follow_path", path)
        #print(f"Worker {self.id} moved to {self.parent.position}. Target Tree: {self.target_tree["position"]}. State: {self.state}")
        # Transition to gathering if adjacent to the target tree
        if self.state == "moving" and self.is_adjacent(self.parent.position, self.target_tree["position"]):
            #print(f"Worker {self.id} is adjacent to the tree. Transitioning to gathering.")
            self.state = "gathering"
            self.last_action_time = current_time
           # print(self.id, "begin gathering")
        elif self.state == "returning" and self.is_adjacent(self.parent.position, self.world.town_manager.towns[self.home_town].position):
            #print(self.id, "deposit resources")
            self.deposit_resources(current_time)            
        else:
           # print(self.id, "take next step")
            next_step = path.pop(1)
            self.parent.position = tuple_to_position(next_step)
            self.last_action_time = current_time


    def is_adjacent(self, pos1, pos2):
        adjacent = (abs(pos1["x"] - pos2["x"]) == 1 and abs(pos1["y"] - pos2["y"]) == 0) or (abs(pos1["x"] - pos2["x"]) == 0 and abs(pos1["y"] - pos2["y"]) == 1)
       # print(f"Checking adjacency between {pos1} and {pos2}: {adjacent}")
        return adjacent

    def find_nearest_tree(self):
        nearest_tree = None
        min_distance = float("inf")
       # print(self.id, "searching for tree")
        for tree in self.world.tree_manager.trees:
            if tree["index"] in self.can_not_reach_tree_ids:
                continue
            if tree["health"] <= 0:            
                continue  # Skip depleted trees
            distance = self.calculate_distance(self.parent.position, tree["position"])
            if distance < min_distance:            
                min_distance = distance
                nearest_tree = tree

        if nearest_tree:
            path_to_tree = self.world.find_path(self.parent.position, nearest_tree["position"])
            if len(path_to_tree) > 0:  # Check if a valid path exists
                self.path_to_tree = path_to_tree  # Store the valid path
            else:
                self.can_not_reach_tree_ids.append(nearest_tree["index"])
                nearest_tree = None
                                
        if nearest_tree:
            #print(self.id, "found", nearest_tree, self.path_to_tree)
            self.target_tree = nearest_tree
            self.state = "moving"
            self.can_not_reach_tree_ids = []


    def gather_resources(self, current_time):
        #print(f"Worker {self.id} is gathering resources. Current amount: {self.resource_amount}")
        if self.target_tree:
            if self.target_tree["health"] <= 0:
                self.state = "idle"
                self.target_tree["type"] = "stump"
                target_type = "tree"    
                return
            self.carrying_resource = "wood"
            self.target_tree["health"] = self.target_tree["health"] - 1
            self.resource_amount += 1  # Increment resources gathered
           # print(f"Worker {self.id} now has {self.resource_amount} resources.")
           # print(self.target_tree["health"])
            if self.target_tree["health"] <= 0:
                self.state = "idle"
                self.target_tree["type"] = "stump"
                target_type = "tree"            
                asyncio.create_task(broadcast({
                    "type": f"update_{target_type}",   
                    f"{target_type}_index": self.target_tree["index"],                      
                    f"{target_type}_position": self.target_tree["position"],   
                    f"{target_type}_health": self.target_tree["health"],   
                    f"{target_type}_type": self.target_tree["type"] 
                }, self.world.game_manager.connected, self.world.game_manager.connections))  
            if self.resource_amount >= 10:  # Arbitrary limit for resource carrying capacity
                self.state = "returning"
                self.path_to_tree = []  # Clear the path
               # print(f"Worker {self.id} gathered enough resources. Transitioning to returning.")
            else:
                pass
               # print(f"Worker {self.id} continues gathering. Not enough resources yet.")
        else:
            pass
            #print(f"Worker {self.id} has no target tree. Something might be wrong.")
        self.last_action_time = current_time

    def deposit_resources(self, current_time):
        # Logic to deposit resources at the base
       # print(self.id, "depositing ", self.resource_amount, self.carrying_resource)        
        self.world.faction_manager.add_resources(self.parent.faction, self.carrying_resource, self.resource_amount)
        self.resource_amount = 0
        self.carrying_resource = None
        self.state = "idle"
        self.last_action_time = current_time
        self.path_to_base = []
        asyncio.create_task(broadcast({
            "type": "update_faction_resources",
            "faction": self.parent.faction,
            "resources": self.world.faction_manager.factions[self.parent.faction]["resources"]
        }, self.world.game_manager.connected, self.world.game_manager.connections))

    @staticmethod
    def calculate_distance(pos1, pos2):
        return abs(pos1["x"] - pos2["x"]) + abs(pos1["y"] - pos2["y"])

import asyncio
import random

BASE_HEALTH = 100
HEALTH_INCREMENT = 20  # Additional health per level
from utils.broadcast import broadcast, broadcastCombatLog

class Player:

    def __init__(self, game_manager, player_id, position, stats=None, inventory=[]):
        self.id = player_id
        self.game_manager = game_manager
        self.position = position if position else {"x": 50, "y": 50}
        self.in_combat = False
        self.attacking = False
        self.inventory = inventory
        self.color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
        self.last_attack_time = asyncio.get_event_loop().time()
        default_stats = self.generate_player_stats()
        self.stats = {**default_stats, **(stats or {})}

    def level_up(self):
        self.stats['level'] += 1
        self.stats['experience'] = 0
        self.stats['next_level_exp'] = self.calculate_next_level_exp(self.stats['level'])
        
        # Increase health with level
        self.stats['max_health'] += HEALTH_INCREMENT
        self.stats['health'] = self.stats['max_health']  # Heal the player to full health on level up

    def is_in_combat(self, enemy_position):
        dx = abs(self.position['x'] - enemy_position['x'])
        dy = abs(self.position['y'] - enemy_position['y'])
        return dx <= 1 and dy <= 1

    def move(self, new_position):
        if self.game_manager.world.is_position_valid(new_position):
            if self.is_tree_at_position(new_position):
                self.attack_tree(new_position)
                return False  # Player does not move, but attacks the tree
            self.position = new_position
            return True
        return False

    def is_tree_at_position(self, position):
        for tree in self.game_manager.world.trees:
            if tree["type"] != "stump" and tree["position"]["x"] == position["x"] and tree["position"]["y"] == position["y"]:
                return True
        return False

    def attack_tree(self, position):
        # Reduce the health of the tree
        for tree in self.game_manager.world.trees:
            if tree["position"] == position and tree["type"] != "stump":
                asyncio.create_task(broadcast({
                    "type": "start_attack",   
                    "playerId": self.id,
                    "targetPosition": tree["position"]
                }, self.game_manager.connected, self.game_manager.connections))
                tree["health"] -= self.stats["damage"]
                if tree["health"] <= 0:
                    tree["type"] = "stump"  # Change tree type to 'stump' when health is depleted
                    tree["health"] = 0  # Optional: Set health to 0 to avoid negative values
                    # Broadcast combat log update for destroying the tree
                    asyncio.create_task(broadcastCombatLog(
                        self.game_manager.combat_logs, self.id, 
                        f"{self.id} destroyed a tree at {position}.", 
                        self.game_manager.connected, self.game_manager.connections))
                else:
                    # Broadcast combat log update for attacking the tree
                    asyncio.create_task(broadcastCombatLog(
                        self.game_manager.combat_logs, self.id, 
                        f"{self.id} attacked a tree for {self.stats['damage']} damage, {tree['health']} remaining.", 
                        self.game_manager.connected, self.game_manager.connections))

                # Broadcast tree update
                asyncio.create_task(broadcast({
                    "type": "update_trees",                
                    "trees": self.game_manager.world.trees
                }, self.game_manager.connected, self.game_manager.connections))
                break  # Exit the loop once the tree is found and processed

    @staticmethod
    def calculate_next_level_exp(level):
        # This is a simple formula, you might want to create a more complex one
        return 100 * (level ** 2)
    
    @staticmethod
    def generate_player_stats():
        return {
            "level": 1,
            "health": BASE_HEALTH,
            "max_health": BASE_HEALTH,  # Add a max health attribute
            "experience": 0,
            "next_level_exp": 100,
            "type": "player",
            "attack_speed": 1,  # Attacks every 1 seconds
            "move_speed": 3,
            "abilities": [],
            "damage": 15,  # Removed the duplicate 'damage' key
            "defense": 10,
            "walk_frames": 4,
            "attack_frames": 4,
            "attack_animation_order": ["down", "up", "left", "right"],
            "walk_animation_order": ["down", "up", "left", "right"]
        }

import asyncio
import random

BASE_HEALTH = 100
HEALTH_INCREMENT = 20  # Additional health per level
from utils.broadcast import broadcast, broadcastCombatLog
from .item import generate_specific_item
from .attacker import Attacker
class Player:

    def __init__(self, world, player_id, position={"x": 50, "y": 50}, stats=None, inventory=[]):
        self.id = player_id
        self.faction = 0
        self.world = world
        self.position = position
        self.inventory = inventory     
        self.unit_type = "player"   
        default_stats = self.generate_player_stats()
        self.stats = {**default_stats, **(stats or {})}
        self.name = player_id
        self.attacker = Attacker(self, self.stats)
        self.world.spacial_grid.add_entity(self)

    def level_up(self):
        self.stats['level'] += 1
        self.stats['experience'] = 0
        self.stats['next_level_exp'] = self.calculate_next_level_exp(self.stats['level'])
        
        # Increase health with level
        self.stats['max_health'] += HEALTH_INCREMENT
        self.stats['health'] = self.stats['max_health']  # Heal the player to full health on level up

    def move(self, new_position):
        if self.world.is_position_valid(new_position):
            if self.world.tile_type_at_position(new_position) == "forest" and self.world.tile_type_at_position(self.position) == "grass" and self.world.is_ramp_at_position(new_position) == -1:
                return False # Player must use ramp to go to forest from grass
            if self.world.tile_type_at_position(new_position) == "grass" and self.world.tile_type_at_position(self.position) == "forest" and self.world.is_ramp_at_position(self.position) == -1:
                return False # Player must use ramp to go to grass from forest
            if self.is_tree_at_position(new_position):
                self.attack_tree(new_position)
                return False  # Player does not move, but attacks the tree
            if self.is_stone_at_position(new_position):
                self.attack_stone(new_position)
                return False  # Player does not move, but attacks the tree
            self.world.spacial_grid.move_entity(self, new_position)
            return True
        return False

    def is_tree_at_position(self, position):
        for tree in self.world.trees:
            if tree["type"] != "stump" and tree["position"]["x"] == position["x"] and tree["position"]["y"] == position["y"]:
                return True
        return False
    
    def is_stone_at_position(self, position):
        for stone in self.world.stones:
            if stone["position"]["x"] == position["x"] and stone["position"]["y"] == position["y"]:
                return True
        return False

    def drop_specific_item(self, itemType, position):
        item_id = self.world.game_manager.next_item_id
        self.world.game_manager.next_item_id += 1  # Increment the ID for the next item
        item = generate_specific_item(itemType, item_id, position)                              
        self.world.items_on_ground[item_id] = item
        asyncio.create_task(broadcast({
            "type": "item_drop",
            "itemId": item_id,
            "item": {
                "id": item.id,
                "type": item.type,
                "item_type": item.item_type,
                "name": item.name,
                "position": item.position
            }
        }, self.world.game_manager.connected, self.world.game_manager.connections))

    def attack_stone(self, position):
        # Reduce the health of the stone
        for index, stone in enumerate(self.world.stones):
            if stone["position"] == position:
                asyncio.create_task(broadcast({
                    "type": "start_attack",   
                    "playerId": self.id,
                    "targetPosition": stone["position"]
                }, self.world.game_manager.connected, self.world.game_manager.connections))

                stone["health"] -= self.stats["damage"]

                if stone["health"] <= 0:
                    stone["health"] = 0  # Set health to 0 to avoid negative values

                    # Broadcast combat log update for destroying the stone
                    asyncio.create_task(broadcastCombatLog(
                        self.world.game_manager.combat_logs, self.id, 
                        f"{self.id} destroyed a stone at {position}.", 
                        self.world.game_manager.connected, self.world.game_manager.connections))

                    self.drop_specific_item('stone', position)

                    # Remove the stone from world.stones
                    del self.world.stones[index]

                else:
                    # Broadcast combat log update for attacking the stone
                    asyncio.create_task(broadcastCombatLog(
                        self.world.game_manager.combat_logs, self.id, 
                        f"{self.id} attacked a stone for {self.stats['damage']} damage, {stone['health']} remaining.", 
                        self.world.game_manager.connected, self.world.game_manager.connections))

                # Broadcast stone update
                asyncio.create_task(broadcast({
                    "type": "update_stones",                
                    "stones": self.world.stones
                }, self.world.game_manager.connected, self.world.game_manager.connections))
                break  # Exit the loop once the stone is found and processed


    def attack_tree(self, position):
        # Reduce the health of the tree
        for tree in self.world.trees:
            if tree["position"] == position and tree["type"] != "stump":
                asyncio.create_task(broadcast({
                    "type": "start_attack",   
                    "playerId": self.id,
                    "targetPosition": tree["position"]
                }, self.world.game_manager.connected, self.world.game_manager.connections))
                tree["health"] -= self.stats["damage"]
                if tree["health"] <= 0:
                    tree["type"] = "stump"  # Change tree type to 'stump' when health is depleted
                    tree["health"] = 0  # Optional: Set health to 0 to avoid negative values
                    # Broadcast combat log update for destroying the tree
                    asyncio.create_task(broadcastCombatLog(
                        self.world.game_manager.combat_logs, self.id, 
                        f"{self.id} destroyed a tree at {position}.", 
                        self.world.game_manager.connected, self.world.game_manager.connections))                    

                    self.drop_specific_item('wood', position)

                else:
                    # Broadcast combat log update for attacking the tree
                    asyncio.create_task(broadcastCombatLog(
                        self.world.game_manager.combat_logs, self.id, 
                        f"{self.id} attacked a tree for {self.stats['damage']} damage, {tree['health']} remaining.", 
                        self.world.game_manager.connected, self.world.game_manager.connections))

                # Broadcast tree update
                asyncio.create_task(broadcast({
                    "type": "update_trees",                
                    "trees": self.world.trees
                }, self.world.game_manager.connected, self.world.game_manager.connections))
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
            "attack_range": 2, 
            "move_speed": 3,
            "abilities": [],
            "damage": 15,  # Removed the duplicate 'damage' key
            "defense": 10,
            "walk_frames": 4,
            "attack_frames": 4,
            "attack_animation_order": ["down", "up", "left", "right"],
            "walk_animation_order": ["down", "up", "left", "right"],
            "resources": {
                "wood": 0,
                "stone": 0,
                "gold": 0
            }
        }

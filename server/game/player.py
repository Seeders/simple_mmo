import asyncio
import random

BASE_HEALTH = 100
HEALTH_INCREMENT = 20  # Additional health per level
from utils.broadcast import broadcast, broadcastCombatLog
from .item import generate_specific_item
from .attacker import Attacker
from .config.world_size import tile_size
from .pathfinder import Pathfinder
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
        self.set_next_level_exp()
        self.check_exp()
        self.name = player_id
        self.attacker = Attacker(self, self.stats)
        self.world.spacial_grid.add_entity(self)
        self.pathfinder = Pathfinder(self.world, self, self.stats['move_speed'])

    def update(self, current_time):
        self.pathfinder.update(current_time)

    def set_next_level_exp(self):        
        self.stats['next_level_exp'] = self.calculate_next_level_exp(self.stats['level'])

    def check_exp(self):
        if self.stats['experience'] >= self.stats['next_level_exp']:
            self.level_up()
            
    def level_up(self):
        self.stats['level'] += 1
        self.stats['experience'] = 0
        self.set_next_level_exp()
        
        # Increase health with level
        self.stats['max_health'] += HEALTH_INCREMENT
        self.stats['health'] = self.stats['max_health']  # Heal the player to full health on level up

    def move(self, destination):
        self.pathfinder.set_destination(destination)
        new_destination = destination#{ 'x': int(destination['x'] / tile_size), 'y': int(destination['y'] / tile_size) }

        if self.world.terrain_manager.is_position_valid(new_destination):
            if self.pathfinder.is_adjacent(self.position, destination):
                if self.world.terrain_manager.tile_type_at_position(new_destination) == "forest" and self.world.terrain_manager.tile_type_at_position(self.position) == "grass" and self.world.terrain_manager.is_ramp_at_position(new_destination) == -1:
                    return False # Player must use ramp to go to forest from grass
                if self.world.terrain_manager.tile_type_at_position(new_destination) == "grass" and self.world.terrain_manager.tile_type_at_position(self.position) == "forest" and self.world.terrain_manager.is_ramp_at_position(self.position) == -1:
                    return False # Player must use ramp to go to grass from forest
                if self.is_tree_at_position(new_destination):
                    self.attack_target("tree", new_destination)
                    return False  # Player does not move, but attacks the tree
                if self.is_stone_at_position(new_destination):
                    self.attack_target("stone", new_destination)
                    return False  # Player does not move, but attacks the tree
            return True
        return False

    def is_tree_at_position(self, position):
        for tree in self.world.tree_manager.trees:
            if tree["type"] != "stump" and tree["position"]["x"] == position["x"] and tree["position"]["y"] == position["y"]:
                return True
        return False
    
    def is_stone_at_position(self, position):
        for stone in self.world.stone_manager.stones:
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

    def attack_target(self, target_type, position):
        target_index = 0
        targets = []
        if target_type == 'tree':
            targets = self.world.tree_manager.trees
        elif target_type == 'stone':
            targets = self.world.stone_manager.stones

        for index, target in enumerate(targets):
            if target["position"] == position and (target_type != 'tree' or target["type"] != "stump"):
                self.start_attack(position)

                target["health"] -= self.stats["damage"]
                if target["health"] <= 0:
                    self.handle_target_destruction(target, target_type, position, index)
                
                self.broadcast_target_attack(target, target_index, target_type, position)
                break
            else:
                target_index += 1

    def start_attack(self, position):
        asyncio.create_task(broadcast({
            "type": "start_attack",   
            "playerId": self.id,
            "targetPosition": position
        }, self.world.game_manager.connected, self.world.game_manager.connections))

    def handle_target_destruction(self, target, target_type, position, index):
        item_type = 'stone' if target_type == 'stone' else 'wood'
        target["health"] = 0
        if target_type == 'tree':
            target["type"] = "stump"

        asyncio.create_task(broadcastCombatLog(
            self.world.game_manager.combat_logs, self.id, 
            f"{self.id} destroyed a {target_type} at {position}.", 
            self.world.game_manager.connected, self.world.game_manager.connections))
        
        self.drop_specific_item(item_type, position)        
        if not target_type == 'tree':
            self.world.stone_manager.remove_stone_at_index(index)

    def broadcast_target_attack(self, target, target_index, target_type, position):
        asyncio.create_task(broadcastCombatLog(
            self.world.game_manager.combat_logs, self.id, 
            f"{self.id} attacked a {target_type} for {self.stats['damage']} damage, {target['health']} remaining.", 
            self.world.game_manager.connected, self.world.game_manager.connections))

        asyncio.create_task(broadcast({
            "type": f"update_{target_type}",   
            f"{target_type}_index": target_index,                      
            f"{target_type}_position": position,   
            f"{target_type}_health": target["health"],   
            f"{target_type}_type": target.get("type", '')  # For trees
        }, self.world.game_manager.connected, self.world.game_manager.connections))


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

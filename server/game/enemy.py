import random
import copy
import asyncio
from utils.broadcast import broadcast
from .attacker import Attacker
class Enemy:
    def __init__(self, world, enemy_id, enemy_type, position, full_path):
        self.world = world
        self.id = enemy_id
        self.faction = 1
        self.position = position
        self.stats = copy.deepcopy(get_enemy_stats(enemy_type))
        self.name = self.stats["name"]
        self.attacker = Attacker(self, self.stats)
        self.paths = full_path
        self.path_index = 0        
        self.unit_type = "unit"
        self.type = enemy_type
        self.last_patrol_update = 0  # Time of the last patrol update
        self.patrol_delay = 5 / self.stats["move_speed"]  # Delay in seconds
        self.current_waypoint_index = 0
        self.moving_to_waypoint = False
        self.patrol_direction = 1  # 1 for forward, -1 for reverse
        self.health_regeneration_delay = 5  # 5 seconds delay for health regeneration
        self.world.spacial_grid.add_entity(self)

    def __eq__(self, other):
        return self.id == other.id if other else False
    
    def update(self, current_time):
        if not self.attacker.in_combat:
          if current_time - self.last_patrol_update >= self.patrol_delay and len(self.paths) > 0:
            self.last_patrol_update = current_time
            # Select movement behavior based on enemy type
            if self.stats["behavior"] == "patrol":
                self.patrol_movement()
            elif self.stats["behavior"] == "wander":
                self.wander_movement()
            else:
                self.wander_movement()

            # Check if the enemy should start regenerating health
          if self.attacker.last_stopped_combat is not None:
              if current_time - self.attacker.last_stopped_combat >= self.health_regeneration_delay:
                  self.regenerate_health()
        else:
          self.last_patrol_update = current_time + self.health_regeneration_delay

    def move_along_path(self):
        # Check if at the end of the path and reverse direction if needed
        if self.path_index >= len(self.paths) - 1:
            self.patrol_direction = -1  # Reverse direction
        elif self.path_index <= 0:
            self.patrol_direction = 1  # Change direction to forward

        # Update the path index
        self.path_index += self.patrol_direction

        # Ensure path_index stays within bounds
        self.path_index = max(0, min(self.path_index, len(self.paths) - 1))

        # Update position
        self.world.spacial_grid.move_entity(self, self.paths[self.path_index])

    def patrol_movement(self):      
        next_index = self.path_index + self.patrol_direction
        if 0 <= next_index < len(self.paths):
            next_position = self.paths[next_index]
            if self.world.is_position_valid(next_position):
                self.move_along_path()
                

    def regenerate_health(self):
        # Regenerate health to full
        self.stats["health"] = self.stats["max_health"]
        asyncio.create_task(broadcast({
            "type": "health_regeneration",
            "enemyId": self.id,
            "newHealth": int(self.stats['health'])
        }, self.world.game_manager.connected, self.world.game_manager.connections))
            
    def wander_movement(self):
        # Example of a simple wander behavior
        x = self.position["x"] + random.randint(-1, 1)
        y = self.position["y"] + random.randint(-1, 1)
        new_position = {"x": x, "y": y}
        if self.world.is_position_valid(new_position):
            if self.world.tile_type_at_position(new_position) == "forest" and self.world.tile_type_at_position(self.position) == "grass" and self.world.is_ramp_at_position(new_position) == -1:
                return False # Player must use ramp to go to forest from grass
            if self.world.tile_type_at_position(new_position) == "grass" and self.world.tile_type_at_position(self.position) == "forest" and self.world.is_ramp_at_position(self.position) == -1:
                return False # Player must use ramp to go to grass from forest
            self.world.spacial_grid.move_entity(self, new_position)

def get_enemy_stats(enemy_type):
    if enemy_type in enemy_types:
        eType = enemy_types[enemy_type]
        eType["level"] = 1
        eType["max_health"] = eType["health"]
        return eType
    else:
        raise ValueError(f"Unknown enemy type: {enemy_type}")    
        

enemy_types = {
  "imp": {
    "type": "imp",
    "name": "Imp",
    "health": 25,
    "attack_speed": 1.5,
    "move_speed": 3,
    "abilities": ["fireball"],
    "behavior": "patrol",
    "damage": 6,
    "defense": 2,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "flame_guardian": {
    "type": "flame_guardian",
    "name": "Flame Guardian",
    "health": 150,
    "attack_speed": 0.8,
    "move_speed": 1.5,
    "abilities": ["flame_wave", "heat_shield"],
    "behavior": "patrol",
    "damage": 20,
    "defense": 12,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "demon": {
    "type": "demon",
    "name": "Demon",
    "health": 180,
    "attack_speed": 1.0,
    "move_speed": 2,
    "abilities": ["dark_blast", "fear"],
    "behavior": "patrol",
    "damage": 22,
    "defense": 10,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "black_dragon": {
    "type": "black_dragon",
    "name": "Black Dragon",
    "health": 300,
    "attack_speed": 0.6,
    "move_speed": 2.5,
    "abilities": ["acid_breath", "wing_gust"],
    "behavior": "patrol",
    "damage": 30,
    "defense": 18,
    "size": 32,
    "walk_frames": 4,
    "attack_frames": 2,
    "attack_animation_order": ["down", "up", "left", "right"],
    "walk_animation_order": ["down", "up", "left", "right"]
  },
  "blue_dragon": {
    "type": "blue_dragon",
    "name": "Blue Dragon",
    "health": 280,
    "attack_speed": 0.7,
    "move_speed": 2.5,
    "abilities": ["lightning_breath", "thunder_roar"],
    "behavior": "patrol",
    "damage": 28,
    "defense": 16,
    "size": 32,
    "walk_frames": 4,
    "attack_frames": 2,
    "attack_animation_order": ["down", "up", "left", "right"],
    "walk_animation_order": ["down", "up", "left", "right"]
  },
  "red_dragon": {
    "type": "red_dragon",
    "name": "Red Dragon",
    "health": 320,
    "attack_speed": 0.5,
    "move_speed": 2.5,
    "abilities": ["fire_breath", "smoke_screen"],
    "behavior": "patrol",
    "damage": 32,
    "defense": 20,
    "size": 32,
    "walk_frames": 4,
    "attack_frames": 2,
    "attack_animation_order": ["down", "up", "left", "right"],
    "walk_animation_order": ["down", "up", "left", "right"]
  },
  "white_dragon": {
    "type": "white_dragon",
    "name": "White Dragon",
    "health": 260,
    "attack_speed": 0.75,
    "move_speed": 2.5,
    "abilities": ["frost_breath", "blizzard"],
    "behavior": "patrol",
    "damage": 26,
    "defense": 14,
    "size": 32,
    "walk_frames": 4,
    "attack_frames": 2,
    "attack_animation_order": ["down", "up", "left", "right"],
    "walk_animation_order": ["down", "up", "left", "right"]
  },
  "yellow_dragon": {
    "type": "yellow_dragon",
    "name": "Yellow Dragon",
    "health": 290,
    "attack_speed": 0.65,
    "move_speed": 2.5,
    "abilities": ["lightning_breath", "sandstorm"],
    "behavior": "patrol",
    "damage": 29,
    "defense": 17,
    "size": 32,
    "walk_frames": 4,
    "attack_frames": 2,
    "attack_animation_order": ["down", "up", "left", "right"],
    "walk_animation_order": ["down", "up", "left", "right"]
  },
  "mammoth": {
    "type": "mammoth",
    "name": "Mammoth",
    "health": 350,
    "attack_speed": 0.4,
    "move_speed": 1.2,
    "abilities": ["trample", "tusk_swipe"],
    "behavior": "wander",
    "damage": 35,
    "defense": 25,
    "walk_frames": 4,
    "attack_frames": 3,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "wendigo": {
    "type": "wendigo",
    "name": "Wendigo",
    "health": 200,
    "attack_speed": 1.2,
    "move_speed": 3,
    "abilities": ["frost_bite", "howl"],
    "behavior": "patrol",
    "damage": 24,
    "defense": 10,
    "walk_frames": 4,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "yeti": {
    "type": "yeti",
    "name": "Yeti",
    "health": 220,
    "attack_speed": 0.9,
    "move_speed": 2.5,
    "abilities": ["snowball_throw", "icy_roar"],
    "behavior": "patrol",
    "damage": 26,
    "defense": 12,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "giant_crab": {
    "type": "giant_crab",
    "name": "Giant Crab",
    "health": 180,
    "attack_speed": 0.7,
    "move_speed": 1.5,
    "abilities": ["claw_snap", "shell_shield"],
    "behavior": "wander",
    "damage": 20,
    "defense": 15,
    "walk_frames": 0,
    "attack_frames": 3,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "archer_goblin": {
    "type": "archer_goblin",
    "name": "Archer Goblin",
    "health": 40,
    "attack_speed": 2.0,
    "move_speed": 3,
    "abilities": ["arrow_shot"],
    "behavior": "patrol",
    "damage": 8,
    "defense": 3,
    "walk_frames": 5,
    "attack_frames": 3,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "club_goblin": {
    "type": "club_goblin",
    "name": "Club Goblin",
    "health": 50,
    "attack_speed": 1.5,
    "move_speed": 2.5,
    "abilities": ["club_smash"],
    "behavior": "patrol",
    "damage": 10,
    "defense": 4,
    "walk_frames": 5,
    "attack_frames": 3,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "farmer_goblin": {
    "type": "farmer_goblin",
    "name": "Farmer Goblin",
    "health": 30,
    "attack_speed": 1.8,
    "move_speed": 3,
    "abilities": ["pitchfork_poke"],
    "behavior": "patrol",
    "damage": 6,
    "defense": 2,
    "walk_frames": 5,
    "attack_frames": 3,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "kamikaze_goblin": {
    "type": "kamikaze_goblin",
    "name": "Kamikaze Goblin",
    "health": 20,
    "attack_speed": 3.0,
    "move_speed": 4,
    "abilities": ["explosive_charge"],
    "behavior": "patrol",
    "damage": 30,
    "defense": 1,
    "walk_frames": 5,
    "attack_frames": 5,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "minotaur": {
    "type": "minotaur",
    "name": "Minotaur",
    "health": 250,
    "attack_speed": 0.8,
    "move_speed": 2,
    "abilities": ["axe_swing", "charge"],
    "behavior": "patrol",
    "damage": 28,
    "defense": 18,
    "walk_frames": 4,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "orc": {
    "type": "orc",
    "name": "Orc",
    "health": 120,
    "attack_speed": 1.1,
    "move_speed": 2.2,
    "abilities": ["sword_slash"],
    "behavior": "patrol",
    "damage": 16,
    "defense": 8,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "orc_mage": {
    "type": "orc_mage",
    "name": "Orc Mage",
    "health": 80,
    "attack_speed": 1.5,
    "move_speed": 2,
    "abilities": ["fireball", "magic_barrier"],
    "behavior": "patrol",
    "damage": 14,
    "defense": 6,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "orc_shaman": {
    "type": "orc_shaman",
    "name": "Orc Shaman",
    "health": 90,
    "attack_speed": 1.4,
    "move_speed": 2,
    "abilities": ["healing_ritual", "poison_cloud"],
    "behavior": "patrol",
    "damage": 12,
    "defense": 7,
    "walk_frames": 5,
    "attack_frames": 5,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "spear_goblin": {
    "type": "spear_goblin",
    "name": "Spear Goblin",
    "health": 45,
    "attack_speed": 1.7,
    "move_speed": 3,
    "abilities": ["spear_thrust"],
    "behavior": "patrol",
    "damage": 9,
    "defense": 3,
    "walk_frames": 5,
    "attack_frames": 5,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "necromancer": {
    "type": "necromancer",
    "name": "Necromancer",
    "health": 150,
    "attack_speed": 1.3,
    "move_speed": 2,
    "abilities": ["dark_magic", "summon_skeleton"],
    "behavior": "wander",
    "damage": 18,
    "defense": 10,
    "walk_frames": 5,
    "attack_frames": 6,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "skeleton": {
    "type": "skeleton",
    "name": "Skeleton",
    "health": 60,
    "attack_speed": 1.5,
    "move_speed": 2.5,
    "abilities": ["bone_clash"],
    "behavior": "wander",
    "damage": 12,
    "defense": 5,
    "walk_frames": 5,
    "attack_frames": 4,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "green_slime": {
    "type": "green_slime",
    "name": "Green Slime",
    "health": 20,
    "attack_speed": 2.0,
    "move_speed": 1,
    "abilities": ["split"],
    "behavior": "wander",
    "damage": 5,
    "defense": 2,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "blue_slime": {
    "type": "blue_slime",
    "name": "Blue Slime",
    "health": 25,
    "attack_speed": 2.0,
    "move_speed": 1,
    "abilities": ["split", "freeze"],
    "behavior": "wander",
    "damage": 6,
    "defense": 3,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "mega_green_slime": {
    "type": "mega_green_slime",
    "name": "Mega Green Slime",
    "health": 100,
    "attack_speed": 1.5,
    "move_speed": 1.2,
    "abilities": ["split", "acidic_touch"],
    "behavior": "wander",
    "damage": 15,
    "defense": 8,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "mega_blue_slime": {
    "type": "mega_blue_slime",
    "name": "Mega Blue Slime",
    "health": 120,
    "attack_speed": 1.5,
    "move_speed": 1.2,
    "abilities": ["split", "freeze", "icy_touch"],
    "behavior": "wander",
    "damage": 17,
    "defense": 10,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "king_green_slime": {
    "type": "king_green_slime",
    "name": "King Green Slime",
    "health": 200,
    "attack_speed": 1.2,
    "move_speed": 1.5,
    "abilities": ["split", "acidic_touch", "regenerate"],
    "behavior": "wander",
    "damage": 25,
    "defense": 15,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "king_blue_slime": {
    "type": "king_blue_slime",
    "name": "King Blue Slime",
    "health": 220,
    "attack_speed": 1.2,
    "move_speed": 1.5,
    "abilities": ["split", "freeze", "icy_touch", "regenerate"],
    "behavior": "wander",
    "damage": 28,
    "defense": 18,
    "walk_frames": 6,
    "attack_frames": 0,
    "attack_animation_order": ["down", "left", "right", "up"],
    "walk_animation_order": ["down", "left", "right", "up"]
  },
  "pirate_grunt": {
    "type": "pirate_grunt",
    "name": "Pirate Grunt",
    "health": 80,
    "attack_speed": 1.4,
    "move_speed": 2.3,
    "abilities": ["sword_swipe"],
    "behavior": "wander",
    "damage": 14,
    "defense": 7,
    "walk_frames": 5,
    "attack_frames": 5,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "pirate_gunner": {
    "type": "pirate_gunner",
    "name": "Pirate Gunner",
    "health": 70,
    "attack_speed": 1.8,
    "move_speed": 2,
    "abilities": ["shoot"],
    "behavior": "wander",
    "damage": 16,
    "defense": 6,
    "walk_frames": 5,
    "attack_frames": 4,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  },
  "pirate_captain": {
    "type": "pirate_captain",
    "name": "Pirate Captain",
    "health": 150,
    "attack_speed": 1.2,
    "move_speed": 2.5,
    "abilities": ["command", "cutlass_slash"],
    "behavior": "wander",
    "damage": 20,
    "defense": 12,
    "walk_frames": 5,
    "attack_frames": 4,
    "attack_animation_order": ["down", "up", "right", "left"],
    "walk_animation_order": ["down", "up", "right", "left"]
  }
}

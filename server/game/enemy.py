import random
import copy
import asyncio
class Enemy:
    def __init__(self, enemy_id, enemy_type, position):
        self.id = enemy_id
        self.position = position
        self.last_attack_time = asyncio.get_event_loop().time()
        self.stats = copy.deepcopy(get_enemy_stats(enemy_type))

def spawn_enemies(num_enemies, world_width, world_height):
    enemies = {}
    for i in range(num_enemies):
        enemy_id = f"Enemy{i}"
        enemy_position = {
            "x": random.randint(0, world_width - 1),
            "y": random.randint(0, world_height - 1)
        }
        # Select a random enemy type
        random_enemy_type = random.choice(list(enemy_types.keys()))
        enemies[enemy_id] = Enemy(enemy_id, random_enemy_type, enemy_position)
    return enemies    

def get_enemy_stats(enemy_type):
    if enemy_type in enemy_types:
        eType = enemy_types[enemy_type]
        eType["level"] = 1
        eType["max_health"] = eType["health"]
        return eType
    else:
        raise ValueError(f"Unknown enemy type: {enemy_type}")    
        

enemy_types = {
    "lava_beast": {
        "type": "lava_beast",
        "name": "Lava Beast",
        "health": 120,
        "attack_speed": 1.25,  # Attacks every 0.8 seconds
        "move_speed": 2,
        "abilities": ["lava_spit"],
        "behavior": "aggressive",
        "damage": 15,
        "defense": 10
    },
    "forest_sprite": {
        "type": "forest_sprite",
        "name": "Forest Sprite",
        "health": 30,
        "attack_speed": 2.0,  # Attacks every 0.5 seconds
        "move_speed": 4,
        "abilities": ["entangle"],
        "behavior": "evasive",
        "damage": 5,
        "defense": 2
    },
    "rock_troll": {
        "type": "rock_troll",
        "name": "Rock Troll",
        "health": 200,
        "attack_speed": 0.5,  # Attacks every 2 seconds
        "move_speed": 1,
        "abilities": ["rock_throw"],
        "behavior": "defensive",
        "damage": 18,
        "defense": 15
    },
    "ghost_wraith": {
        "type": "ghost_wraith",
        "name": "Ghost Wraith",
        "health": 40,
        "attack_speed": 1.5,  # Attacks every 0.67 seconds
        "move_speed": 3,
        "abilities": ["phase_shift"],
        "behavior": "hit-and-run",
        "damage": 12,
        "defense": 0
    },
    "desert_scorpion": {
        "type": "desert_scorpion",
        "name": "Desert Scorpion",
        "health": 80,
        "attack_speed": 1.0,  # Attacks every 1 second
        "move_speed": 2.5,
        "abilities": ["poison_sting"],
        "behavior": "ambush",
        "damage": 9,
        "defense": 8
    },
    "sky_serpent": {
        "type": "sky_serpent",
        "name": "Sky Serpent",
        "health": 90,
        "attack_speed": 1.1,  # Attacks every 0.91 seconds
        "move_speed": 3.5,
        "abilities": ["wind_blast"],
        "behavior": "aerial",
        "damage": 14,
        "defense": 7
    },
    "crystal_giant": {
        "type": "crystal_giant",
        "name": "Crystal Giant",
        "health": 250,
        "attack_speed": 0.4,  # Attacks every 2.5 seconds
        "move_speed": 0.8,
        "abilities": ["crystal_shard"],
        "behavior": "slow",
        "damage": 22,
        "defense": 20
    },
    "swamp_hag": {
        "type": "swamp_hag",
        "name": "Swamp Hag",
        "health": 70,
        "attack_speed": 1.11,  # Attacks every 0.9 seconds
        "move_speed": 2,
        "abilities": ["mire"],
        "behavior": "deceptive",
        "damage": 8,
        "defense": 5
    },
    "thunder_djinn": {
        "type": "thunder_djinn",
        "name": "Thunder Djinn",
        "health": 100,
        "attack_speed": 0.7,  # Attacks every 1.43 seconds
        "move_speed": 2.2,
        "abilities": ["lightning_strike"],
        "behavior": "aggressive",
        "damage": 20,
        "defense": 10
    },
    "bone_warrior": {
        "type": "bone_warrior",
        "name": "Bone Warrior",
        "health": 60,
        "attack_speed": 1.05,  # Attacks every 0.95 seconds
        "move_speed": 2.5,
        "abilities": ["bone_javelin"],
        "behavior": "skirmisher",
        "damage": 11,
        "defense": 4
    }
}

import random
import copy
import asyncio
from utils.broadcast import broadcast
from .attacker import Attacker
class Structure:
    def __init__(self, world, id, faction, type, position):
        self.world = world
        self.id = id
        
        self.faction = faction
        self.position = position
        self.unit_type = "structure"
        self.type = type
        self.attacker = {}
        if type in structure_types:
            self.stats = copy.deepcopy(get_stats(type))
        else:
            self.stats = {  
              "type": "house",
              "name": "House",
              "health": 100,
              "defense": 10
            }
        if "damage" in self.stats:
            self.attacker = Attacker(self, self.stats)
        self.world.spacial_grid.add_entity(self)
        self.name = self.stats["name"]
        self.stats["max_health"] = self.stats["health"]
        del self.stats["name"]
        del self.stats["type"]

    def to_dict(self):
        return {
            "id": self.id,
            "faction": self.faction,            
            "position": self.position,
            "unit_type": self.unit_type,
            "stats": self.stats,
            "type": self.type,
            "name": self.name,
        }

    def __eq__(self, other):
        if isinstance(other, type(self)):
            return self.id == other.id
        return False

def get_stats(type):
    if type in structure_types:
        eType = structure_types[type]
        eType["level"] = 1
        eType["max_health"] = eType["health"]
        return eType
    else:
        raise ValueError(f"Unknown enemy type: {type}")    
        

structure_types = {
    
    "wood_barricade": {
        "type": "wood_barricade",
        "name": "Wood Barricade",
        "health": 250,
        "attack_speed": 0,            
        "damage": 0,
        "defense": 4,    
        "attack_frames": 0,
        "attack_animation_order": ["down", "up", "right", "left"],    
    },
    "stone_wall": {
        "type": "stone_wall",
        "name": "Stone Wall",
        "health": 500,
        "attack_speed": 0,            
        "damage": 0,
        "defense": 5,    
        "attack_frames": 0,
        "attack_animation_order": ["down", "up", "right", "left"],    
    },
    "arrow_tower": {
        "type": "arrow_tower",
        "name": "Arrow Tower",
        "health": 150,
        "attack_speed": 1,            
        "damage": 15,
        "defense": 8,    
        "attack_frames": 6,
        "attack_animation_order": ["down", "up", "right", "left"],    
    },
    "house": {
        "type": "house",
        "name": "House",
        "health": 100,
        "defense": 10
    }
}

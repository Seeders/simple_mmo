import asyncio

class Attacker:

    def __init__(self, parent, stats=None):
        self.faction = 0
        self.parent = parent
        self.in_combat = False
        self.attacking = False      
        self.last_attack_time = asyncio.get_event_loop().time()
        self.last_stopped_combat = asyncio.get_event_loop().time()
        default_stats = self.generate_stats()
        self.stats = {**default_stats, **(stats or {})} 

    def is_in_range_to_attack(self, enemy_position):
        dx = abs(self.parent.position['x'] - enemy_position['x'])
        dy = abs(self.parent.position['y'] - enemy_position['y'])
        return dx <= self.stats["attack_range"] and dy <= self.stats["attack_range"]
                    
    def exit_combat(self):
        # Call this method when the enemy stops attacking
        self.in_combat = False
        self.last_stopped_combat = asyncio.get_event_loop().time()

    @staticmethod
    def generate_stats():
        return {
            "level": 1,
            "attack_speed": 1,  # Attacks every 1 seconds
            "damage": 15,  # Removed the duplicate 'damage' key
            "defense": 10,
            "attack_range": 2,
            "attack_frames": 4,
            "attack_animation_order": ["down", "up", "left", "right"]
        }

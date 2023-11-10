import asyncio
import random

BASE_HEALTH = 100
HEALTH_INCREMENT = 20  # Additional health per level

class Player:

    def __init__(self, game_manager, player_id, position, stats=None):
        self.id = player_id
        self.game_manager = game_manager;
        self.position = position
        self.in_combat = False
        self.attacking = False
        self.inventory = []
        self.color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
        self.last_attack_time = asyncio.get_event_loop().time()
        if stats:
            self.stats = stats
        else:
            self.stats = Player.generate_player_stats()

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
        if self.is_position_valid(new_position):
            self.position = new_position
            return True
        return False

    def is_position_valid(self, position):
        x = int(position['x'])
        y = int(position['y'])
        index = x + y * self.game_manager.world.terrain.width
        length = len(self.game_manager.world.terrain.terrain)
        if 0 <= index < (length * length):
            return True
        return False
    
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
            "defense": 10
        }

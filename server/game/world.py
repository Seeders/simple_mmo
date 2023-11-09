import asyncio
import random
from .enemy import spawn_enemies
from .terrain import Terrain
class World:
    def __init__(self):
        self.players = {}
        self.enemies = spawn_enemies(25, 100, 100)
        self.terrain = Terrain(100, 100)        
        self.items_on_ground = {}
        


    
# game_manager.py

import asyncio
import random
from game.player import Player
from game.world import World
from game.item import generate_random_item
from utils.broadcast import broadcast, broadcastCombatLog

class GameManager:
    def __init__(self):
        self.connected = {}
        self.connections = {}  # This will store websocket connections keyed by player_id        
        self.player_id_counter = 0
        self.next_item_id = 0
        self.world = World()
        self.combat_logs = {}

    async def new_player(self, websocket):
        self.player_id_counter += 1
        player_id = f"Player{self.player_id_counter}"
        player_position = {"x": 50, "y": 50}
        # Create a new Player object without the websocket
        new_player = Player(self, player_id, player_position)
        # Store the Player object in the connected dictionary
        self.connected[player_id] = new_player
        # Store the websocket connection in a separate dictionary
        self.connections[player_id] = websocket

        return new_player

    async def disconnect_player(self, player_id):
        # Make sure player_id is the correct type and is present in the dictionary
        if player_id in self.connected:
            del self.connected[player_id]
        # Handle the case where the player_id is not in the dictionary
        else:
            # Log an error or handle it as appropriate
            print(f"Player ID {player_id} not found in connected players.")

        if player_id in self.connections:
            del self.connections[player_id]
        # Handle the case where the player_id is not in the dictionary
        else:
            # Log an error or handle it as appropriate
            print(f"Player ID {player_id} not found in connections.")

        await broadcast({
            "type": "player_disconnect",
            "id": player_id
        }, self.connected, self.connections)

    async def combat_handler(self):
        while True:
            current_time = asyncio.get_event_loop().time()
            spawnedEnemy = self.world.maintain_enemy_count(50)
            if spawnedEnemy:
                await broadcast({
                    "type": "spawn_enemy",
                    "enemy": {"id": enemy_id, "position": spawnedEnemy.position, "stats": spawnedEnemy.stats}
                }, self.connected, self.connections)

            for player_id, player in list(self.connected.items()):
                player.in_combat = False
                for enemy_id, enemy in list(self.world.enemies.items()):
                    if player.is_in_combat(enemy.position):
                        player.in_combat = True
                        if player.attacking == False:
                            player.attacking = True
                            await broadcast({
                                "type": "start_attack",
                                "playerId": player_id,
                                "targetId": enemy_id
                            }, self.connected, self.connections)
                        elif current_time - player.last_attack_time >= 1 / player.stats['attack_speed']:
                            # Update combat log for player
                            await broadcastCombatLog(self.combat_logs, player_id, f"{player_id} attacked {enemy.stats['name']} for {player.stats['damage']} damage.", self.connected, self.connections )
                            player.attacking = False
                            enemy.stats['health'] -= player.stats['damage']
                            player.last_attack_time = current_time
                            await broadcast({
                                "type": "combat_update",
                                "playerId": player_id,
                                "enemyId": enemy_id,
                                "playerHealth": player.stats['health'],
                                "enemyHealth": enemy.stats['health']
                            }, self.connected, self.connections)
                        

                        if enemy.attacking == False:
                            enemy.attacking = True
                            await broadcast({
                                "type": "start_attack",
                                "enemyId": enemy_id,
                                "targetId": player_id
                            }, self.connected, self.connections)
                        elif current_time - enemy.last_attack_time >= 1 / enemy.stats['attack_speed']:
                            # Update combat log for enemy attack
                            await broadcastCombatLog(self.combat_logs, player_id, f"{enemy.stats['name']} attacked {player_id} for {enemy.stats['damage']} damage.", self.connected, self.connections)
                            enemy.attacking = False
                            player.stats['health'] -= enemy.stats['damage']
                            enemy.last_attack_time = current_time
                            await broadcast({
                                "type": "combat_update",
                                "playerId": player_id,
                                "enemyId": enemy_id,
                                "playerHealth": player.stats['health'],
                                "enemyHealth": enemy.stats['health']
                            }, self.connected, self.connections)

                        if player.stats['health'] <= 0:
                            # Handle player death and respawn
                            await broadcastCombatLog(self.combat_logs, player_id, f"{player_id} was killed by {enemy.stats['name']}.", self.connected, self.connections)
                            player.position = {"x": 50, "y": 50}  # Respawn position
                            player.stats['health'] = player.stats['max_health']  # Reset health
                            player.last_attack_time = current_time
                            await broadcast({
                                "type": "player_respawn",
                                "playerId": player_id,
                                "position": player.position,
                                "health": player.stats['health']
                            }, self.connected, self.connections)

                        if enemy.stats['health'] <= 0:
                            await broadcastCombatLog(self.combat_logs, player_id, f"{player_id} killed {enemy.stats['name']}.", self.connected, self.connections)
                            player = self.connected[player_id]
                            player.stats['experience'] += 50  # Award experience points, adjust value as needed
                            del self.world.enemies[enemy_id]
                            await broadcast({
                                "type": "enemy_death",
                                "enemyId": enemy_id,
                                "playerId": player_id,  # Include the player ID who killed the enemy
                                "level": player.stats['level'],
                                "experience": player.stats['experience'],
                                "next_level_exp": player.stats['next_level_exp']
                            }, self.connected, self.connections)
                            
                            # Determine if an item should drop
                            if random.random() < 0.5:  # 50% chance for an item to drop
                                item_id = self.next_item_id
                                self.next_item_id += 1  # Increment the ID for the next item

                                item = generate_random_item(item_id, enemy.position)                                
                                self.world.items_on_ground[item_id] = item
                                await broadcast({
                                    "type": "item_drop",
                                    "itemId": item_id,
                                    "item": {
                                        "id": item.id,
                                        "type": item.type,
                                        "name": item.name,
                                        "position": item.position
                                    }
                                }, self.connected, self.connections)

                            while player.stats['experience'] >= player.stats['next_level_exp']:
                                player.level_up()
                                # save_player_state(player_id, player)
                                # Broadcast level up information    
                                await broadcast({
                                    "type": "level_up",
                                    "playerId": player_id,
                                    "level": player.stats['level'],
                                    "max_health": player.stats['max_health'],
                                    "health": player.stats['health']
                                }, self.connected, self.connections)

            await asyncio.sleep(0.1)  # Sleep to prevent a tight loop

    async def health_regeneration_handler(self):
        last_regeneration_time = asyncio.get_event_loop().time()
        while True:
            current_time = asyncio.get_event_loop().time()
            # Check if at least one second has passed since the last regeneration tick
            if current_time - last_regeneration_time >= 1:
                
                for player_id, player in self.connected.items():  # Ensure this is iterating over Player objects
                    if player.stats['health'] < player.stats['max_health'] and not player.in_combat:
                        print('health regen ' + player_id)
                        player.stats['health'] += 1  # Regenerate 1 health
                        player.stats['health'] = min(player.stats['health'], player.stats['max_health'])  # Cap at max health
                        await broadcast({
                            "type": "health_regeneration",
                            "playerId": player_id,
                            "newHealth": player.stats['health']
                        }, self.connected, self.connections) 
                last_regeneration_time = current_time  # Update the last regeneration time

            # Calculate how much time to sleep until the next second ticks over
            time_to_next_tick = 1 - (current_time - last_regeneration_time)
            await asyncio.sleep(time_to_next_tick if time_to_next_tick > 0 else 0)

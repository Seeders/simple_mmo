# game_manager.py
import asyncio
import random
import aiosqlite
import bcrypt
import json
from game.player import Player
from game.world import World
from game.item import generate_random_item, generate_specific_item, Wood, Stone, Gold, HealthPotion
from utils.broadcast import broadcast, broadcastCombatLog

class GameManager:
    def __init__(self):
        self.connected = {}
        self.connections = {}  # This will store websocket connections keyed by player_id        
        self.player_id_counter = 0
        self.next_item_id = 0
        self.world = World(self)
        self.combat_logs = {}
        self.db_file = 'game.db'

    async def register_user(self, username, password):
        # Check if username already exists
        async with aiosqlite.connect(self.db_file) as db:
            async with db.execute('SELECT username FROM user_credentials WHERE username = ?', (username,)) as cursor:
                if await cursor.fetchone():
                    return False  # Username already exists

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Generate a new player ID
        new_player_id = await self.get_next_player_id()

        # Insert new user credentials into the database
        async with aiosqlite.connect(self.db_file) as db:
            await db.execute(
                'INSERT INTO user_credentials (username, password_hash, player_id) VALUES (?, ?, ?)',
                (username, hashed_password, new_player_id)
            )
            await db.commit()

        # Create and save the new player object
        new_player = Player(self.world, new_player_id)  # removed default_position argument
        self.connected[new_player_id] = new_player
        await self.save_player_state(new_player_id)

        return True  # Registration successful


    async def authenticate_user(self, username, password):
        async with aiosqlite.connect(self.db_file) as db:
            async with db.execute('SELECT password_hash, player_id FROM user_credentials WHERE username = ?', (username,)) as cursor:
                row = await cursor.fetchone()
                if row and bcrypt.checkpw(password.encode('utf-8'), row[0].encode('utf-8')):
                    return row[1]  # Return the player_id
                else:
                    return None

    async def get_next_player_id(self):
        async with aiosqlite.connect(self.db_file) as db:
            async with db.execute('SELECT MAX(player_id) FROM players') as cursor:
                row = await cursor.fetchone()
                max_id = row[0]
                if max_id is not None:
                    # Extract the numeric part and increment it
                    self.player_id_counter = int(max_id.replace('Player', '')) + 1
                else:
                    # Start from 1 if the table is empty
                    self.player_id_counter = 1
                return f"Player{self.player_id_counter}"

    async def save_player_state(self, player_id):
        player = self.connected[player_id]
        try:
            async with aiosqlite.connect(self.db_file) as db:
                serialized_inventory = json.dumps([item.to_dict() for item in player.inventory])
                serialized_stats = json.dumps(player.stats)
                await db.execute(
                    'REPLACE INTO players (player_id, position_x, position_y, stats, inventory) VALUES (?, ?, ?, ?, ?)',
                    (player_id, player.position['x'], player.position['y'], serialized_stats, serialized_inventory)
                )
                await db.commit()
        except Exception as e:
            print(f"Error saving player state: {e}")


    async def load_player_state(self, player_id):
        try:
            async with aiosqlite.connect(self.db_file) as db:
                async with db.execute('SELECT * FROM players WHERE player_id = ?', (player_id,)) as cursor:
                    row = await cursor.fetchone()
                    def item_from_dict(item_dict):
                            item_classes = {
                                "wood": Wood,
                                "stone": Stone,
                                "gold": Gold,
                                "health": HealthPotion
                                # Add other item types here
                            }
                            item_type = item_dict["type"]
                            if item_type in item_classes:
                                return item_classes[item_type](item_dict["id"], item_dict.get("position"))
                            else:
                                raise ValueError(f"Unknown item type: {item_type}")
                    if row:
                        player_data = {
                            'position': {'x': row[1], 'y': row[2]},
                            'stats': json.loads(row[3]),
                            'inventory': [item_from_dict(item) for item in json.loads(row[4])]
                        }
                        return Player(self.world, player_id, player_data['position'], player_data['stats'], player_data['inventory'])
                    else:
                        return None
        except Exception as e:
            print(f"Error loading player state: {e}")
            return None

    async def new_player(self, player_id, websocket):
        # Load existing player state
        existing_player = await self.load_player_state(player_id)
        if existing_player:
            self.connected[player_id] = existing_player
            self.connections[player_id] = websocket
            return existing_player
        else:
            new_player = Player(self.world, player_id, { "x": self.world.towns[0]['center'][0], "y": self.world.towns[0]['center'][1] })
            self.connected[player_id] = new_player
            self.connections[player_id] = websocket
            await self.save_player_state(player_id)  # Save the new player state
            return new_player

    async def disconnect_player(self, player_id):
        if player_id in self.connected:
            await self.save_player_state(player_id)
            del self.connected[player_id]
        else:
            print(f"Player ID {player_id} not found in connected players.")

        if player_id in self.connections:
            del self.connections[player_id]
        else:
            print(f"Player ID {player_id} not found in connections.")

        await broadcast({
            "type": "player_disconnect",
            "id": player_id
        }, self.connected, self.connections)

    async def combat_handler(self):
        while True:
            current_time = asyncio.get_event_loop().time()
            spawnedEnemy = self.world.maintain_enemy_count(50)            
            await self.update_enemy_patrols(current_time)
            if spawnedEnemy:
                await broadcast({
                    "type": "spawn_enemy",
                    "enemy": {"id": spawnedEnemy.id, "position": spawnedEnemy.position, "stats": spawnedEnemy.stats}
                }, self.connected, self.connections)

            for player_id, player in list(self.connected.items()):
                player.in_combat = False
                nearby_enemies = self.world.spacial_grid.get_nearby_entities(player.position, 2, 1)
                for enemy in nearby_enemies:                
                    if player.is_in_combat(enemy.position):
                        player.in_combat = True
                        enemy.in_combat = True
                        if player.attacking == False:
                            player.attacking = True
                            await broadcast({
                                "type": "start_attack",
                                "playerId": player_id,
                                "targetPosition": enemy.position
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
                                "enemyId": enemy.id,
                                "playerHealth": player.stats['health'],
                                "enemyHealth": enemy.stats['health']
                            }, self.connected, self.connections)
                        

                        if enemy.attacking == False:
                            enemy.attacking = True
                            await broadcast({
                                "type": "start_attack",
                                "enemyId": enemy.id,
                                "targetPosition": player.position
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
                                "enemyId": enemy.id,
                                "playerHealth": player.stats['health'],
                                "enemyHealth": enemy.stats['health']
                            }, self.connected, self.connections)

                        if player.stats['health'] <= 0:
                            # Handle player death and respawn
                            await broadcastCombatLog(self.combat_logs, player_id, f"{player_id} was killed by {enemy.stats['name']}.", self.connected, self.connections)
                            player.stats['health'] = player.stats['max_health']  # Reset health
                            player.last_attack_time = current_time
                            self.world.spacial_grid.move_entity(player, {"x": self.world.towns[0]['center'][0], "y": self.world.towns[0]['center'][1]} )
                            enemy.exit_combat()
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
                            self.world.spacial_grid.remove_entity(enemy)
                            del self.world.enemies[enemy.id]
                            await broadcast({
                                "type": "enemy_death",
                                "enemyId": enemy.id,
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
                                        "item_type": item.item_type,
                                        "name": item.name,
                                        "position": item.position
                                    }
                                }, self.connected, self.connections)

                            if player.stats['experience'] >= player.stats['next_level_exp']:
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
                    elif enemy.in_combat:
                        enemy.exit_combat()

            await asyncio.sleep(0.1)  # Sleep to prevent a tight loop

    async def health_regeneration_handler(self):
        last_regeneration_time = asyncio.get_event_loop().time()
        while True:
            current_time = asyncio.get_event_loop().time()
            # Check if at least one second has passed since the last regeneration tick
            if current_time - last_regeneration_time >= 1:
                
                for player_id, player in self.connected.items():  # Ensure this is iterating over Player objects
                    if player.stats['health'] < player.stats['max_health'] and not player.in_combat:
                        player.stats['health'] += player.stats['max_health'] * .01  # Regenerate 1% health
                        player.stats['health'] = min(player.stats['health'], player.stats['max_health'])  # Cap at max health
                        await broadcast({
                            "type": "health_regeneration",
                            "playerId": player_id,
                            "newHealth": int(player.stats['health'])
                        }, self.connected, self.connections) 
                last_regeneration_time = current_time  # Update the last regeneration time

            # Calculate how much time to sleep until the next second ticks over
            time_to_next_tick = 1 - (current_time - last_regeneration_time)
            await asyncio.sleep(time_to_next_tick if time_to_next_tick > 0 else 0)

    async def update_enemy_patrols(self, current_time):
        for enemy_id, enemy in self.world.enemies.items():
            enemy.update(current_time)
            # Broadcast enemy movement to all connected players
            await broadcast({
                "type": "enemy_move",
                "enemyId": enemy.id,
                "position": enemy.position
            }, self.connected, self.connections)
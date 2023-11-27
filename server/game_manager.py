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
            new_player = Player(self.world, player_id, self.world.towns[0].position )
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





    async def attack_routine(self, current_time, attacker, defender):
        """
        Handles the attack routine between two units.
        """
        if not attacker.attacker.is_in_range_to_attack(defender.position):
            if attacker.attacker.in_combat:
                attacker.attacker.exit_combat()
            return

        attacker.attacker.in_combat = True
        if defender.attacker:
            defender.attacker.in_combat = True

        if not attacker.attacker.attacking:
            attacker.attacker.attacking = True
            await self.start_attack(attacker, defender)
        elif current_time - attacker.attacker.last_attack_time >= 1 / attacker.attacker.stats['attack_speed']:
            await self.execute_attack(attacker, defender, current_time)



    async def start_attack(self, attacker, defender):
        """
        Broadcasts the start of an attack.
        """
        await broadcast({
            "type": "start_attack",
            "unitId": attacker.id,
            "unitType": attacker.unit_type,
            "targetPosition": defender.position
        }, self.connected, self.connections)

    async def execute_attack(self, attacker, defender, current_time):
        """
        Executes an attack and broadcasts the result.
        """
        if attacker.unit_type == "player" or defender.unit_type == "player": 
            player_id = attacker.id 
            await broadcastCombatLog(self.combat_logs, player_id, f"{attacker.name} attacked {defender.name} for {attacker.attacker.stats['damage']} damage.", self.connected, self.connections)
        attacker.attacking = False
        damage = attacker.attacker.stats['damage'] - defender.stats['defense']
        if damage <= 0: 
            damage = 1
        defender.stats['health'] -= damage
        attacker.attacker.last_attack_time = current_time                
        await self.broadcast_combat_update(attacker, defender)
        if defender.stats['health'] <= 0:
            await self.handle_defender_death(attacker, defender)

    async def broadcast_combat_update(self, attacker, defender):
        """
        Broadcasts an update to the combat situation.
        """
        await broadcast({
            "type": "combat_update",
            "unitId": attacker.id,
            "targetId": defender.id,
            "unitType": attacker.unit_type,
            "unitFaction": attacker.faction,
            "targetFaction": defender.faction,
            "targetType": defender.unit_type,
            "unitHealth": attacker.stats['health'],
            "targetHealth": defender.stats['health']
        }, self.connected, self.connections)

    async def combat_handler(self):
        """
        Main combat handler loop.
        """
        while True:
            current_time = asyncio.get_event_loop().time()
            spawnedEnemy = self.world.maintain_enemy_count(1)
            await self.update_enemy_patrols(current_time)
            if spawnedEnemy:
                await self.broadcast_enemy_spawn(spawnedEnemy)

            await self.process_town_attacks(current_time)
            await self.process_player_attacks(current_time)
            await self.process_enemy_attacks(current_time)

            await asyncio.sleep(0.1)  # Sleep to prevent a tight loop


    async def handle_player_death(self, player, attacker):
        await broadcastCombatLog(self.combat_logs, player.id, f"{player.name} was killed by {attacker.name}.", self.connected, self.connections)
        self.world.spacial_grid.move_entity(player, self.world.towns[0].position )
        player.stats['health'] = player.stats['max_health']  # Reset health
        await broadcast({
            "type": "player_respawn",
            "playerId": player.id,
            "position": player.position,
            "health": player.stats['health']
        }, self.connected, self.connections)


    async def handle_defender_death(self, attacker, defender):
        attacker.attacker.exit_combat()
        # Check if the defender is a player, enemy, or structure and handle accordingly
        if defender.unit_type == "player":
            # Handle player death (e.g., respawn logic)
            await self.handle_player_death(defender, attacker)

        elif defender.unit_type == "unit":
            # Remove the enemy from the game world
            del self.world.enemies[defender.id]

            self.world.spacial_grid.remove_entity(defender)
            # Award experience to the player if the attacker is a player
            if attacker.unit_type == "player":
                attacker.stats['experience'] += self.calculate_experience_reward(defender)
                attacker.check_exp()
                # Determine if an item should drop
                if defender.unit_type == "unit" and random.random() < .5:
                    await self.handle_item_drop(defender)

        elif defender.unit_type == "structure":
            # Remove the structure from the game world
            del self.world.towns[defender.faction].layout[defender.id]

        # Broadcast the death of the defender
        await self.broadcast_defender_death(attacker, defender)

    async def handle_item_drop(self, defender):
        # Logic to handle item drops
        item_id = self.next_item_id
        self.next_item_id += 1
        item = generate_random_item(item_id, defender.position)
        self.world.items_on_ground[item_id] = item
        await self.broadcast_item_drop(item)

    def calculate_experience_reward(self, defender):
        # Logic to calculate experience reward based on the defender's attributes
        return 50  # Placeholder value, adjust as needed

    async def broadcast_defender_death(self, attacker, defender):
        # Logic to broadcast the death of a defender
        message = {
            "type": "target_death",
            "unitId": attacker.id,
            "targetId": defender.id,
            "unitType": attacker.unit_type,
            "targetType": defender.unit_type,
            "unitFaction": attacker.faction,
            "targetFaction": defender.faction
        }
        if attacker.unit_type == "player":
            message["level"] = attacker.stats["level"]
            message["experience"] = attacker.stats["experience"]
            message["next_level_exp"] = attacker.stats["next_level_exp"]
        await broadcast(message, self.connected, self.connections)

    async def broadcast_item_drop(self, item):
        # Logic to broadcast item drop
        await broadcast({
            "type": "item_drop",
            "itemId": item.id,
            "item": item.to_dict()  # Assuming item has a method to convert to dict
        }, self.connected, self.connections)

    async def broadcast_enemy_spawn(self, enemy):
        await broadcast({
            "type": "spawn_enemy",
            "enemy": {"id": enemy.id, "position": enemy.position, "stats": enemy.stats}
        }, self.connected, self.connections)

    async def process_town_attacks(self, current_time):
        for town_index, town in enumerate(self.world.towns):
            faction = town_index
            for building_id, building in town.layout.items():
                if building.attacker:
                    # Get nearby targets within attack range
                    nearby_targets = self.world.spacial_grid.get_nearby_entities(building.position, building.attacker.stats["attack_range"], faction)
                    
                    # Select a target and initiate an attack routine
                    for target in nearby_targets:
                        if self.is_valid_target(building, target):
                            await self.attack_routine(current_time, building, target)
                            break  # Attack the first valid target and then break



    async def process_player_attacks(self, current_time):
        for player_id, player in self.connected.items():
            if player.attacker:
                # Get nearby targets within attack range
                nearby_targets = self.world.spacial_grid.get_nearby_entities(player.position, player.attacker.stats["attack_range"], 0)  # Assuming 0 is the player faction
                
                # Select a target and initiate an attack routine
                for target in nearby_targets:
                    if self.is_valid_target(player, target):
                        await self.attack_routine(current_time, player, target)
                        break  # Attack the first valid target and then break

    async def process_enemy_attacks(self, current_time):
        enemy_ids = list(self.world.enemies.keys())  # Create a list of enemy IDs
        for enemy_id in enemy_ids:
            enemy = self.world.enemies.get(enemy_id)  # Get the enemy by ID
            if enemy and enemy.attacker:
                # Get nearby targets within attack range
                nearby_targets = self.world.spacial_grid.get_nearby_entities(enemy.position, enemy.attacker.stats["attack_range"], 1)  # Assuming 1 is the enemy faction

                # Select a target and initiate an attack routine
                for target in nearby_targets:
                    if self.is_valid_target(enemy, target):
                        await self.attack_routine(current_time, enemy, target)
                        break  # Attack the first valid target and then break



    def is_valid_target(self, attacker, target):
        # Implement logic to determine if the target is valid (e.g., enemy, within range)
        return target.stats['health'] > 0 and target.faction != attacker.faction


    async def health_regeneration_handler(self):
        last_regeneration_time = asyncio.get_event_loop().time()
        while True:
            current_time = asyncio.get_event_loop().time()
            # Check if at least one second has passed since the last regeneration tick
            if current_time - last_regeneration_time >= 1:
                
                for player_id, player in self.connected.items():  # Ensure this is iterating over Player objects
                    if player.stats['health'] < player.stats['max_health'] and not player.attacker.in_combat:
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
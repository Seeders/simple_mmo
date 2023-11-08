import asyncio
import websockets
import json
import random
import copy
from noise import pnoise2

BASE_HEALTH = 100
HEALTH_INCREMENT = 20  # Additional health per level

connected = {}
player_id_counter = 0
next_item_id = 0
enemies = {}  # Dictionary to store enemies
items_on_ground = {}  # Dictionary to store items on the ground
combat_logs = {} 

def generate_item():
    global next_item_id  # Reference the global variable
    item_id = next_item_id
    next_item_id += 1  # Increment the ID for the next item
    # You can expand this function to generate different types of items
    return {
        "id": item_id,
        "type": "health_potion",  # Example item type
        "position": None  # To be set when the item is dropped
    }
def generate_terrain(width, height, scale=0.1):
    terrain = []
    for y in range(height):
        row = []
        for x in range(width):
            noise_value = pnoise2(x * scale, y * scale)
            if noise_value < -0.05:
                tile = 'water'
            elif -0.05 <= noise_value < 0.2:
                tile = 'sand'
            elif 0.2 <= noise_value < 0.4:
                tile = 'grass'
            elif 0.4 <= noise_value < 0.6:
                tile = 'forest'
            else:
                tile = 'mountains'
            row.append(tile)
        terrain.append(row)
    return terrain

_terrain = generate_terrain(100, 100)

def calculate_next_level_exp(level):
    # This is a simple formula, you might want to create a more complex one
    return 100 * (level ** 2)
    
def save_player_state(player_id, player_data):
    filename = f"save_{player_id}.json"
    # Ensure player_data is a dictionary and does not contain non-serializable objects
    serializable_data = {k: v for k, v in player_data.items() if isinstance(v, (dict, list, str, int, float, bool, type(None)))}
    with open(filename, 'w') as file:
        json.dump(serializable_data, file)

        
def load_player_state(player_id):
    filename = f"save_{player_id}.json"
    try:
        with open(filename, 'r') as file:
            data = file.read()
            if data:  # Check if the file is not empty
                player_data = json.loads(data)
                return player_data
            else:
                return None  # Handle the empty file case
    except FileNotFoundError:
        return None  # Handle the file not found case
    except json.JSONDecodeError:
        # Handle the case where the JSON data is malformed
        return None

        
def generate_player_stats():
    return {
        "level": 1,
        "health": BASE_HEALTH,
        "max_health": BASE_HEALTH,  # Add a max health attribute
        "damage": 10,
        "experience": 0,
        "next_level_exp": 100,
        "type": "player",
        "attack_speed": 1,  # Attacks every 1 seconds
        "move_speed": 3,
        "abilities": [],
        "damage": 15,
        "defense": 10
    }

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
def get_enemy_stats(enemy_type):
    if enemy_type in enemy_types:
        eType = enemy_types[enemy_type]
        eType["level"] = 1
        eType["max_health"] = eType["health"]
        return eType
    else:
        raise ValueError(f"Unknown enemy type: {enemy_type}")
        
def spawn_enemies(num_enemies, world_width, world_height):
    for i in range(num_enemies):
        enemy_id = f"Enemy{i}"
        enemy_position = {
            "x": random.randint(0, world_width - 1),
            "y": random.randint(0, world_height - 1)
        }
        # Select a random enemy type
        random_enemy_type = random.choice(list(enemy_types.keys()))
        enemies[enemy_id] = {
            "id": enemy_id,
            "position": enemy_position,
            # Use copy.deepcopy to create a new instance of the stats for each enemy
            "stats": copy.deepcopy(get_enemy_stats(random_enemy_type)),
            "last_attack_time": asyncio.get_event_loop().time()
        }

spawn_enemies(25, 100, 100)  # Spawn 25 enemies in a 100x100 world

def is_in_combat(player_position, enemy_position):
    dx = abs(player_position['x'] - enemy_position['x'])
    dy = abs(player_position['y'] - enemy_position['y'])
    return dx <= 1 and dy <= 1

async def broadcastCombatLog(player_id, message, sender_websocket=None):
    combat_log_entry = message
    combat_logs.setdefault(player_id, []).append(combat_log_entry)
    await broadcast({
        "type": "combat_log_update",
        "playerId": player_id,
        "combatLog": combat_logs[player_id][-10:]  # Send the last 10 entries
    }, sender_websocket)
    
async def broadcast(message, sender_websocket=None):

    # Convert the message to a JSON string
    message_json = json.dumps(message)

    # Send the message to all connected clients except the sender
    awaitables = []
    for player_id, player in connected.items():
        if player["websocket"] is not sender_websocket:
            awaitables.append(player["websocket"].send(message_json))

    # Use asyncio.gather to send all messages concurrently
    await asyncio.gather(*awaitables)


async def combat_handler():
    while True:
        current_time = asyncio.get_event_loop().time()
        for player_id, player in list(connected.items()):
            player['in_combat'] = False
            for enemy_id, enemy in list(enemies.items()):
                if is_in_combat(player['position'], enemy['position']):
                    player['in_combat'] = True
                    if current_time - player['last_attack_time'] >= 1 / player['stats']['attack_speed']:
                        # Update combat log for player
                        await broadcastCombatLog(player_id, f"{player_id} attacked {enemy['stats']['name']} for {player['stats']['damage']} damage.")

                        enemy['stats']['health'] -= player['stats']['damage']
                        player['last_attack_time'] = current_time
                        await broadcast({
                            "type": "combat_update",
                            "playerId": player_id,
                            "enemyId": enemy_id,
                            "playerHealth": player['stats']['health'],
                            "enemyHealth": enemy['stats']['health']
                        })

                    if current_time - enemy['last_attack_time'] >= 1 / enemy['stats']['attack_speed']:
                        # Update combat log for enemy attack
                        await broadcastCombatLog(player_id, f"{enemy['stats']['name']} attacked {player_id} for {enemy['stats']['damage']} damage.")

                        player['stats']['health'] -= enemy['stats']['damage']
                        enemy['last_attack_time'] = current_time
                        await broadcast({
                            "type": "combat_update",
                            "playerId": player_id,
                            "enemyId": enemy_id,
                            "playerHealth": player['stats']['health'],
                            "enemyHealth": enemy['stats']['health']
                        })

                    if player['stats']['health'] <= 0:
                        # Handle player death and respawn
                        await broadcastCombatLog(player_id, f"{player_id} was killed by {enemy['stats']['name']}.")
                        player['position'] = {"x": 50, "y": 50}  # Respawn position
                        player['stats']['health'] = player['stats']['max_health']  # Reset health
                        player['last_attack_time'] = current_time
                        await broadcast({
                            "type": "player_respawn",
                            "playerId": player_id,
                            "position": player['position'],
                            "health": player['stats']['health']
                        })

                    if enemy['stats']['health'] <= 0:
                        await broadcastCombatLog(player_id, f"{player_id} killed {enemy['stats']['name']}.")
                        player = connected[player_id]
                        player['stats']['experience'] += 50  # Award experience points, adjust value as needed
                        del enemies[enemy_id]
                        await broadcast({
                            "type": "enemy_death",
                            "enemyId": enemy_id,
                            "playerId": player_id,  # Include the player ID who killed the enemy
                            "level": player['stats']['level'],
                            "experience": player['stats']['experience'],
                            "next_level_exp": player['stats']['next_level_exp']
                        })
                        
                        # Determine if an item should drop
                        if random.random() < 0.5:  # 50% chance for an item to drop
                            global next_item_id  # Reference the global variable
                            item_id = next_item_id
                            next_item_id += 1  # Increment the ID for the next item

                            item = generate_item()
                            item['position'] = enemy['position']
                            items_on_ground[item_id] = item
                            await broadcast({
                                "type": "item_drop",
                                "itemId": item_id,
                                "item": item
                            })

                        while player['stats']['experience'] >= player['stats']['next_level_exp']:
                            player['stats']['level'] += 1
                            player['stats']['experience'] = 0
                            player['stats']['next_level_exp'] = calculate_next_level_exp(player['stats']['level'])
                            
                            # Increase health with level
                            player['stats']['max_health'] += HEALTH_INCREMENT
                            player['stats']['health'] = player['stats']['max_health']  # Heal the player to full health on level up
                            save_player_state(player_id, player)
                            # Broadcast level up information    
                            await broadcast({
                                "type": "level_up",
                                "playerId": player_id,
                                "level": player['stats']['level'],
                                "max_health": player['stats']['max_health'],
                                "health": player['stats']['health']
                            })

        await asyncio.sleep(0.1)  # Sleep to prevent a tight loop


async def game_server(websocket, path):
    global connected, player_id_counter
    player_id = f"Player{player_id_counter}"
    player_id_counter += 1
    player_color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
    player_position = {"x": 50, "y": 50}
    player_data = load_player_state(player_id)
    player_stats = {}
    if player_data:
        player_stats = player_data["stats"]
    else:
        player_stats = generate_player_stats()
        
    connected[player_id] = {
        "websocket": websocket,
        "color": player_color,
        "position": player_position,
        "in_combat": False,
        "stats": player_stats,
        "inventory": [],  
        "last_attack_time": asyncio.get_event_loop().time()
    }

    try:
        await websocket.send(json.dumps({
            "type": "init",
            "id": player_id,
            "color": player_color,
            "terrain": _terrain,
            "players": [{"id": pid, "color": p["color"], "position": p["position"], "stats": p["stats"]} for pid, p in connected.items()],
            "chat": [],
            "enemies": [{"id": enemy_id, "position": e["position"], "stats": e["stats"]} for enemy_id, e in enemies.items()]
        }))

        await broadcast({
            "type": "new_player",
            "id": player_id,
            "color": player_color,
            "position": player_position,
            "stats": player_stats
        }, websocket)
    
        async for message in websocket:
            data = json.loads(message)
            if data["type"] == "move":
                connected[player_id]["position"] = data["position"]
                await broadcast({
                    "type": "player_move",
                    "id": player_id,
                    "position": data["position"]
                }, websocket)
            elif data["type"] == "chat":
           
                await broadcast({
                    "type": "chat",
                    "sender": player_id,
                    "message": data["message"]
                }, websocket)
            elif data["type"] == "pickup":
                player = connected[data["playerId"]]
                player_position = player["position"]
                for item_id, item in list(items_on_ground.items()):
                    if item["position"] == player_position:
                        player["inventory"].append(item)
                        del items_on_ground[item_id]
                        await broadcast({
                            "type": "item_pickup",
                            "playerId": data["playerId"],
                            "itemId": item_id
                        })
                        break  # Assuming only one item can be picked up at a time
            elif data["type"] == "item_used":
                player_id = data["playerId"]
                item_id = data["itemId"]
                player = connected[player_id]

                # Find the index of the item with the matching 'id'
                item_index = next((index for (index, d) in enumerate(player["inventory"]) if d["id"] == item_id), None)

                if item_index is not None:
                    item = player["inventory"][item_index]
                    if item["type"] == "health_potion":
                        player["stats"]["health"] += 50
                        player["stats"]["health"] = min(player["stats"]["health"], player["stats"]["max_health"])
                        del player["inventory"][item_index]  # Remove the potion from inventory using the index
                        await broadcast({
                            "type": "potion_used",
                            "playerId": player_id,
                            "potionId": item_id,
                            "newHealth": player["stats"]["health"]
                        })
    except websockets.exceptions.ConnectionClosedError:
        pass  # Handle disconnection
    finally:
        del connected[player_id]
        await websocket.close()
        await broadcast({
            "type": "player_disconnect",
            "id": player_id
        })
        
async def health_regeneration_handler():
    last_regeneration_time = asyncio.get_event_loop().time()
    while True:
        current_time = asyncio.get_event_loop().time()
        # Check if at least one second has passed since the last regeneration tick
        if current_time - last_regeneration_time >= 1:
            for player_id, player in connected.items():
                if player['stats']['health'] < player['stats']['max_health'] and not player['in_combat']:
                    player['stats']['health'] += 1  # Regenerate 1 health
                    player['stats']['health'] = min(player['stats']['health'], player['stats']['max_health'])  # Cap at max health
                    await broadcast({
                        "type": "health_regeneration",
                        "playerId": player_id,
                        "newHealth": player['stats']['health']
                    })
            last_regeneration_time = current_time  # Update the last regeneration time

        # Calculate how much time to sleep until the next second ticks over
        time_to_next_tick = 1 - (current_time - last_regeneration_time)
        await asyncio.sleep(time_to_next_tick if time_to_next_tick > 0 else 0)

# Example of picking up an item
async def handle_pickup(player, item_id):
    if item_id in items_on_ground and items_on_ground[item_id]['position'] == player.position:
        player.inventory.append(item_id)
        del items_on_ground[item_id]
        await broadcast({
            "type": "item_pickup",
            "playerId": player.id,
            "itemId": item_id
        })

        
start_server = websockets.serve(game_server, "localhost", 6789)

async def main():
    # Start the combat handler task
    asyncio.create_task(combat_handler())
    asyncio.create_task(health_regeneration_handler())
    # Start the WebSocket server
    async with websockets.serve(game_server, "localhost", 6789):
        await asyncio.Future()  # This will run forever

if __name__ == "__main__":
    asyncio.run(main())


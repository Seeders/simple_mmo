# server.py

import asyncio
import websockets
import json
import re
import time
from game.config.overworld_config import overworld_size
from utils.broadcast import broadcast
from game_manager import GameManager
from game.config.tech_tree import tech_tree

def sanitize_chat_message(message):
    # Remove potentially dangerous characters
    message = re.sub(r'[<>]', '', message)
    # Limit message length
    return message[:200]

# Dictionary to store the count of requests per IP address
request_counts = {}

def is_rate_limited(ip_address):
    current_time = time.time()
    window_size = 60  # 60 seconds
    request_limit = 1000  # 100 requests per minute

    if ip_address not in request_counts:
        request_counts[ip_address] = []

    # Remove old requests
    request_counts[ip_address] = [t for t in request_counts[ip_address] if current_time - t < window_size]

    # Check if rate limit exceeded
    if len(request_counts[ip_address]) >= request_limit:
        return True

    # Log current request
    request_counts[ip_address].append(current_time)
    return False

async def game_server(websocket, path, game_manager:GameManager):
    player = None  
    try:
        # Main message handling loop
        async for message in websocket:

            ip_address = websocket.remote_address[0]
            if is_rate_limited(ip_address):
                print(f"Rate limit exceeded for {ip_address}")
                return  # Close connection or send error message
            data = json.loads(message)
            player_id = data.get("playerId")
            player_world = game_manager.overworld_manager.get_world_of_player(player_id)

            # Handle different message types with appropriate game_manager methods
            if data["type"] == "move":
                if game_manager.connected[player_id].move(data["destination"]):       
                    await broadcast({
                        "type": "player_move",
                        "id": player_id,
                        "destination": data["destination"],
                    }, game_manager.connected, game_manager.connections)       
            elif data["type"] == "chat":                
                # Sanitize chat message
                sanitized_message = sanitize_chat_message(data["message"])
                # Broadcast sanitized message
                await broadcast({
                    "type": "chat",
                    "sender": data["playerId"],
                    "message": sanitized_message
                }, game_manager.connected, game_manager.connections, websocket)
            elif data["type"] == "pickup":
                if not player_world:
                    continue
                player = game_manager.connected[player_id]
                player_position = player.position
                for item_id, item in list(player_world.items_on_ground.items()):
                    if item.position == player_position:
                        player.inventory.append(item)
                        del player_world.items_on_ground[item_id]
                        await broadcast({
                            "type": "item_pickup",
                            "playerId": player_id,
                            "itemId": item_id
                        }, game_manager.connected, game_manager.connections )
                        break  # Assuming only one item can be picked up at a time
            elif data["type"] == "item_used":
                
                item_id = data["itemId"]        
                # Find the index of the item with the matching 'id'
                item_index = next((index for (index, d) in enumerate(player.inventory) if d.id == item_id), None)
                if item_index is not None:
                    item = player.inventory[item_index]
                    item.use(game_manager, player, item_index)          
            elif data["type"] == "item_built":
                if not player_world:
                    continue
                item = data["item"]  
                position = data["position"]        
                # Find the index of the item with the matching 'id'
                player_world.build_structure(data)                                
            elif data["type"] == "login":
                username = data["username"]
                password = data["password"]
                player_id = await game_manager.authenticate_user(username, password)
                if player_id:
                    player = await game_manager.new_player(player_id, websocket)
                    await websocket.send(json.dumps({
                        "type": "login_response",
                        "success": True,
                        "player_id": player_id
                    }))

                    towns = []
                    for town in player.world.town_manager.towns:           
                        towns.append(town.to_dict())

                    # Send initial game state to the connected player
                    await websocket.send(json.dumps({
                        "type": "init",
                        "id": player.id,                        
                        "tech_tree": tech_tree(),
                        "world_position": player.world.overworld_position,
                        "overworld_map": game_manager.overworld_manager.map,
                        "terrain": player.world.terrain_manager.terrain.terrain,
                        "trees": player.world.tree_manager.trees,
                        "stones": player.world.stone_manager.stones,
                        "ramps": player.world.terrain_manager.ramps,
                        "towns": towns,
                        "roads": [[{"x": point[0], "y": point[1]} for point in road] for road in player.world.road_manager.roads],  # Adjusted for new road structure
                        "players": [{"id": pid, "position": {"x": player.position['x'], "y": player.position['y']}, "stats": p.stats, "inventory": [item.to_dict() for item in p.inventory]} for pid, p in game_manager.connected.items()],
                        "chat": [],
                        "npcs": [{"id": npc_id, "position": e.position, "stats": e.stats} for npc_id, e in player.world.npc_manager.npcs.items()]
                    }))
                    
                    # Notify other players of the new player
                    await broadcast({
                        "type": "new_player",
                        "id": player.id,
                        "position": player.position,
                        "stats": player.stats
                    }, game_manager.connected, game_manager.connections, websocket)

                else:
                    await websocket.send(json.dumps({
                        "type": "login_response",
                        "success": False,
                        "message": "Invalid username or password"
                    }))

            elif data["type"] == "register":
                username = data["username"]
                password = data["password"]
                registration_success = await game_manager.register_user(username, password)
                if registration_success:
                    await websocket.send(json.dumps({
                        "type": "register_response",
                        "success": True
                    }))
                else:
                    await websocket.send(json.dumps({
                        "type": "register_response",
                        "success": False,
                        "message": "Username already taken"
                    }))
                # Add logic to create new user account

    except websockets.exceptions.ConnectionClosedError:
        pass  # Handle disconnection
    finally:
        if player is not None:  # Check if player is not None before trying to use it
            await game_manager.disconnect_player(player.id)

async def main():
    game_manager = GameManager()
    asyncio.create_task(game_manager.combat_handler())
    asyncio.create_task(game_manager.health_regeneration_handler())
    async with websockets.serve(lambda ws, path: game_server(ws, path, game_manager), "0.0.0.0", 6789):
        await asyncio.Future()  # This will run forever

if __name__ == "__main__":
    asyncio.run(main())

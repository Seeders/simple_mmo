# server.py

import asyncio
import websockets
import json
from utils.broadcast import broadcast
from game_manager import GameManager

async def game_server(websocket, path, game_manager:GameManager):
    player = await game_manager.new_player(websocket)

    try:
        # Send initial game state to the connected player
        await websocket.send(json.dumps({
            "type": "init",
            "id": player.id,
            "color": player.color,
            "terrain": game_manager.world.terrain.terrain,
            "players": [{"id": pid, "color": p.color, "position": p.position, "stats": p.stats} for pid, p in game_manager.connected.items()],
            "chat": [],
            "enemies": [{"id": enemy_id, "position": e.position, "stats": e.stats} for enemy_id, e in game_manager.world.enemies.items()]
        }))

        # Notify other players of the new player
        await broadcast({
            "type": "new_player",
            "id": player.id,
            "color": player.color,
            "position": player.position,
            "stats": player.stats
        }, game_manager.connected, game_manager.connections, websocket)

        # Main message handling loop
        async for message in websocket:
            data = json.loads(message)
            player_id = data["playerId"]
            # Handle different message types with appropriate game_manager methods
            if data["type"] == "move":
                game_manager.connected[player_id].move(data["position"])         
                await broadcast({
                    "type": "player_move",
                    "id": player_id,
                    "position": data["position"]
                }, game_manager.connected, game_manager.connections, websocket)       
            elif data["type"] == "chat":                
                await broadcast({
                    "type": "chat",
                    "sender": player_id,
                    "message": data["message"]
                }, game_manager.connected, game_manager.connections, websocket)
            elif data["type"] == "pickup":
                player = game_manager.connected[player_id]
                player_position = player.position
                for item_id, item in list(game_manager.world.items_on_ground.items()):
                    if item.position == player_position:
                        player.inventory.append(item)
                        del game_manager.world.items_on_ground[item_id]
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
                    if item.type == "health_potion":
                        player.stats['health'] += 50
                        player.stats['health'] = min(player.stats['health'], player.stats['max_health'])
                        del player.inventory[item_index]  # Remove the potion from inventory using the index
                        await broadcast({
                            "type": "potion_used",
                            "playerId": player_id,
                            "potionId": item_id,
                            "newHealth": player.stats['health']
                        }, game_manager.connected, game_manager.connections)

    except websockets.exceptions.ConnectionClosedError:
        pass  # Handle disconnection
    finally:
        await game_manager.disconnect_player(player.id)

async def main():
    game_manager = GameManager()
    asyncio.create_task(game_manager.combat_handler())
    asyncio.create_task(game_manager.health_regeneration_handler())
    async with websockets.serve(lambda ws, path: game_server(ws, path, game_manager), "localhost", 6789):
        await asyncio.Future()  # This will run forever

if __name__ == "__main__":
    asyncio.run(main())

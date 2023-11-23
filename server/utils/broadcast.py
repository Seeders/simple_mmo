import asyncio
import json
import websockets
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

async def broadcast(message, connected, websockets_map, sender_websocket=None):
    # Convert the message to a JSON string
    message_json = json.dumps(message)
    
    # if message["type"] != "enemy_move" and message["type"] != "health_regeneration" and message["type"] != "player_move":
    #     print(message["type"])
    # if message["type"] == "item_drop":
    #     print("item_drop")
    # Send the message to all connected clients except the sender
    awaitables = []
    for player_id, player in connected.items():
        player_websocket = websockets_map.get(player_id)  # Get the websocket from the map using player_id
        if player_websocket and player_websocket is not sender_websocket:
            # Wrap the send operation in a try-except block
            async def safe_send(ws):
                try:
                    await ws.send(message_json)
                except (ConnectionClosedOK, ConnectionClosedError) as e:
                    pass
                    # Handle the closed connection, e.g., by logging or removing from the connected list
                    # print(f"Connection closed for player {player_id}: {e}")
                    # You might want to remove the disconnected player from the maps
                    # Be cautious about modifying the map while iterating over it
                    # It might be better to mark them for removal and delete them after the loop

            awaitables.append(safe_send(player_websocket))

    # Use asyncio.gather to send all messages concurrently
    await asyncio.gather(*awaitables)


async def broadcastCombatLog(combat_logs, player_id, message, connected, websockets_map, sender_websocket=None):
    combat_log_entry = message
    combat_logs.setdefault(player_id, []).append(combat_log_entry)
    await broadcast({
        "type": "combat_log_update",
        "playerId": player_id,
        "combatLog": combat_logs[player_id][-10:]  # Send the last 10 entries
    }, connected, websockets_map, sender_websocket)
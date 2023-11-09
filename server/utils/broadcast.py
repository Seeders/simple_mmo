import asyncio
import json
import websockets

async def broadcast(message, connected, websockets_map, sender_websocket=None):
    # Convert the message to a JSON string
    message_json = json.dumps(message)

    # Send the message to all connected clients except the sender
    awaitables = []
    for player_id, player in connected.items():
        player_websocket = websockets_map.get(player_id)  # Get the websocket from the map using player_id
        if player_websocket and player_websocket is not sender_websocket:
            awaitables.append(player_websocket.send(message_json))

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
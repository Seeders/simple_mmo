import { CONFIG } from "./Config/config";
// Network.js
export default class NetworkManager {
    constructor(serverUrl, gameState, connectedCallback) {
        this.gameState = gameState;
        this.socket = null;    
        this.connect(serverUrl, connectedCallback);    
    }

    // Connect to the WebSocket server
    connect(serverUrl, connectedCallback) {
        this.socket = new WebSocket(serverUrl);

        // Connection opened
        this.socket.addEventListener('open', (event) => {
            console.log('Connected to the WebSocket server.');
            connectedCallback();
            // Send an initial message or perform a handshake if necessary
        });

        // Listen for messages
        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        });

        // Handle WebSocket errors
        this.socket.addEventListener('error', (event) => {
            console.error('WebSocket error:', event);
        });

        // Handle WebSocket closure
        this.socket.addEventListener('close', (event) => {
            console.log('Disconnected from the WebSocket server.');
            // Handle reconnection logic if necessary
        });
    }

    // Send a message to the server
    send(type, payload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, ...payload });
            this.socket.send(message);
        } else {
            console.error('WebSocket is not connected.');
        }
    }
    register(username, password) {
        const payload = { username, password };
        this.send('register', payload);
      }
    login(username, password) {
        const payload = { username, password };
        this.send('login', payload);
    }

    // Handle incoming messages
    handleMessage(data) {
        let player;
        switch(data.type) {
            case "init":                
                this.gameState.init(data); 
                break;
            case "new_player":
                this.gameState.playerManager.addPlayer({ id: data.id, position: data.position, stats: data.stats});
                break;
            case "player_move":
                player = this.gameState.playerManager.getPlayer(data.id);
                if( player ) {
                    this.gameState.offsetX -= data.move.x * CONFIG.tileSize;
                    this.gameState.offsetY -= data.move.y * CONFIG.tileSize;
                    if(data.id == this.gameState.currentPlayerId){
                        this.gameState.playerMoved = true;
                    }
                    player.position = data.position;
                    player.isOnRoad = this.gameState.isPlayerOnRoad(player.id);
                }
                break;
            case "player_disconnect":
                this.gameState.removePlayer(data.id);
                break;
            case "chat":
                this.gameState.receiveChat(data);
                break;
            case "player_respawn":
                this.gameState.playerRespawn(data);
                break;
            case "spawn_npc":
                this.gameState.npcManager.addNPC({id: data.npc.id, position: data.npc.position, stats: data.npc.stats});
                break;
            case "combat_update":
                this.gameState.combatUpdate(data);
                break;
            case "start_attack":
                let id, unit, targetPosition;
                if( data.unit_type == "player" ) {
                    id = data.unit_id;
                    unit = this.gameState.playerManager.getPlayer(id);
                    if( data.targetPosition ) {
                        targetPosition = data.targetPosition;
                    }
                } else if( data.unit_type == "unit" && data.faction == 1 ) {
                    id = data.unit_id;
                    unit = this.gameState.npcManager.npcs[id];       
                    if( data.targetPosition ) {
                        targetPosition = data.targetPosition;
                    }
                }   
                
                if( unit ) {
                    if( targetPosition ) {
                        if (targetPosition.x < unit.position.x) {
                            unit.faceDirection('attack', 'left');
                        } else if (targetPosition.x > unit.position.x) {
                            unit.faceDirection('attack', 'right');
                        } else if (targetPosition.y < unit.position.y) {
                            unit.faceDirection('attack', 'up');
                        } else if (targetPosition.y > unit.position.y) {
                            unit.faceDirection('attack', 'down');
                        }                        
                    }
                    unit.attack();
                }                
                break;
            case "target_death":
                this.gameState.targetDeath(data);
                break;
            case "npc_move":
                this.gameState.npcMove(data);
                break;
            case "level_up":
                this.gameState.levelUp(data);
                break;
            case "health_regeneration":
                this.gameState.healthRegeneration(data);                
                break;
            case "item_drop":
                this.gameState.addItem(data);
                break;
            case "item_pickup":
                this.gameState.itemPickup(data);
                break;
            case 'potion_used':
                this.gameState.potionUsed(data);
                break;
            case 'combat_log_update':
                this.gameState.combatLogUpdate(data);
                break;
            case 'update_tree':
                this.gameState.updateTree(data);
                break;
            case 'update_stone':
                this.gameState.updateStone(data);
                break;
            case 'update_towns':
                this.gameState.updateTowns(data);
                break;
            case 'update_resource':
                this.gameState.updateResource(data);
                break;
            case 'update_faction_resources':
                this.gameState.updateFactionResources(data);
                break;                
        }
      
    }

   
    // Close the WebSocket connection
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

import { CONFIG } from "./config";
// Network.js
export default class NetworkManager {
    constructor(serverUrl, gameState) {
        this.gameState = gameState;
        this.socket = null;    
        this.connect(serverUrl);    
    }

    // Connect to the WebSocket server
    connect(serverUrl) {
        this.socket = new WebSocket(serverUrl);

        // Connection opened
        this.socket.addEventListener('open', (event) => {
            console.log('Connected to the WebSocket server.');
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

    // Handle incoming messages
    handleMessage(data) {
        let player;
        switch(data.type) {
            case "init":                
                this.gameState.init(data); 
                break;
            case "new_player":
                this.gameState.playerManager.addPlayer({ id: data.id, color: data.color, position: data.position, stats: data.stats});
                break;
            case "player_move":
                player = this.gameState.playerManager.getPlayer(data.id);
                if( player ) {
                    this.gameState.offsetX -= data.move.x * CONFIG.tileSize;
                    this.gameState.offsetY -= data.move.y * CONFIG.tileSize;
            
                    player.position = data.position;
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
            case "spawn_enemy":
                this.gameState.enemyManager.addEnemy({id: data.enemy.id, position: data.enemy.position, stats: data.enemy.stats});
                break;
            case "combat_update":
                this.gameState.combatUpdate(data);
                break;
            case "start_attack":
                let id, unit, target;
                if( data.playerId ) {
                    id = data.playerId;
                    unit = this.gameState.playerManager.getPlayer(id);
                    if( data.targetId ) {
                        target = this.gameState.enemyManager.enemies[data.targetId];
                    }
                } else if( data.enemyId ) {
                    id = data.enemyId;
                    unit = this.gameState.enemyManager.enemies[id];       
                    if( data.targetId ) {
                        target = this.gameState.playerManager.getPlayer(data.targetId);
                    }
                }   
                
                if( unit ) {
                    if( target ) {
                        if (target.position.x < unit.position.x) {
                            unit.faceDirection('attack', 'left');
                        } else if (target.position.x > unit.position.x) {
                            unit.faceDirection('attack', 'right');
                        } else if (target.position.y < unit.position.y) {
                            unit.faceDirection('attack', 'up');
                        } else if (target.position.y > unit.position.y) {
                            unit.faceDirection('attack', 'down');
                        }                        
                    }
                    unit.attack();
                }                
                break;
            case "enemy_death":
                this.gameState.enemyDeath(data);
                break;
            case "enemy_move":
                this.gameState.enemyMove(data);
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
                // Remove the item from the ground
                this.gameState.itemPickup(data);
                break;
            case 'potion_used':
                this.gameState.potionUsed(data);
                break;
            case 'combat_log_update':
                this.gameState.combatLogUpdate(data);
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


import { CONFIG } from './config';
// EventHandler.js

export default class EventHandler {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
    }

    setupEventListeners() {
        // Set up user input event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        let player = this.gameState.getCurrentPlayer();

        if( player ) {
            const key = event.key;
            // Handle key down events for player movement or actions
            if (key === 'w' || key === 's' || key === 'a' || key === 'd') {
                const move = {x: 0, y: 0};
                if (key === 'w') move.y = -1;
                if (key === 's') move.y = 1;
                if (key === 'a') move.x = -1;
                if (key === 'd') move.x = 1;
        
                player.position.x += move.x;
                player.position.y += move.y;
                this.gameState.offsetX -= move.x * CONFIG.tileSize;
                this.gameState.offsetY -= move.y * CONFIG.tileSize;
        
                this.gameState.drawGame();
                this.networkManager.socket.send(JSON.stringify({type: "move", playerId: this.gameState.currentPlayerId, position: player.position}));
            }
            if (event.key === 'e') {
                // Assuming you have a function to get the current tile
                const currentPosition = this.gameState.getCurrentPlayer().position;
                this.networkManager.socket.send(JSON.stringify({type: "pickup", playerId: this.gameState.currentPlayerId, position: currentPosition}));
            }
            if (event.key === 'i') {
                //toggleInventory();
            }
            if (event.code === "Space") {
                // Send a message to the server to use a potion
                this.networkManager.socket.send(JSON.stringify({
                    type: "use_potion",
                    playerId: this.gameState.currentPlayerId  // Make sure you have the player's ID available here
                }));
            }
        }
    }

   



}

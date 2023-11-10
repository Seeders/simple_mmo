
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

        // Function to handle mouse clicks for selecting targets
        this.gameState.canvas.addEventListener('click', this.handleClick.bind(this));
        
    }

    handleClick(event) {
        const rect = this.gameState.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check if a player is clicked
        for (const id in this.gameState.players) {
            const player = this.gameState.players[id];
            // Calculate the center of the player's position
            const playerCenterX = player.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
            const playerCenterY = player.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;
            // Check if the click is within the circle's radius
            if (Math.pow(clickX - playerCenterX, 2) + Math.pow(clickY - playerCenterY, 2) <= Math.pow(CONFIG.unitSize / 2, 2)) {
                this.gameState.selectedTarget = { type: 'player', id: id, stats: player.stats };
                return;
            }
        }

        // Check if an enemy is clicked
        for (const id in this.gameState.enemies) {
            const enemy = this.gameState.enemies[id];
            const enemyX = enemy.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2
            const enemyY = enemy.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2
            if (Math.pow(clickX - enemyX, 2) + Math.pow(clickY - enemyY, 2) <= Math.pow(CONFIG.unitSize / 2, 2)) {
                this.gameState.selectedTarget = { type: 'enemy', id: id, stats: enemy.stats };
                return;
            }
        }

        // If nothing is clicked, clear the selection
        this.gameState.selectedTarget = null;
    }

    handleKeyDown(event) {
        let player = this.gameState.getCurrentPlayer();

        if( player ) {
            const key = event.key;
            // Handle key down events for player movement or actions
            if (key === 'w' || key === 's' || key === 'a' || key === 'd') {
                const move = {x: 0, y: 0};
                if (key === 'w'){
                    player.move('up');
                    move.y = -1;
                }
                if (key === 's') {
                    player.move('down');
                    move.y = 1;
                }
                if (key === 'a') {
                    player.move('left');
                    move.x = -1;
                }
                if (key === 'd'){
                    player.move('right');
                    move.x = 1;
                }
        
                player.position.x += move.x;
                player.position.y += move.y;
                this.gameState.offsetX -= move.x * CONFIG.tileSize;
                this.gameState.offsetY -= move.y * CONFIG.tileSize;
        
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

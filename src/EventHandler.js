
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
        this.gameState.debugCanvas.addEventListener('click', this.handleClick.bind(this));
        
    }
    getCanvasCoordinates(event) {
        const rect = this.gameState.canvas.getBoundingClientRect();
        const scaleX = this.gameState.canvas.width / rect.width;  // ratio of actual width to CSS width
        const scaleY = this.gameState.canvas.height / rect.height; // ratio of actual height to CSS height
    
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
    
        return { x: canvasX, y: canvasY };
    }
    drawDebugClick(ctx, x, y, color='red') {
        ctx.save(); // Save the current state of the canvas
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2); // Draw a small circle
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore(); // Restore the state of the canvas
    }
    handleClick(event) {
        const coords = this.getCanvasCoordinates(event);
        const clickX = coords.x;
        const clickY = coords.y;
        // Check if a player is clicked
        for (const id in this.gameState.playerManager.players) {
            const player = this.gameState.playerManager.players[id];
            // Calculate the center of the player's position
            const playerCenterX = player.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
            const playerCenterY = player.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;

            let p = document.createElement('p');
            p.innerText = `<p>${clickX},${clickY} - ${playerCenterX},${playerCenterY}</p>`;
            document.getElementById('chatMessages').appendChild(p);
            // Check if the click is within the circle's radius
            if (Math.pow(clickX - playerCenterX, 2) + Math.pow(clickY - playerCenterY, 2) <= Math.pow(CONFIG.unitSize / 2, 2)) {
                this.gameState.selectedTarget = { type: 'player', id: id, stats: player.stats };
                return;
            }
        }

        // Check if an enemy is clicked
        for (const id in this.gameState.enemyManager.enemies) {
            const enemy = this.gameState.enemyManager.enemies[id];
            const enemyX = enemy.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
            const enemyY = enemy.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;
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
                    player.faceDirection('move', 'up');
                    move.y = -1;
                }
                if (key === 's') {
                    player.faceDirection('move', 'down');
                    move.y = 1;
                }
                if (key === 'a') {
                    player.faceDirection('move', 'left');
                    move.x = -1;
                }
                if (key === 'd'){
                    player.faceDirection('move', 'right');
                    move.x = 1;
                }
        
                let newPositionX = player.position.x + move.x;
                let newPositionY = player.position.y + move.y;
        
                this.networkManager.socket.send(JSON.stringify({type: "move", playerId: this.gameState.currentPlayerId, move: move, position: {x: newPositionX, y: newPositionY}}));
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

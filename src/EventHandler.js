
import { CONFIG } from './Config/config';
// EventHandler.js

export default class EventHandler {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
        this.currentFrameTime = Date.now();   
        this.serverUpdateRate = 100; // Milliseconds, adjust as needed
        this.lastServerUpdateTime = Date.now();
        requestAnimationFrame(() => this.setFrameTime());
    }

    setFrameTime() {
        this.deltaTime = Date.now() - this.currentFrameTime;
        this.currentFrameTime = Date.now();
        requestAnimationFrame(() => this.setFrameTime());
    }


    setupEventListeners() {
        // Set up user input event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Function to handle mouse clicks for selecting targets
        this.gameState.canvas.addEventListener('click', this.handleClick.bind(this));
        this.gameState.canvas.addEventListener('mousemove', (event) => {
            const canvasCoords = this.getCanvasCoordinates(event);
            const gameCoords = this.gridCoordsFromCanvas(canvasCoords.x, canvasCoords.y);
            this.gameState.cursorX = canvasCoords.x;
            this.gameState.cursorY = canvasCoords.y;
            this.gameState.cursorTileX = gameCoords.x;
            this.gameState.cursorTileY = gameCoords.y;
        });
    }
   
    getCanvasCoordinates(event) {
        const rect = this.gameState.canvas.getBoundingClientRect();
        const scaleX = this.gameState.canvas.width / rect.width;  // ratio of actual width to CSS width
        const scaleY = this.gameState.canvas.height / rect.height; // ratio of actual height to CSS height
    
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
    
        return { x: canvasX, y: canvasY };
    }
    
    gridCoordsFromCanvas(canvasX, canvasY) {
        // Convert canvas coordinates to grid coordinates
        const x = Math.floor((canvasX - this.gameState.offsetX) / CONFIG.tileSize);
        const y = Math.floor((canvasY - this.gameState.offsetY) / CONFIG.tileSize);
        return { x, y };
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
        const item = this.gameState.activeOnCursor;
        if( item ) {
            this.gameState.buildActiveItem();
            return;
        }
        const coords = this.getCanvasCoordinates(event);
        const clickX = coords.x;
        const clickY = coords.y;
        this.gameState.selectedTarget = null;
        // Check if a player is clicked
        for (const id in this.gameState.playerManager.players) {
            const player = this.gameState.playerManager.players[id];
            // Calculate the center of the player's position
            const playerCenterX = player.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
            const playerCenterY = player.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;
            // Check if the click is within the circle's radius
            if (Math.pow(clickX - playerCenterX, 2) + Math.pow(clickY - playerCenterY, 2) <= Math.pow(CONFIG.unitSize / 2, 2)) {
                this.gameState.selectedTarget = { type: 'player', id: id, stats: player.stats };
                return;
            }
        }

        // Check if an npc is clicked
        for (const id in this.gameState.npcManager.npcs) {
            const npc = this.gameState.npcManager.npcs[id];
            const npcX = npc.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
            const npcY = npc.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;
            if (Math.pow(clickX - npcX, 2) + Math.pow(clickY - npcY, 2) <= Math.pow(CONFIG.unitSize / 2, 2)) {
                this.gameState.selectedTarget = { type: 'npc', id: id, stats: npc.stats };
            }
        }        

        const destination = this.gridCoordsFromCanvas(coords.x, coords.y);
        this.networkManager.socket.send(JSON.stringify({
            type: "move",
            playerId: this.gameState.currentPlayerId,
            destination: destination            
        }));
        // Assuming you have a method to check if the destination is walkable
       
        this.gameState.getCurrentPlayer().playerMoveDestination = destination;
        this.startPathFinding(this.gameState.getCurrentPlayer(), destination);
    
    }

    handleKeyDown(event) {
        let player = this.gameState.getCurrentPlayer();

        if( player ) {
            const key = event.key;
            // Handle key down events for player movement or actions           
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
            console.log(event.code);
            if (event.code === "Escape") {
                // Send a message to the server to use a potion
                this.gameState.activeOnCursor = null;
            }
        }
    }

    startPathFinding(player, destination) {
        clearTimeout(player.pathTimeout);
        this.gameState.playerMoved = true;
        // Assuming you have a function to calculate the path
        let playerTilePosition = { x: parseInt(player.position.x / CONFIG.tileSize), y: parseInt(player.position.y / CONFIG.tileSize) };
        const path = this.gameState.findPath(playerTilePosition, destination);
        
        if (path.length > 0) {
            player.path = path;
            this.movePlayerAlongPath(player, path);
        } else {
            let move = { x: 0, y: 0 };
            if(destination.x < playerTilePosition.x) move.x = -CONFIG.tileSize;
            if(destination.x > playerTilePosition.x) move.x = CONFIG.tileSize;
            if(destination.y < playerTilePosition.y) move.y = -CONFIG.tileSize;
            if(destination.y > playerTilePosition.y) move.y = CONFIG.tileSize;
            this.networkManager.socket.send(JSON.stringify({type: "move", playerId: this.gameState.currentPlayerId, move: move, position: { x: player.position.x + move.x, y: player.position.y + move.y }}));
        }
    }
    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
   
    movePlayerAlongPath(player, path) {
        let nextStep = 0;
        let t = 0; // Interpolation factor
        const updateRate = 100; // Milliseconds, adjust as needed

        const movePlayer = () => {

            if (nextStep < path.length) {  
                let roadBonus = player.isOnRoad ? 1.5 : this.gameState.getTerrainCost({ x: parseInt(parseInt(player.position.x) / CONFIG.tileSize),  y: parseInt(parseInt(player.position.y) / CONFIG.tileSize)});
   
                let start = { x: player.position.x, y: player.position.y };
                let end = { x: path[nextStep].x * CONFIG.tileSize, y: path[nextStep].y * CONFIG.tileSize };
                t += (updateRate * roadBonus * player.stats['move_speed']) / 1000;
        
                let newPosition = { x: this.lerp(start.x, end.x, t), y: this.lerp(start.y, end.y, t) };

                player.position = newPosition;

                if (t >= 1) {
                    t = 0;
                    nextStep++;
                }
            } else {
                player.playerMoveDestination = null;
                player.path = null;
                clearInterval(this.moveInterval);
            }
        };
        if(this.moveInterval){
            // Clear any existing interval and start a new one
            clearInterval(this.moveInterval);
        }
        this.moveInterval = setInterval(movePlayer, updateRate);

        // Modify handleClick or any other function that sets a new destination
        // to clear and reset the interval when a new destination is clicked
    }

    
}

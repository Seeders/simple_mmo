
import { CONFIG } from './config';
export default class RenderManager {
    constructor(gameState, assetManager) {
        this.gameState = gameState;
        this.assetManager = assetManager;
        this.inventoryElement = document.getElementById('inventory');
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCtx = this.terrainCanvas.getContext('2d');
        this.terrainCanvas.width = CONFIG.worldSize * CONFIG.tileSize;
        this.terrainCanvas.height = CONFIG.worldSize * CONFIG.tileSize;
        this.terrainRendered = false;
    }
    renderGame() {    
        this.gameState.context.clearRect(0, 0, this.gameState.canvas.width, this.gameState.canvas.height);
            // Draw the static terrain canvas onto the main canvas
        this.renderTerrain();
        this.renderTargetCircle();
        this.renderPlayers();
        this.renderEnemies();
        this.renderPlayerStats();
        this.renderTargetInfo();
        this.renderItems();
    }

    renderSprite(context, img, dx, dy, sx = 0, sy = 0, size = CONFIG.tileSize ){ 
        // Draw the image on the canvas
        context.drawImage(img, sx, sy, size, size, dx, dy, size, size);
    }

    renderTerrain() {
        // Calculate the offset based on the player's position to center the player on the screen
        const player = this.gameState.getCurrentPlayer();
        if (player) {
            const halfCanvasWidth = this.gameState.canvas.width / 2;
            const halfCanvasHeight = this.gameState.canvas.height / 2;
            const worldPixelWidth = this.gameState.terrain.map[0].length * CONFIG.tileSize;
            const worldPixelHeight = this.gameState.terrain.map.length * CONFIG.tileSize;
    
            // Calculate the desired center position
            let desiredCenterX = player.position.x * CONFIG.tileSize + CONFIG.tileSize / 2;
            let desiredCenterY = player.position.y * CONFIG.tileSize + CONFIG.tileSize / 2;
    
            // Clamp the center position to prevent the viewport from showing out-of-bounds areas
            desiredCenterX = Math.max(halfCanvasWidth, Math.min(desiredCenterX, worldPixelWidth - halfCanvasWidth));
            desiredCenterY = Math.max(halfCanvasHeight, Math.min(desiredCenterY, worldPixelHeight - halfCanvasHeight));
    
            // Calculate the top-left corner of the viewport
            this.gameState.offsetX = halfCanvasWidth - desiredCenterX;
            this.gameState.offsetY = halfCanvasHeight - desiredCenterY;
    
            // Render the terrain onto the off-screen canvas if it hasn't been rendered yet
            if (!this.terrainRendered) {
                this.terrainCtx.clearRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);
                for (let y = 0; y < this.gameState.terrain.map.length; y++) {
                    for (let x = 0; x < this.gameState.terrain.map[y].length; x++) {
                        const terrainType = this.gameState.terrain.getTerrainTypeAt(x, y);
                        const spritePosition = this.gameState.terrain.getSpriteLocation(terrainType);
                        const img = this.assetManager.assets[this.gameState.terrain.spriteSheetKey];
                        if (!img) {
                            console.error(`${terrainType} image not loaded`);
                        } else {
                            this.renderSprite(this.terrainCtx, img, x * CONFIG.tileSize, y * CONFIG.tileSize, spritePosition.x, spritePosition.y);
                        }
                    }
                }
                this.terrainRendered = true;
            }
    
            // Draw the off-screen canvas onto the main canvas with the offset
            this.gameState.context.drawImage(this.terrainCanvas, this.gameState.offsetX, this.gameState.offsetY);
        }
    }
    
    

    renderPlayers() {
        for (const id in this.gameState.players) {
            const player = this.gameState.players[id];
            player.render();
            const img = this.assetManager.assets[player.spriteSheetKey];            
            const spritePosition = player.currentSprite;  
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, player.position.x * CONFIG.tileSize + this.gameState.offsetX, player.position.y * CONFIG.tileSize + this.gameState.offsetY, spritePosition.x, spritePosition.y);                         
        }
    }

    renderEnemies() {
        for (const id in this.gameState.enemies) {
            const enemy = this.gameState.enemies[id];
            const img = this.assetManager.assets[enemy.type];
            // Adjust the position to center the larger unit image on the tile
            this.gameState.context.drawImage(img, enemy.position.x * CONFIG.tileSize + this.gameState.offsetX - (CONFIG.unitSize - CONFIG.tileSize) / 2, enemy.position.y * CONFIG.tileSize + this.gameState.offsetY - (CONFIG.unitSize - CONFIG.tileSize) / 2, CONFIG.unitSize, CONFIG.unitSize);
        }
    }


    // Function to draw the level and health of the current player
    renderPlayerStats() {
        const player = this.gameState.getCurrentPlayer();
        if (player) {
            const healthPercentage = player.stats.health / player.stats.max_health;
            this.renderHealthBar(10, this.gameState.canvas.height - 30, 200, 20, healthPercentage);
            this.gameState.context.fillStyle = 'black';
            this.gameState.context.fillText(`Level: ${player.stats.level} Health: ${player.stats.health}`, 10, this.gameState.canvas.height - 10);
            const expPercentage = player.stats.experience / player.stats.next_level_exp;
            this.renderExperienceBar(10, this.gameState.canvas.height - 50, 200, 10, expPercentage);    
        }
    }
    
    // Function to draw the health bar
    renderHealthBar(x, y, width, height, healthPercentage) {
        this.gameState.context.fillStyle = 'grey';  // Background color
        this.gameState.context.fillRect(x, y, width, height);
        this.gameState.context.fillStyle = 'red';  // Foreground color
        this.gameState.context.fillRect(x, y, width * healthPercentage, height);
    }

    renderExperienceBar(x, y, width, height, expPercentage) {
        this.gameState.context.fillStyle = 'grey';  // Background color
        this.gameState.context.fillRect(x, y, width, height);
        this.gameState.context.fillStyle = 'green';  // Foreground color
        this.gameState.context.fillRect(x, y, width * expPercentage, height);
    }

    // Function to draw the selected target's information
    renderTargetInfo() {
        if (this.gameState.selectedTarget) {
            const target = this.gameState.selectedTarget.type === 'player' ? this.gameState.players[this.gameState.selectedTarget.id] : this.gameState.enemies[this.gameState.selectedTarget.id];
            if(target && target.stats) {
                const healthPercentage = target.stats.health / target.stats.max_health;  // Max health depends on type
                this.renderHealthBar(220, this.gameState.canvas.height - 30, 200, 20, healthPercentage);
                this.gameState.context.fillStyle = 'black';
                this.gameState.context.fillText(`${target.name} - Level: ${target.stats.level} Health: ${target.stats.health}`, 220, this.gameState.canvas.height - 10);
            }
        }
    }
    renderTargetCircle() {
        if (this.gameState.selectedTarget) {
            let target;
            if (this.gameState.selectedTarget.type === 'player') {
                target = this.gameState.players[this.gameState.selectedTarget.id];
            } else if (this.gameState.selectedTarget.type === 'enemy') {
                target = this.gameState.enemies[this.gameState.selectedTarget.id];
            }
            
            if (target) {
                this.gameState.context.strokeStyle = 'yellow';
                this.gameState.context.lineWidth = 3; // Width of the circle outline
                this.gameState.context.beginPath();
                // Calculate the center x position
                const centerX = target.position.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
                // Calculate the bottom y position, adjusted by the line width
                const bottomY = target.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize - this.gameState.context.lineWidth / 2;
                // Draw the circle at the bottom center of the tile
                // The radius is now set to half of CONFIG.tileSize plus an extra 5 pixels
                this.gameState.context.arc(centerX, bottomY, CONFIG.tileSize / 2 + 5, 0, Math.PI * 2);
                this.gameState.context.stroke();
            }
        }
    }
    renderItems() {
        for (const id in this.gameState.items) {
            const item = this.gameState.items[id];
            const potionX = item.position.x * CONFIG.tileSize + this.gameState.offsetX;
            const potionY = item.position.y * CONFIG.tileSize + this.gameState.offsetY;

            // Check if the potion's position is within the canvas bounds
            if (potionX >= 0 && potionX <= this.gameState.canvas.width && potionY >= 0 && potionY <= this.gameState.canvas.height) {
                this.gameState.context.drawImage(this.assetManager.assets[item.type], potionX, potionY, CONFIG.tileSize, CONFIG.tileSize);
            } else {
                console.log(`Item with ID ${id} is out of bounds: ${potionX}, ${potionY}`);
            }
        }
    }
    renderInventory() {
        // Clear the current inventory display
        this.inventoryElement.innerHTML = '';

        let player = this.gameState.getCurrentPlayer();
        // Add each item in the player's inventory to the UI
        player.inventory.forEach((item) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.textContent = item.name; // Assuming items have a 'name' property
            this.inventoryElement.appendChild(itemElement);
        });
    }

}
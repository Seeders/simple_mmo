
import { CONFIG } from './config';
export default class RenderManager {
    constructor(gameState, assetManager) {
        this.gameState = gameState;
        this.assetManager = assetManager;
        this.inventoryElement = document.getElementById('inventory');
    }
    renderGame() {    
        
        console.log( 'Render Game' );
        this.gameState.context.clearRect(0, 0, this.gameState.canvas.width, this.gameState.canvas.height);
        this.renderTerrain();
        this.renderTargetCircle();
        this.renderPlayers();
        this.renderEnemies();
        this.renderPlayerStats();
        this.renderTargetInfo();
        this.renderItems();
    }

    renderTerrain() {
        for (let y = 0; y < this.gameState.terrain.length; y++) {
            for (let x = 0; x < this.gameState.terrain[y].length; x++) {
                const terrainType = this.gameState.terrain[y][x];
                const img = this.assetManager.assets[terrainType];
                if( !img ) {
                    console.error(`${terrainType} image not loaded`);
                } else if (img.complete) { // Check if the image is loaded
                    this.gameState.context.drawImage(img, x * CONFIG.tileSize + this.gameState.offsetX, y * CONFIG.tileSize + this.gameState.offsetY, CONFIG.tileSize, CONFIG.tileSize);
                } else {
                    // Optionally draw a placeholder or load the image if it's not done yet
                    img.onload = () => {
                        this.gameState.context.drawImage(img, x * CONFIG.tileSize + this.gameState.offsetX, y * CONFIG.tileSize + this.gameState.offsetY, CONFIG.tileSize, CONFIG.tileSize);
                    };
                }
            }
        }
    }

    renderPlayers() {
        for (const id in this.gameState.players) {
            const player = this.gameState.players[id];
            const img = this.assetManager.assets['hero'];
            // Adjust the position to center the larger unit image on the tile
            this.gameState.context.drawImage(img, player.position.x * CONFIG.tileSize + this.gameState.offsetX - (CONFIG.unitSize - CONFIG.tileSize) / 2, player.position.y * CONFIG.tileSize + this.gameState.offsetY - (CONFIG.unitSize - CONFIG.tileSize) / 2, CONFIG.unitSize, CONFIG.unitSize);
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
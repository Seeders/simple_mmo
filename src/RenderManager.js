
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
        this.renderTowns();
        this.renderTargetCircle();
        
        this.renderPlayers();
        this.renderEnemies();
        this.renderPlayerStats();
        this.renderTargetInfo();
        this.renderItems();
    }

    renderSprite(context, img, dx, dy, sx = 0, sy = 0, size = CONFIG.tileSize ){ 
        if( size != CONFIG.tileSize ) {
            let difference = size - CONFIG.tileSize;
            dx -= difference / 2;
            dy -= difference / 2;
        }
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
                this.renderRoads(this.terrainCtx);
                this.renderTrees(this.terrainCtx);
                this.terrainRendered = true;
            }
    
            // Draw the off-screen canvas onto the main canvas with the offset
            this.gameState.context.drawImage(this.terrainCanvas, this.gameState.offsetX, this.gameState.offsetY);
        }
    }
    
    

    renderPlayers() {
        for (const id in this.gameState.playerManager.players) {
            const player = this.gameState.playerManager.players[id];
            player.render();
            const img = this.assetManager.assets[player.spriteSheetKey];            
            const spritePosition = player.currentSprite;  
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, player.position.x * CONFIG.tileSize + this.gameState.offsetX, player.position.y * CONFIG.tileSize + this.gameState.offsetY, spritePosition.x, spritePosition.y);                         
        }
    }

    renderEnemies() {
        for (const id in this.gameState.enemyManager.enemies) {
            const enemy = this.gameState.enemyManager.enemies[id];
            enemy.render();
            const img = this.assetManager.assets[enemy.spriteSheetKey];     
            const spritePosition = enemy.currentSprite;  
            let tileSize = CONFIG.tileSize;
            if( enemy.stats.size ) {
                tileSize = enemy.stats.size;
            }
            if(!spritePosition){
                debugger;
            }
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, enemy.position.x * CONFIG.tileSize + this.gameState.offsetX, enemy.position.y * CONFIG.tileSize + this.gameState.offsetY, spritePosition.x, spritePosition.y, tileSize);                         
        }
    }

    renderTowns() {
        const townImg = this.assetManager.assets['townSprite']; // Replace with your town sprite key
        this.gameState.towns.forEach(town => {
            const townX = town.x * CONFIG.tileSize + this.gameState.offsetX;
            const townY = town.y * CONFIG.tileSize + this.gameState.offsetY;
            this.gameState.context.drawImage(townImg, townX, townY, CONFIG.tileSize, CONFIG.tileSize);
        });
    }

    renderTrees(ctx) {
        this.gameState.trees.forEach(tree => {
            // Check if the tree's position overlaps with a road
            if (!this.roadCoordinates.has(`${tree.position.x},${tree.position.y}`)) {
                const treeImg = this.assetManager.assets[`${tree.type}_tree`]; // Replace with your tree sprite key
                const treeX = tree.position.x * CONFIG.tileSize;
                const treeY = tree.position.y * CONFIG.tileSize;
                this.renderSprite(ctx, treeImg, treeX, treeY, tree.type == 'stump' ? 0 : CONFIG.tileSize, 0, CONFIG.tileSize);
            }
        });
    }

    renderRoads(ctx) {
        this.roadCoordinates = new Set(); // Initialize the set to store road coordinates
    
        this.gameState.roads.forEach(roadSegment => {
            roadSegment.forEach(point => {
                const roadImg = this.assetManager.assets[`terrain`]; // Replace with your road sprite key
                const x = point.x * CONFIG.tileSize;
                const y = point.y * CONFIG.tileSize;
                
                this.renderSprite(ctx, roadImg, x, y, CONFIG.tileSize * 3, 0, CONFIG.tileSize);
    
                // Store the road tile coordinates in the set
                this.roadCoordinates.add(`${point.x},${point.y}`);
            });
        });
    }
    
    
    // Function to draw the level and health of the current player
    renderPlayerStats() {
        const player = this.gameState.getCurrentPlayer();
        if (player) {
            const healthPercentage = player.stats.health / player.stats.max_health;
            this.renderHealthBar(10, this.gameState.canvas.height - 30, 200, 20, healthPercentage);
            // this.gameState.context.fillStyle = 'black';
            // this.gameState.context.fillText(`Level: ${player.stats.level} Health: ${player.stats.health}`, 10, this.gameState.canvas.height - 10);
            const expPercentage = player.stats.experience / player.stats.next_level_exp;
            this.renderExperienceBar(10, this.gameState.canvas.height - 50, 200, 10, expPercentage);    
        }
    }

    // Function to draw the health bar
    renderHealthBar(x, y, width, height, healthPercentage, showNumber = true) {
        // Background of the health bar
        this.gameState.context.fillStyle = '#555';  // Dark grey background
        this.gameState.context.fillRect(x, y, width, height);

        // Health bar foreground
        this.gameState.context.fillStyle = '#4CAF50';  // Nice looking green color
        this.gameState.context.fillRect(x, y, width * healthPercentage, height);

        // Text for health bar
        const player = this.gameState.getCurrentPlayer();
        if (player && showNumber) {
            this.gameState.context.fillStyle = 'white';
            this.gameState.context.font = 'bold 12px Arial';
            this.gameState.context.textAlign = 'center';
            this.gameState.context.textBaseline = 'middle';
            this.gameState.context.fillText(`${player.stats.health}`, x + width / 2, y + height / 2);
        }
    }

    // Function to draw the experience bar
    renderExperienceBar(x, y, width, height, expPercentage) {
        // Background of the experience bar
        this.gameState.context.fillStyle = '#333';  // Darker grey background
        this.gameState.context.fillRect(x, y, width, height);

        // Experience bar foreground
        this.gameState.context.fillStyle = '#FFD700';  // Fitting yellow color
        this.gameState.context.fillRect(x, y, width * expPercentage, height);
        // Text for experience bar
        this.gameState.context.fillStyle = 'white';
        this.gameState.context.font = 'bold 12px Arial';
        this.gameState.context.textAlign = 'center';
        this.gameState.context.textBaseline = 'middle';
        this.gameState.context.fillText(`EXP: ${(expPercentage * 100).toFixed(0)}%`, x + width / 2, y + height / 2);
    }



    // Function to draw the selected target's information with background
    renderTargetInfo() {
        if (this.gameState.selectedTarget) {
            const target = this.gameState.selectedTarget.type === 'player' ? 
                        this.gameState.playerManager.players[this.gameState.selectedTarget.id] : 
                        this.gameState.enemyManager.enemies[this.gameState.selectedTarget.id];

            if (target && target.stats) {
                const healthPercentage = target.stats.health / target.stats.max_health;
                const barX = 220;
                const barY = this.gameState.canvas.height - 30;
                const barWidth = 200;
                const barHeight = 20;

                this.renderHealthBar(barX, barY, barWidth, barHeight, healthPercentage, false);

                // Set text style
                this.gameState.context.fillStyle = 'white';
                this.gameState.context.font = '12px Arial';
                this.gameState.context.textAlign = 'left';
                this.gameState.context.textBaseline = 'middle';

                // Calculate text position
                const textX = barX + 5; // Slight padding from the left edge
                const textY = barY + 10; // Centered vertically in the background rectangle

                // Render the text
                this.gameState.context.fillText(`${target.name} [${target.stats.level}] - ${target.stats.health}`, textX, textY);
            }
        }
    }


    renderTargetCircle() {
        if (this.gameState.selectedTarget) {
            let target;
            if (this.gameState.selectedTarget.type === 'player') {
                target = this.gameState.playerManager.players[this.gameState.selectedTarget.id];
            } else if (this.gameState.selectedTarget.type === 'enemy') {
                target = this.gameState.enemyManager.enemies[this.gameState.selectedTarget.id];
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
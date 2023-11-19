
import { CONFIG } from './config';
import TileMap from './TileMap';
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

        this.waterCanvas = document.createElement('canvas');
        this.waterCanvas.width = this.terrainCanvas.width;
        this.waterCanvas.height = this.terrainCanvas.height;
        this.waterCtx = this.waterCanvas.getContext('2d');

        this.sandCanvas = document.createElement('canvas');
        this.sandCanvas.width = this.terrainCanvas.width;
        this.sandCanvas.height = this.terrainCanvas.height;
        this.sandCtx = this.sandCanvas.getContext('2d');

        this.grassCanvas = document.createElement('canvas');
        this.grassCanvas.width = this.terrainCanvas.width;
        this.grassCanvas.height = this.terrainCanvas.height;
        this.grassCtx = this.grassCanvas.getContext('2d');

        this.forestCanvas = document.createElement('canvas');
        this.forestCanvas.width = this.terrainCanvas.width;
        this.forestCanvas.height = this.terrainCanvas.height;
        this.forestCtx = this.forestCanvas.getContext('2d');

        this.mountainCanvas = document.createElement('canvas');
        this.mountainCanvas.width = this.terrainCanvas.width;
        this.mountainCanvas.height = this.terrainCanvas.height;
        this.mountainCtx = this.mountainCanvas.getContext('2d');

        this.roadCanvas = document.createElement('canvas');
        this.roadCanvas.width = this.terrainCanvas.width;
        this.roadCanvas.height = this.terrainCanvas.height;
        this.roadCtx = this.roadCanvas.getContext('2d');


        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapCanvas.width = CONFIG.miniMapSize; // Match the CSS size
        this.minimapCanvas.height = CONFIG.miniMapSize; // Match the CSS size
        
        this.minimapTerrainCanvas = document.getElementById('minimapTerrainCanvas');
        this.minimapTerrainCtx = this.minimapTerrainCanvas.getContext('2d');
        this.minimapTerrainCanvas.width = CONFIG.miniMapSize; // Match the CSS size
        this.minimapTerrainCanvas.height = CONFIG.miniMapSize; // Match the CSS size
        this.tileMap = new TileMap(gameState, assetManager, this.terrainCanvas, CONFIG.tileSize, CONFIG.tileTypes);

        this.viewCanvas = document.getElementById('viewCanvas');
        this.viewCtx = this.viewCanvas.getContext('2d');
        this.viewCanvas.width = 256; // Match the CSS size
        this.viewCanvas.height = 256; // Match the CSS size
    
        this.cornerRadius = 0; // Adjust the corner radius as needed
        // Define terrain types and their associated colors
        this.terrainTypes = {
            "water": { "r": 127, "g": 212, "b": 255 },       // Light Blue
            "sand": { "r": 255, "g": 245, "b": 186 },       // Pale Yellow
            "grass": { "r": 139, "g": 195, "b": 74 },       // Bright Green
            "forest": { "r": 34, "g": 139, "b": 34 },       // Forest Green
            "mountain": { "r": 142, "g": 142, "b": 147 },   // Stone Gray
            "road": { "r": 169, "g": 149, "b": 123 },
        };

        // Define the order in which to draw terrain types (adjust as needed)
        this.drawOrder = [...CONFIG.tileTypes, 'road'];

    }
    renderGame() {
        this.gameState.context.clearRect(0, 0, this.gameState.canvas.width, this.gameState.canvas.height);
        const player = this.gameState.getCurrentPlayer();
        if (player) {
               this.gameState.canvas.width = window.innerWidth;
            this.gameState.canvas.height = window.innerHeight - document.getElementById('uiContainer').offsetHeight;
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
            // Render each layer to its off-screen canvas if not done yet
            if (!this.terrainRendered) {
                this.tileMap.load();
                let minimapWidth = this.minimapCanvas.width;
                let minimapHeight = this.minimapCanvas.height;

                // Draw the terrain canvas onto the minimap canvas, scaling it down
                this.minimapTerrainCtx.drawImage(this.terrainCanvas, 0, 0, this.terrainCanvas.width, this.terrainCanvas.height, 0, 0, minimapWidth, minimapHeight);
                        
                this.renderRoads();
                this.terrainRendered = true;
            }
         
        }

        // // Apply shadow and draw each off-screen canvas to the main canvas
        // this.gameState.context.shadowOffsetX = 5;
        // this.gameState.context.shadowOffsetY = 5;
        // this.gameState.context.shadowBlur = 10;
        // this.gameState.context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        
        // // Draw the sand layer with shadow
        // // this.gameState.context.drawImage(this.waterCanvas, this.gameState.offsetX, this.gameState.offsetY);
        // // this.gameState.context.drawImage(this.sandCanvas, this.gameState.offsetX, this.gameState.offsetY);
        // // this.gameState.context.drawImage(this.grassCanvas, this.gameState.offsetX, this.gameState.offsetY);
        // // this.gameState.context.drawImage(this.forestCanvas, this.gameState.offsetX, this.gameState.offsetY);
        // // this.gameState.context.drawImage(this.mountainCanvas, this.gameState.offsetX, this.gameState.offsetY);
      

        // // ... draw other layers ...

        // // Reset shadow effects after drawing all layers
        // this.gameState.context.shadowColor = 'transparent';

        // Clear the minimap
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        this.renderTerrain();
        // Render towns, target circle, minimap, players, enemies, etc.
        this.renderTowns();
        this.renderTrees();
        this.renderStones();
        this.renderTargetCircle();
        this.renderMinimap();
        this.renderPlayers();
        this.renderEnemies();
        this.renderPlayerStats();
        this.renderTargetInfo();
        this.renderView();
        this.renderItems();
        this.renderPath();
    }
 

    renderSprite(context, img, dx, dy, sx = 0, sy = 0, size = CONFIG.tileSize, autoScale=true ){ 
        if(autoScale){
            dx = dx * CONFIG.tileSize + this.gameState.offsetX;
            dy = dy * CONFIG.tileSize + this.gameState.offsetY;
        }
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

            this.gameState.context.drawImage(this.terrainCanvas, this.gameState.offsetX, this.gameState.offsetY);

    }

    renderPath() {
        const player = this.gameState.getCurrentPlayer();
        
        if(player && player.playerMoveDestination && player.path){     
            const destination = this.assetManager.assets["box_selector"];   
        // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, destination, player.playerMoveDestination.x, player.playerMoveDestination.y, 0, 0, CONFIG.unitSize); 
            for (let i = player.pathStep + 1; i < player.path.length - 1; i++) {
                const node = player.path[i];
                const circleSize = CONFIG.unitSize / 2;
                this.renderRoundedRect(this.gameState.context, node.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2 - circleSize / 2, node.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2 - circleSize / 2, circleSize, circleSize, circleSize / 2, '#F4C430');
            }
        // this.drawDebugHitbox(this.gameState.context, player.position.x, player.position.y);
        }
        
    }

    drawLayerWithShadows(ctx, canvas, layerType) {
        switch(layerType) {
            case 'water':
                // Apply water-specific effects instead of shadows
                break;
            case 'sand':
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.shadowBlur = 5;
                ctx.shadowColor = 'rgba(160, 82, 45, 0.3)'; // Sienna color for a sandy shadow
                break;
            case 'grass':
                // Grass layer might not have a shadow, but underneath objects might
                break;
            case 'forest':
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 5;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(0, 100, 0, 0.5)'; // Dark green for forest shadows
                break;
            case 'mountain':
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 10;
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(105, 105, 105, 0.7)'; // Dim gray for mountain shadows
                break;
            default:
                ctx.shadowColor = 'transparent';
                break;
        }
    
        // Draw the layer canvas with applied shadow settings
        ctx.drawImage(canvas, this.gameState.offsetX, this.gameState.offsetY);
    
        // Reset shadows after each layer to prevent them from applying to subsequent layers
        ctx.shadowColor = 'transparent';
    }

    renderMiniMapImg(canvas, x, y, size, spritePosition, img, _scale=2) {
        const scale = this.minimapCanvas.width / (CONFIG.worldSize);
        const scaledX = x * scale;
        const scaledY = y * scale;
        const scaledSize = scale * _scale;
        canvas.getContext('2d').drawImage(img, spritePosition.x, spritePosition.y, size, size, scaledX, scaledY, scaledSize, scaledSize);
    }    
    renderMiniMapColor(ctx, x, y, color, _scale=2) {
        const scale = this.minimapCanvas.width / (CONFIG.worldSize);
        const scaledX = x * scale;
        const scaledY = y * scale;
        const scaledSize = scale * _scale;
        ctx.fillStyle = color;
        ctx.fillRect(scaledX, scaledY, scaledSize, scaledSize);
    }
    
    renderMinimap() {
        const scale = this.minimapCanvas.width / (CONFIG.worldSize);
    
    
        // Render terrain, players, enemies, etc. on the minimap
        // Scale down the positions and sizes according to the minimap scale
        // Example: Render players
   
        const player = this.gameState.getCurrentPlayer();
        if( player ) {
            const playerSize = scale * 4; // Size of the player square on the minimap
            const playerX = (player.position.x * scale) - (playerSize / 2); // Center the square on the player's X position
            const playerY = (player.position.y * scale) - (playerSize / 2); // Center the square on the player's Y position
            this.minimapCtx.fillStyle = 'blue'; // Player color
            this.minimapCtx.fillRect(playerX, playerY, playerSize, playerSize);
        }

        // Add more rendering logic for other entities like enemies, items, etc.
    }


    renderPlayers() {
        for (const id in this.gameState.playerManager.players) {
            const player = this.gameState.playerManager.players[id];
            player.render();
            const img = this.assetManager.assets[player.spriteSheetKey];            
            const spritePosition = player.currentSprite;  
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, player.position.x, player.position.y, spritePosition.x, spritePosition.y, CONFIG.unitSize); 
           // this.drawDebugHitbox(this.gameState.context, player.position.x, player.position.y);
                          
        }
    }

    renderEnemies() {
        for (const id in this.gameState.enemyManager.enemies) {
            const enemy = this.gameState.enemyManager.enemies[id];
            enemy.render();
            const img = this.assetManager.assets[enemy.spriteSheetKey];     
            let spritePosition = enemy.currentSprite;  
            let unitSize = CONFIG.unitSize;
            if( enemy.stats.size ) {
                unitSize = enemy.stats.size;
            }
            if(!spritePosition){
                spritePosition = {x: 0, y: 0};
            }
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, enemy.position.x, enemy.position.y, spritePosition.x, spritePosition.y, unitSize);                         
            this.renderMiniMapImg(this.minimapCanvas, enemy.position.x, enemy.position.y, unitSize, spritePosition, img, 4);
          //  this.drawDebugHitbox(this.gameState.context, enemy.position.x, enemy.position.y);
        }
    }

    renderTowns() {
        const townImg = this.assetManager.assets['town']; // Replace with your town sprite key
        this.gameState.towns.forEach(town => {
            const spritePosition = { x: 0, y: 0};
            this.renderSprite(this.gameState.context, townImg, town.center.x, town.center.y, spritePosition.x, spritePosition.y, CONFIG.tileSize);
            this.renderMiniMapImg(this.minimapCanvas, town.center.x, town.center.y, CONFIG.tileSize, spritePosition, townImg);

            town.layout.forEach((building) => {
                if(this.assetManager.assets[building.type]){
                    const buildingImg = this.assetManager.assets[building.type]; // Replace with your town sprite key
                    this.renderSprite(this.gameState.context, buildingImg, building.position.x, building.position.y, spritePosition.x, CONFIG.unitSize, CONFIG.unitSize);
                } else {
                  //  console.log(building.type, 'not found');
                }
           
            });

        });
    }

    renderTrees() {
        this.gameState.trees.forEach(tree => {
            // Check if the tree's position overlaps with a road
            if (!this.roadCoordinates.has(`${tree.position.x},${tree.position.y}`)) {
                const treeImg = this.assetManager.assets[`${tree.type}_tree`]; // Replace with your tree sprite key               
                const spritePosition = { x: tree.type == 'stump' ? 0 : CONFIG.unitSize, y: 0};
                this.renderSprite(this.gameState.context, treeImg, tree.position.x, tree.position.y, spritePosition.x, spritePosition.y, CONFIG.unitSize);
                this.renderMiniMapImg(this.minimapTerrainCanvas, tree.position.x, tree.position.y, CONFIG.unitSize, spritePosition, treeImg);
            }
        });
    }

    renderStones() {
        this.gameState.stones.forEach(stone => {
            // Check if the stone's position overlaps with a road
            if (!this.roadCoordinates.has(`${stone.position.x},${stone.position.y}`)) {
                const stoneImg = this.assetManager.assets[`stone`]; // Replace with your stone sprite key
                const spritePosition = { x: 0, y: 0};
                this.renderSprite(this.gameState.context, stoneImg, stone.position.x, stone.position.y, spritePosition.x, spritePosition.y, CONFIG.unitSize);
                this.renderMiniMapImg(this.minimapTerrainCanvas, stone.position.x, stone.position.y, CONFIG.unitSize, spritePosition, stoneImg);
            }
        });
    }

    renderRoads() {
        this.roadCoordinates = new Set(); // Initialize the set to store road coordinates
    
        this.gameState.roads.forEach((roadSegment, roadIndex) => {
            roadSegment.forEach((point, index) => {
                const roadImg = this.assetManager.assets[`road`]; // Replace with your road sprite key
                const spritePosition = { x: 0, y: 0 };
                const x = point.x * CONFIG.tileSize;
                const y = point.y * CONFIG.tileSize;
    
                const prevPoint = roadSegment[index - 1];
                const nextPoint = roadSegment[index + 1];
    
                // Determine if this segment is part of a stair-like pattern
                if (prevPoint && nextPoint) {
                    const isStairPatternToRightUp = prevPoint.y === point.y - 1 && nextPoint.x === point.x - 1;
                    const isStairPatternToLeftUp = prevPoint.y === point.y - 1 && nextPoint.x === point.x + 1;
                    const isStairPatternToRightDown = prevPoint.y === point.y + 1 && nextPoint.x === point.x - 1;
                    const isStairPatternToLeftDown = prevPoint.y === point.y + 1 && nextPoint.x === point.x + 1;
    
                    if (isStairPatternToRightDown) {
                        this.drawAndShiftTriangle(roadImg, x - CONFIG.tileSize, y, false, true);
                    } else if (isStairPatternToLeftUp) {
                        this.drawAndShiftTriangle(roadImg, x, y, false, false);
                    } else if (isStairPatternToLeftDown) {
                        this.drawAndShiftTriangle(roadImg, x + CONFIG.tileSize, y + CONFIG.tileSize, true, false);
                    }else if (isStairPatternToRightUp) {
                        this.drawAndShiftTriangle(roadImg, x - CONFIG.tileSize, y - CONFIG.tileSize, true, true);
                    } else {
                        this.renderSprite(this.terrainCtx, roadImg, x, y, spritePosition.x, spritePosition.y, CONFIG.tileSize, false);
                    }
                } else {
                    this.renderSprite(this.terrainCtx, roadImg, x, y, spritePosition.x, spritePosition.y, CONFIG.tileSize, false);
                }
    
                this.renderMiniMapImg(this.minimapTerrainCanvas, point.x, point.y, CONFIG.tileSize, spritePosition, roadImg, 1);
                this.roadCoordinates.add(`${point.x},${point.y}`);
            });
        });
    }
    
    drawAndShiftTriangle(image, x, y, flip, goingDown) {
        // Determine the new canvas size
        const canvasWidth = image.width * 2;
        const canvasHeight = image.height * 2;
    
        // Create a new canvas element
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
    
        // Draw the image onto the canvas at the center
        ctx.drawImage(image, canvasWidth / 4, canvasHeight / 4, image.width, image.height);
    
        // Get the image data from the canvas
        let imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        let pixels = imgData.data;
    
        // Create a new empty image data object for the shifted image
        let shiftedImgData = ctx.createImageData(canvasWidth, canvasHeight);
    
        const shiftAmount = image.width / 2; // Shift by half the width of the image
    

        for (let localY = 0; localY < image.height; localY++) {
            for (let localX = 0; localX < image.width; localX++) {
                let oldIndex = ((localY + canvasHeight / 4) * canvasWidth + (localX + canvasWidth / 4)) * 4;
                let isBelowDiagonal = localX < localY;
                if(flip) isBelowDiagonal = image.width - localX < localY;
                if (isBelowDiagonal) {
                    // Calculate the new position for the pixel in the triangle
                    let newX = flip ? localX - shiftAmount : localX + shiftAmount;
                    let newY = localY - shiftAmount;
    
                    let newIndex = ((newY + canvasHeight / 4) * canvasWidth + (newX + canvasWidth / 4)) * 4;
    
                    // Shift the pixel
                    for (let i = 0; i < 4; i++) {
                        shiftedImgData.data[newIndex + i] = pixels[oldIndex + i];
                    }
                } else {
                    // Calculate the new position for the pixel in the triangle
                    let newX = flip ? localX + shiftAmount : localX - shiftAmount;
                    let newY = localY + shiftAmount;
    
                    let newIndex = ((newY + canvasHeight / 4) * canvasWidth + (newX + canvasWidth / 4)) * 4;
                    for (let i = 0; i < 4; i++) {
                        shiftedImgData.data[newIndex + i] = pixels[oldIndex + i];
                    }
                }
            }
        }
    
    
        // Clear the canvas and draw the shifted image
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.putImageData(shiftedImgData, 0, 0);
    
        // Adjust final drawing position based on road direction
        let finalX = x - (flip && !goingDown ? CONFIG.tileSize : 0);
        let finalY = y - (goingDown ? 0 : CONFIG.tileSize);
    
        // Draw the shifted image onto the original context at the specified position
        this.terrainCtx.drawImage(canvas, finalX, finalY);
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

    renderView() {
        let player = this.gameState.getCurrentPlayer();
        if(player){
            let tileType = this.gameState.terrain.map[player.position.y][player.position.x];
            const posX = this.gameState.canvas.width / 2;
            const posY = this.gameState.canvas.height - 30;
            
            // Set text style
            this.gameState.context.fillStyle = 'white';
            this.gameState.context.font = '12px Arial';
            this.gameState.context.textAlign = 'center';
            this.gameState.context.textBaseline = 'middle';

            let buildingType = this.gameState.getBuildingTypeAtCurrentTile();
            this.gameState.context.fillText(`${CONFIG.tileTypes[tileType]} - ${buildingType ? buildingType.type : 'none'}`, posX, posY);
            
            this.viewCtx.drawImage(this.assetManager.assets[`${CONFIG.tileTypes[tileType]}_bg_1`], 0, 0);
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
                const bottomY = target.position.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.unitSize * 1.5;
                // Draw the circle at the bottom center of the tile
                // The radius is now set to half of CONFIG.tileSize plus an extra 5 pixels
                this.gameState.context.arc(centerX, bottomY, CONFIG.unitSize / 2 + 5, 0, Math.PI * 2);
                this.gameState.context.stroke();
            }
        }
    }
    renderItems() {
        for (const id in this.gameState.items) {
            const item = this.gameState.items[id];
            const itemImg = this.assetManager.assets[item.type];
            const itemX = item.position.x;
            const itemY = item.position.y;

            const spritePosition = { x: 0, y: 0};
            // Check if the potion's position is within the canvas bounds
            if (itemX >= 0 && itemX <= this.gameState.canvas.width && itemY >= 0 && itemY <= this.gameState.canvas.height) {
                this.renderSprite(this.gameState.context, itemImg, itemX, itemY, spritePosition.x, spritePosition.y, CONFIG.unitSize);
            } else {
                console.log(`Item with ID ${id} is out of bounds: ${itemX}, ${itemY}`);
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


    // Function to render a rounded rectangle with overlapping
    renderRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    drawDebugHitbox(ctx, tileX, tileY) {
        const centerX = tileX * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2;
        const centerY = tileY * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, CONFIG.unitSize / 2, 0, Math.PI * 2); // Use the unitSize to draw the hitbox
        ctx.strokeStyle = 'yellow';
        ctx.stroke();
        ctx.restore();
    }
}
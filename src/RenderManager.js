
import { CONFIG } from './Config/config';
import TileMap from './TileMap';
import CanvasUtility from './Utility/CanvasUtility';

const FogTileState = {
    HIDDEN: 0,
    EXPLORED: 1,
    VISIBLE: 2
};

export default class RenderManager {
    constructor(gameState, assetManager) {
        this.gameState = gameState;
        this.assetManager = assetManager;
        this.inventoryElement = document.getElementById('inventory');
		this.canvasUtility = new CanvasUtility();

        this.terrainCanvas = document.createElement('canvas');
        this.terrainCtx = this.terrainCanvas.getContext('2d');
        this.terrainCanvas.width = CONFIG.worldSize * CONFIG.tileSize;
        this.terrainCanvas.height = CONFIG.worldSize * CONFIG.tileSize;
        this.terrainRendered = false;

        this.objectCanvas = document.createElement('canvas');
        this.objectCtx = this.objectCanvas.getContext('2d');
        this.objectCanvas.width = CONFIG.worldSize * CONFIG.tileSize;
        this.objectCanvas.height = CONFIG.worldSize * CONFIG.tileSize;
        this.objectsRendered = false;        

        this.fogOfWarCanvas = document.createElement('canvas');
        this.fogOfWarCtx = this.fogOfWarCanvas.getContext('2d');
        this.fogOfWarCanvas.width = CONFIG.worldSize * CONFIG.tileSize;
        this.fogOfWarCanvas.height = CONFIG.worldSize * CONFIG.tileSize;
        this.fogOfWarRendered = false;

        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapCanvas.width = CONFIG.miniMapSize; // Match the CSS size
        this.minimapCanvas.height = CONFIG.miniMapSize; // Match the CSS size
        
        this.minimapTerrainCanvas = document.getElementById('minimapTerrainCanvas');
        this.minimapTerrainCtx = this.minimapTerrainCanvas.getContext('2d');
        this.minimapTerrainCanvas.width = CONFIG.miniMapSize; // Match the CSS size
        this.minimapTerrainCanvas.height = CONFIG.miniMapSize; // Match the CSS size

        this.worldMapCanvas = document.getElementById('worldMapCanvas');
        this.worldMapCtx = this.worldMapCanvas.getContext('2d');
        this.worldMapCanvas.width = CONFIG.overworldMiniMapSize; // Match the CSS size
        this.worldMapCanvas.height = CONFIG.overworldMiniMapSize; // Match the CSS size
        
        this.overworldTerrainCanvas = document.createElement('canvas');
        this.overworldTerrainCtx = this.overworldTerrainCanvas.getContext('2d');
        this.overworldTerrainCanvas.width = CONFIG.overworldTileSize * CONFIG.overworldSize; // Match the CSS size
        this.overworldTerrainCanvas.height = CONFIG.overworldTileSize * CONFIG.overworldSize; // Match the CSS size
        this.worldMapTerrainRendered = false;

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
        this.drawOrder = [...CONFIG.tileTypes];
        this.drawOrder.splice(CONFIG.roadTileIndex,0,'road');
        this.tileMap = new TileMap(assetManager, this.terrainCanvas, CONFIG.tileSize, this.drawOrder, "terrain_");

        this.overworldDrawOrder = [...CONFIG.overworldTileTypes];        
        this.overworldTileMap = new TileMap(assetManager, this.overworldTerrainCanvas, CONFIG.overworldTileSize, this.overworldDrawOrder, "overworld_");

        this.gameState.debugCanvas.height = window.innerHeight - document.getElementById('uiContainer').offsetHeight;
        this.gameState.debugCanvas.width = window.innerWidth;
        this.playerPreviousPosition = null;
    }
    renderGame() {
        this.gameState.canvas.width = window.innerWidth;
        this.gameState.canvas.height = window.innerHeight - document.getElementById('uiContainer').offsetHeight;
        this.minimapCanvas.width = this.minimapCanvas.width;
        this.worldMapCanvas.width = this.worldMapCanvas.width;

        this.renderTerrain();
        this.renderStaticObjects();
        // Render towns, target circle, minimap, players, npcs, etc.
        this.renderTowns();
        this.renderMinimap();
        this.renderWorldMap();
        this.renderPlayers();
        this.renderTargetCircle();
        this.renderEnemies();
        this.renderFogOfWar();
        this.renderPlayerStats();
        this.renderTargetInfo();
        this.renderView();
        this.renderItems();
        this.renderPath();
        this.renderActiveOnCursor();
        if(true) {
           // this.paintDebug();
        }
    }
    initializeFogOfWar() {
        let fogMap = [];
        for (let y = 0; y < CONFIG.worldSize; y++) {
            fogMap[y] = [];
            for (let x = 0; x < CONFIG.worldSize; x++) {
                fogMap[y][x] = FogTileState.HIDDEN;
            }
        }
        this.fogOfWarMap = fogMap;   
        
        const player = this.gameState.getCurrentPlayer();
        
        this.redrawAffectedFogArea({minX: 0, maxX: CONFIG.worldSize - 1, minY: 0, maxY: CONFIG.worldSize - 1});
        this.playerPreviousPosition = {...player.position};
    }


    renderFogOfWar() {
        const player = this.gameState.getCurrentPlayer();
        if (player && this.playerPreviousPosition !== player.position) {
            const affectedArea = this.updateFogOfWar(player.position, 10);
            this.redrawAffectedFogArea(affectedArea);
            this.playerPreviousPosition = {...player.position};
        }


        this.gameState.context.drawImage(this.fogOfWarCanvas, this.gameState.offsetX, this.gameState.offsetY);
    }

    redrawAffectedFogArea(affectedArea) {
        // Clear the affected area
        this.fogOfWarCtx.clearRect(affectedArea.minX * CONFIG.tileSize, affectedArea.minY * CONFIG.tileSize, (affectedArea.maxX - affectedArea.minX + 1) * CONFIG.tileSize, (affectedArea.maxY - affectedArea.minY + 1) * CONFIG.tileSize);
        const hiddenColor = 'rgba(0, 0, 0, 1)';
        const exploredColor = 'rgba(0, 0, 0, 0.4)'; // Optional: Different color for explored areas

        // Redraw the fog in the affected area
        for (let y = affectedArea.minY; y <= affectedArea.maxY; y++) {
            for (let x = affectedArea.minX; x <= affectedArea.maxX; x++) {
                let tileState = this.fogOfWarMap[y][x];
                if (tileState === FogTileState.HIDDEN) {
                    this.fogOfWarCtx.fillStyle = hiddenColor;
                } else if (tileState === FogTileState.EXPLORED) {
                    this.fogOfWarCtx.fillStyle = exploredColor;
                } else {
                    continue; // Skip rendering for visible tiles
                }
                this.fogOfWarCtx.fillRect(x * CONFIG.tileSize, y * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);
            }
        }

        this.fogOfWarRendered = true;
    }

    updateFogOfWar(playerPosition, viewDistance) {
// Calculate the affected area bounds
        let playerTileX = parseInt(playerPosition.x / CONFIG.tileSize);
        let playerTileY = parseInt(playerPosition.y / CONFIG.tileSize);
        let playerTilePosition = { x: playerTileX, y: playerTileY };
        const affectedArea = this.calculateAffectedArea(playerTilePosition, viewDistance);
        // Update visibility for the current position
        for (let x = playerTileX - viewDistance; x <= playerTileX + viewDistance; x++) {
            for (let y = playerTileY - viewDistance; y <= playerTileY + viewDistance; y++) {
                if (x >= 0 && x < CONFIG.worldSize && y >= 0 && y < CONFIG.worldSize) {
                    this.fogOfWarMap[y][x] = FogTileState.VISIBLE;
                }
            }
        }

        // Update explored tiles
        for (let x = affectedArea.minX; x <= affectedArea.maxX; x++) {
            for (let y = affectedArea.minY; y <= affectedArea.maxY; y++) {
                if (this.fogOfWarMap[y][x] === FogTileState.VISIBLE && !this.isVisibleToPlayer(x, y, playerTilePosition, viewDistance)) {
                    this.fogOfWarMap[y][x] = FogTileState.EXPLORED;
                }
            }
        }
        this.fogOfWarRendered = false;
        return affectedArea;
    }
    calculateAffectedArea(playerTilePosition, viewDistance) {
        const minX = Math.max(Math.min(playerTilePosition.x, this.playerPreviousPosition?.x) - viewDistance, 0);
        const maxX = Math.min(Math.max(playerTilePosition.x, this.playerPreviousPosition?.x) + viewDistance, CONFIG.worldSize - 1);
        const minY = Math.max(Math.min(playerTilePosition.y, this.playerPreviousPosition?.y) - viewDistance, 0);
        const maxY = Math.min(Math.max(playerTilePosition.y, this.playerPreviousPosition?.y) + viewDistance, CONFIG.worldSize - 1);
        
        return { minX, maxX, minY, maxY };
    }
    isVisibleToPlayer(tileX, tileY, playerTilePosition, viewDistance) {
        const dx = playerTilePosition.x - tileX;
        const dy = playerTilePosition.y - tileY;
        return (dx * dx + dy * dy) <= (viewDistance * viewDistance);
    }

    paintDebug() {
        this.gameState.context.drawImage(this.gameState.debugCanvas, 0, 0);
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
        const player = this.gameState.getCurrentPlayer();
        if (player) {
            const halfCanvasWidth = this.gameState.canvas.width / 2;
            const halfCanvasHeight = this.gameState.canvas.height / 2;
            const worldPixelWidth = this.gameState.terrain.map[0].length * CONFIG.tileSize;
            const worldPixelHeight = this.gameState.terrain.map.length * CONFIG.tileSize;
       
            // Calculate the desired center position
            let desiredCenterX = player.position.x + CONFIG.unitSize / 2;
            let desiredCenterY = player.position.y + CONFIG.unitSize / 2;
       
            // Clamp the center position to prevent the viewport from showing out-of-bounds areas
            desiredCenterX = Math.max(halfCanvasWidth, Math.min(desiredCenterX, worldPixelWidth - halfCanvasWidth));
            desiredCenterY = Math.max(halfCanvasHeight, Math.min(desiredCenterY, worldPixelHeight - halfCanvasHeight));
       
        
            // Calculate the top-left corner of the viewport
            this.gameState.offsetX = halfCanvasWidth - desiredCenterX;
            this.gameState.offsetY = halfCanvasHeight - desiredCenterY;
            // Render each layer to its off-screen canvas if not done yet
            if (!this.terrainRendered) {
                let tempTerrain = [];
                for(let i = 0; i < this.gameState.terrain.map.length; i++ ) {
                    tempTerrain[i] = [];
                    for(let j = 0; j < this.gameState.terrain.map[i].length; j++ ) {
                        if( this.gameState.roads.some(roadSegment => 
                            roadSegment.some(roadPos => 
                                roadPos.x === j && roadPos.y === i
                            )
                        )) {
                            tempTerrain[i][j] = CONFIG.roadTileIndex;
                        } else {
                            tempTerrain[i][j] = this.gameState.terrain.map[i][j] + 1;
                            for(let k = 0; k < CONFIG.roadTileIndex; k++ ) {
                                if( tempTerrain[i][j] == k + 1 ) tempTerrain[i][j] = k;
                            }
                        }
                    }
                }

                this.tileMap.load(tempTerrain);
                let minimapWidth = this.minimapCanvas.width;
                let minimapHeight = this.minimapCanvas.height;

                // Draw the terrain canvas onto the minimap canvas, scaling it down
                this.minimapTerrainCtx.drawImage(this.terrainCanvas, 0, 0, this.terrainCanvas.width, this.terrainCanvas.height, 0, 0, minimapWidth, minimapHeight);
                        
               // this.renderRoads();
                this.renderRamps();
                this.terrainRendered = true;
            }
         
        }

        this.gameState.context.drawImage(this.terrainCanvas, this.gameState.offsetX, this.gameState.offsetY);

    }

    updateTree(tree) {
        
        const treeImg = this.assetManager.assets[`tree`]; // Replace with your tree sprite key          
        const treeSize = treeImg.width / 4;
        const treePosX = tree.position.x * CONFIG.tileSize;
        const treePosY = tree.position.y * CONFIG.tileSize;
        this.objectCtx.clearRect(treePosX, treePosY, CONFIG.tileSize, CONFIG.tileSize);     
        const spritePosition = this.getTreeSpritePosition(tree);
        this.renderSprite(this.objectCtx, treeImg, treePosX, treePosY, spritePosition.x * treeSize, spritePosition.y * treeSize, treeSize, false);            

    }
    clearStone(stone) {
    
        const stonePosX = stone.position.x * CONFIG.tileSize;
        const stonePosY = stone.position.y * CONFIG.tileSize;
        this.objectCtx.clearRect(stonePosX, stonePosY, CONFIG.tileSize, CONFIG.tileSize); 
    }

    getTreeSpritePosition(tree){
        return { x: tree.type == 'stump' ? 0 : 1 + (Math.abs(parseInt((Math.sin(tree.position.x) + Math.cos(tree.position.y)) * 5))) % 3, y: Math.max(0, Math.min(3, this.gameState.terrain.map[tree.position.y][tree.position.x] - 1) ) };
    }

    getStoneSpritePosition(stone){
        return { x: (Math.abs(parseInt((Math.sin(stone.position.x) + Math.cos(stone.position.y)) * 3))) % 3, y: Math.max(0, Math.min(3, this.gameState.terrain.map[stone.position.y][stone.position.x] - 1) ) };
    }


    renderStaticObjects() {
        if( !this.objectsRendered ) {
            this.objectCanvas.width = this.objectCanvas.width;
            this.gameState.trees.forEach(tree => {
                // Check if the tree's position overlaps with a road
            //  console.log(1 + (parseInt((Math.sin(tree.position.x) + Math.cos(tree.position.y)) * 5)) % 4);
                const treeImg = this.assetManager.assets[`tree`]; // Replace with your tree sprite key               
                const spritePosition = this.getTreeSpritePosition(tree);
                const treeSize = treeImg.width / 4;
                this.renderSprite(this.objectCtx, treeImg, tree.position.x * CONFIG.tileSize, tree.position.y * CONFIG.tileSize, spritePosition.x * treeSize, spritePosition.y * treeSize, treeSize, false);            
            });

            this.gameState.stones.forEach(stone => {
                // Check if the stone's position overlaps with a road
                const stoneImg = this.assetManager.assets[`stone`]; // Replace with your stone sprite key
                const spritePosition = this.getStoneSpritePosition(stone);
                this.renderSprite(this.objectCtx, stoneImg, stone.position.x * CONFIG.tileSize, stone.position.y * CONFIG.tileSize, spritePosition.x * CONFIG.unitSize, spritePosition.y * CONFIG.unitSize, CONFIG.unitSize, false);            
            });
            this.objectsRendered = true;
        }
       // this.gameState.context.drawImage(this.terrainCanvas, this.gameState.offsetX, this.gameState.offsetY);
        this.gameState.context.drawImage(this.objectCanvas, this.gameState.offsetX, this.gameState.offsetY);
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
                this.renderRoundedRect(this.gameState.context, node.x * CONFIG.tileSize + this.gameState.offsetX + CONFIG.tileSize / 2 - circleSize / 2, node.y * CONFIG.tileSize + this.gameState.offsetY + CONFIG.tileSize / 2 - circleSize / 2, circleSize, circleSize, circleSize / 2, '#e4943a');
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
    
    
        // Render terrain, players, npcs, etc. on the minimap
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

        // Add more rendering logic for other entities like npcs, items, etc.
    }
    renderWorldMap() {
    
    
        // Render terrain, players, npcs, etc. on the minimap
        // Scale down the positions and sizes according to the minimap scale
        // Example: Render players
        if(!this.worldMapTerrainRendered) {
             
            this.overworldTileMap.load(this.gameState.overworldMap);
            this.worldMapTerrainRendered = true;
        }
        this.worldMapCtx.drawImage(this.overworldTerrainCanvas, 0, 0, this.overworldTerrainCanvas.width, this.overworldTerrainCanvas.height, 0, 0, this.worldMapCanvas.width, this.worldMapCanvas.height);
        // const scale = this.worldMapCanvas.width / (this.gameState.overworldMap.length);
        // const position = this.gameState.overworldPosition
        // if( position ) {
        //     const size = scale; // Size of the player square on the minimap
        //     const posX = (position.x * scale) - (size / 2); // Center the square on the player's X position
        //     const posY = (position.y * scale) - (size / 2); // Center the square on the player's Y position
        //     this.worldMapCtx.fillStyle = 'blue'; // Player color
        //     this.worldMapCtx.fillRect(posX, posY, size, size);
        // }    
        // Add more rendering logic for other entities like npcs, items, etc.
    }


    renderPlayers() {
        for (const id in this.gameState.playerManager.players) {
            const player = this.gameState.playerManager.players[id];
            player.render();
            const img = this.assetManager.assets[player.spriteSheetKey];            
            const spritePosition = player.currentSprite;  
            // Adjust the position to center the larger unit image on the tile
            this.renderSprite(this.gameState.context, img, player.position.x + this.gameState.offsetX, player.position.y + this.gameState.offsetY, spritePosition.x, spritePosition.y, CONFIG.unitSize, false); 
           // this.drawDebugHitbox(this.gameState.context, player.position.x, player.position.y);
                          
        }
    }

    renderEnemies() {
        for (const id in this.gameState.npcManager.npcs) {
            const npc = this.gameState.npcManager.npcs[id];
            if( this.fogOfWarMap[npc.position.y][npc.position.x] == FogTileState.VISIBLE ) {
                npc.render();
                const img = this.assetManager.assets[npc.spriteSheetKey];     
                let spritePosition = npc.currentSprite;  
                let unitSize = CONFIG.unitSize;
                if( npc.stats.size ) {
                    unitSize = npc.stats.size;
                }
                if(!spritePosition){
                    spritePosition = {x: 0, y: 0};
                }
                
                // Adjust the position to center the larger unit image on the tile
                this.renderSprite(this.gameState.context, img, npc.position.x, npc.position.y, spritePosition.x, spritePosition.y, unitSize);                         
                this.renderMiniMapImg(this.minimapCanvas, npc.position.x, npc.position.y, unitSize, spritePosition, img, 4);
            //  this.drawDebugHitbox(this.gameState.context, npc.position.x, npc.position.y);
            }
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
                    this.renderSprite(this.gameState.context, buildingImg, building.position.x, building.position.y, CONFIG.unitSize, spritePosition.y, CONFIG.unitSize);
                } else {
                  //  console.log(building.type, 'not found');
                }
           
            });

        });
    }
    renderRamps() {
        this.gameState.ramps.forEach(ramp => {
            // Check if the stone's position overlaps with a road

            const rampImg = this.assetManager.assets[`ramp`]; // Replace with your stone sprite key
            const tileAnalysis = this.tileMap.analyzeTile(ramp.x, ramp.y);
            const rampX = ramp.x * CONFIG.tileSize + CONFIG.unitSize / 2;
            const rampY = ramp.y * CONFIG.tileSize + CONFIG.unitSize / 2;
            if (tileAnalysis.leftLess) {
                this.canvasUtility.rotateImage(rampImg, Math.PI / 2);
                this.terrainCtx.drawImage(this.canvasUtility.canvas, rampX - CONFIG.unitSize, rampY);
            } else if (tileAnalysis.rightLess) {
                this.canvasUtility.rotateImage(rampImg, -Math.PI / 2);
                this.terrainCtx.drawImage(this.canvasUtility.canvas, rampX + CONFIG.unitSize, rampY);
            } else if (tileAnalysis.botLess) {
                this.terrainCtx.drawImage(rampImg, rampX, rampY + CONFIG.unitSize);
            } else if (tileAnalysis.topLess) {
                this.canvasUtility.flipImageVertical(rampImg);
                this.terrainCtx.drawImage(this.canvasUtility.canvas, rampX, rampY - CONFIG.unitSize);
                //transformedImageData = this.canvasUtility.drawImage(rampImg); // Assuming you want to flip horizontally for topLess
            }
        
        });
    }
    renderRoads() {

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
            this.renderHealthBar(10, this.gameState.canvas.height - 30, 200, 20, parseInt(healthPercentage));
            // this.gameState.context.fillStyle = 'black';
            // this.gameState.context.fillText(`Level: ${player.stats.level} Health: ${player.stats.health}`, 10, this.gameState.canvas.height - 10);            
            const expPercentage = player.stats.experience / player.stats.next_level_exp;
            this.renderExperienceBar(10, this.gameState.canvas.height - 50, 200, 10, parseInt(expPercentage));    

            let faction = this.gameState.getCurrentPlayer().faction;
            document.getElementById('player-resources-wood').innerHTML = this.gameState.factions[faction].resources.wood;
            document.getElementById('player-resources-stone').innerHTML = this.gameState.factions[faction].resources.stone;            
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
                        this.gameState.npcManager.npcs[this.gameState.selectedTarget.id];

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

    renderView() {return;
        let player = this.gameState.getCurrentPlayer();
        if(player){
            let tileType = this.gameState.terrain.map[player.position.y][player.position.x];

            let variation = parseInt(((player.position.x + player.position.y) / 10) % 2 + 1);
            let buildingType = this.gameState.getBuildingTypeAtCurrentTile();
            if(buildingType){
                let buildingBg = this.assetManager.assets[`${buildingType.type}_bg_${variation}`];
                if( buildingBg ) {
                    this.viewCtx.drawImage(buildingBg, 0, 0);         
                }
            } else if(player.isOnRoad) { 
                let bg = this.assetManager.assets[`road_bg_1`]
                if( bg ) {
                    this.viewCtx.drawImage(bg, 0, 0);
                }
            } else {
                let bg = this.assetManager.assets[`${CONFIG.tileTypes[tileType]}_bg_${variation}`]
                if( bg ) {
                    this.viewCtx.drawImage(bg, 0, 0);
                }
            }
            const posX = this.viewCanvas.width / 2;
            const posY = this.viewCanvas.height - 30;
            
            // Set text style
            this.viewCtx.fillStyle = 'white';
            this.viewCtx.font = '12px Arial';
            this.viewCtx.textAlign = 'center';
            this.viewCtx.textBaseline = 'middle';

          //  this.viewCtx.fillText(`${CONFIG.tileTypes[tileType]} - ${buildingType ? buildingType.type : 'none'}`, posX, posY);
            
        }
    }


    renderTargetCircle() {
        if (this.gameState.selectedTarget) {
            let target;
            if (this.gameState.selectedTarget.type === 'player') {
                target = this.gameState.playerManager.players[this.gameState.selectedTarget.id];
            } else if (this.gameState.selectedTarget.type === 'npc') {
                target = this.gameState.npcManager.npcs[this.gameState.selectedTarget.id];
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

               
            let key = `${item.item_type}_${item.type}`;
            const itemImg = this.assetManager.assets[key]; // Path to your sprite sheet
            const itemX = item.position.x;
            const itemY = item.position.y;

            const spritePosition = { x: 0, y: 0};
            // Check if the potion's position is within the canvas bounds
            if (itemX >= 0 && itemX <= this.gameState.canvas.width && itemY >= 0 && itemY <= this.gameState.canvas.height) {
                this.renderSprite(this.gameState.context, itemImg, itemX, itemY, spritePosition.x, spritePosition.y, itemImg.width);
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

    renderActiveOnCursor() {
        const item = this.gameState.activeOnCursor;
        if( item ) {
            let key = `${item.name}`;
            const itemImg = this.assetManager.assets[key]; // Path to your sprite sheet
            if( itemImg ) {
                const buildX = this.gameState.cursorTileX;
                const buildY = this.gameState.cursorTileY;
            
                const spritePosition = { x: 0, y: 0 };
                // Check if the cursor's position is within the canvas bounds
                this.renderSprite(this.gameState.context, itemImg, buildX, buildY, spritePosition.x, spritePosition.y, CONFIG.unitSize);
            }
        }
    }

    gameLoop() {
        this.renderGame();
        requestAnimationFrame(() => this.gameLoop());
    }
    buildTechTree(){
        let techTreeContainer = document.getElementById('build-menu');
        this.gameState.techTree.forEach((item) => {
            const buildElement = document.createElement('div');
            buildElement.className = 'build-item';
    
            const itemElement = document.createElement('div');
            itemElement.className = 'build-item-image';
    
            const nameElement = document.createElement('span');
            nameElement.innerText = `${item.name}`;
            nameElement.className = 'build-item-name';
    
            let key = `${item.name}`;
            const sprite = this.assetManager.assets[key];
            if (sprite) {
                itemElement.style.backgroundImage = `url('${sprite.src}')`;
                buildElement.appendChild(itemElement)
                buildElement.appendChild(nameElement)
    
                const requiresElement = document.createElement('div');
                requiresElement.className = 'build-item-requirements';
                let faction = this.gameState.getCurrentPlayer().faction;
                item.requires.forEach((requirement) => {
                    const amountElement = document.createElement('span');
                    amountElement.innerText = `${requirement.amount} ${requirement.type}`;
                    amountElement.className = 'build-item-requirement';
                    
                    if (!(requirement.type in this.gameState.factions[faction].resources) || this.gameState.factions[faction].resources[requirement.type] < requirement.amount) {
                        amountElement.classList.add('missing-resource'); // Highlight missing resource
                    }
    
                    requiresElement.appendChild(amountElement);
                });
                buildElement.appendChild(requiresElement);
    
                if (this.canAfford(item)) {
                    buildElement.onclick = () => {
                        this.gameState.activateBuildStructure(item);
                    };
                } else {
                    buildElement.classList.add('unaffordable');
                    buildElement.onclick = null;
                }
    
                techTreeContainer.appendChild(buildElement);
            } else {
               // console.log(`${key} asset not found`);
            }
        });
    }
    init() {      
        this.buildTechTree();
        this.initializeFogOfWar();
        this.gameLoop();
    }
    
    canAfford(item) {
        let faction = this.gameState.getCurrentPlayer().faction;
        const resources = this.gameState.factions[faction].resources;
        return item.requires.every(requirement => {
            return (requirement.type in resources) && (resources[requirement.type] >= requirement.amount);
        });
    }
    
    updateTechTree() {
        // Clear the current tech tree
        document.getElementById('build-menu').innerHTML = '';
        // Reinitialize the tech tree
        this.buildTechTree();
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
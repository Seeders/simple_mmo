import PlayerManager from './PlayerManager';
import EnemyManager from './EnemyManager';
import Terrain from './Terrain';
import RenderManager from './RenderManager';
import Pathfinding from './Utility/Pathfinding';
import { CONFIG } from './config';

export default class GameState {
    constructor(context, assetManager) {
        this.context = context;
        this.canvas = context.canvas;
        this.debugCanvas = document.createElement('canvas');
        this.debugCtx = this.debugCanvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.assetManager = assetManager;
        this.playerManager = new PlayerManager(this);
        this.enemyManager = new EnemyManager(this);
        this.terrain = null;
        this.combatLog = [];
        this.roads = [];
        this.items = {};
        this.towns = [];
        this.ramps = [];
        this.trees = [];
        this.stones = [];
        this.chats = [];
        this.selectedTarget = null;
        this.currentPlayerId = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.renderManager = new RenderManager(this, assetManager);    
        this.terrainCosts = [20, 10, 5, 10, 10, 1, 0, 0, 0];    
        this.playerMoved = true;
        this.techTree = {};
        this.activeOnCursor = null;
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorTileX = 0;
        this.cursorTileY = 0;
    }

    init(data) {
        this.currentPlayerId = data.id;
        this.terrain = new Terrain(data.terrain);
        this.towns = data.towns;
        this.towns.forEach((town) => {
            town.center = { x: town.center[0], y: town.center[1] };
        });
        this.roads = data.roads;
        this.trees = data.trees;
        this.ramps = data.ramps;
        this.stones = data.stones;
        this.techTree = data.tech_tree;

        this.playerManager.initPlayers(data.players);
        this.enemyManager.initEnemies(data.enemies);
        this.renderManager.init();
        this.adjustViewToCurrentPlayer();        
    }
    
    getTerrainCost(position) {
        let cost = this.terrainCosts[this.terrain.map[position.y][position.x]] ;
 
        return 1 / ((cost + 1) / 3);
   
    }
    buildActiveItem() {
        const buildX = this.cursorTileX;
        const buildY = this.cursorTileY;
        window.game.networkManager.send('item_built', {                        
            playerId: this.currentPlayerId,
            item: this.activeOnCursor, // Assuming the ID is prefixed with 'item-'
            position: { x: buildX, y: buildY }, // Send the slot ID to the server as well
            faction: 0
        });
        this.activeOnCursor = null;
    }
    activateBuildStructure(item) {
        this.activeOnCursor = item;
    }
    findPath(start, goal) {
        this.debugCanvas.width = this.debugCanvas.width;
        let type1 = "forest";
        let type2 = "grass";
        if( CONFIG.tileTypes[this.terrain.map[start.y][start.x]] == "forest" ) {
            type1 = "grass";
            type2 = "forest";
        }
        let tempTerrain = [];
        for (let i = 0; i < this.terrain.map.length; i++) {
            tempTerrain[i] = [];
            for (let j = 0; j < this.terrain.map[i].length; j++) {
                tempTerrain[i][j] = this.terrain.map[i][j];
        
                // Check if the current tile is a forest tile
                if (CONFIG.tileTypes.length > tempTerrain[i][j] && CONFIG.tileTypes[tempTerrain[i][j]] === type1) {
                    // Check the neighboring tiles in cardinal directions
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            // Skip diagonal neighbors and the current tile itself
                            if (Math.abs(dx) === Math.abs(dy)) {
                                continue;
                            }
                
                            // Ensure we don't go out of bounds
                            if (i + dx >= 0 && i + dx < this.terrain.map.length && j + dy >= 0 && j + dy < this.terrain.map[i].length) {
                                // Check if the neighboring tile is grass
                                if (CONFIG.tileTypes[this.terrain.map[i + dx][j + dy]] === type2) {
                                    tempTerrain[i][j] = 8; // Update the current tile type to 8
                                   // this.renderManager.renderRoundedRect(this.debugCtx, (j) * CONFIG.tileSize + this.offsetX, (i) * CONFIG.tileSize + this.offsetY, CONFIG.tileSize, CONFIG.tileSize, 2, 'red');
                                    break; // No need to check other neighbors once we find grass
                                }
                            }
                        }
                        if (tempTerrain[i][j] === 8) {
                            break; // Break the outer loop as well if we've updated the tile
                        }
                    }
                }
                
            }
        }
        for(let i = 0; i < this.ramps.length; i++) {
            let ramp = this.ramps[i];
            tempTerrain[ramp.y][ramp.x] = CONFIG.tileTypes.indexOf("forest"); 
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    // Skip diagonal neighbors and the current tile itself
                    if (Math.abs(dx) === Math.abs(dy)) {
                        continue;
                    }
        
                    // Ensure we don't go out of bounds
                    if (ramp.y + dx >= 0 && ramp.y + dx < this.terrain.map.length && ramp.x + dy >= 0 && ramp.x + dy < this.terrain.map[ramp.y].length) {
                        // Check if the neighboring tile is grass
                        if (CONFIG.tileTypes[this.terrain.map[ramp.y + dx][ramp.x + dy]] === "grass") {
                            tempTerrain[ramp.y + dx][ramp.x + dy] = CONFIG.tileTypes.indexOf("grass"); // Update the current tile type to 8

                          //  this.renderManager.renderRoundedRect(this.debugCtx, (ramp.x + dy) * CONFIG.tileSize + this.offsetX, (ramp.y + dx) * CONFIG.tileSize + this.offsetY, CONFIG.tileSize, CONFIG.tileSize, 2, 'green');
                        }
                    }
                }
            }
        }
        for(let i = 0; i < this.roads.length; i++) {
            for(let j = 0; j < this.roads[i].length; j++) {
                let road = this.roads[i][j];
                tempTerrain[road.y][road.x] = 5;
            }
        }
        
        for(let i = 0; i < this.trees.length; i++) {
            let tree = this.trees[i];
            if(tree.type != 'stump') {
                tempTerrain[tree.position.y][tree.position.x] = 6;            
            }
        }
        for(let i = 0; i < this.stones.length; i++) {
            let stone = this.stones[i];
            tempTerrain[stone.position.y][stone.position.x] = 7;           
        }
        
        let pathfinding = new Pathfinding(tempTerrain, this.terrainCosts);
        let path = pathfinding.aStar(start, goal);
        
        return path;
    }
    adjustViewToCurrentPlayer() {
        let player = this.getCurrentPlayer();
        if (player) {
            this.offsetX = this.canvas.width / 2 - player.position.x * CONFIG.tileSize;
            this.offsetY = this.canvas.height / 2 - player.position.y * CONFIG.tileSize;
        }
    }

    getCurrentPlayer() {
        return this.playerManager.getPlayer(this.currentPlayerId);
    }

    receiveChat(data) {
        this.chats.push(data);
        window.game.chatUI.addChatMessage(data);
    }

    combatUpdate(data) {
        if (data.unitType == "player") {
            let player = this.playerManager.getPlayer(data.unitId);
            if (player) {
                player.stats.health = data.unitHealth;
            }
            if(data.targetType == "unit") {
                let target = this.enemyManager.getEnemy(data.targetId);
                if (target) {
                    target.stats.health = data.targetHealth;
                    this.selectedTarget = { type: 'enemy', id: target.id, stats: target.stats };
                    if ( target.stats.health <= 0) {
                        this.enemyManager.removeEnemy(target.id);
                    }
                }
            }
        } else if( data.unitType == "unit" ) {
            if (data.unitFaction == 1) {
                let player = this.playerManager.getPlayer(data.targetId);
                if (player) {
                    player.stats.health = data.targetHealth;
                }
                let target = this.enemyManager.getEnemy(data.unitId);
                if (target) {
                    target.stats.health = data.unitHealth;
                    this.selectedTarget = { type: 'enemy', id: data.unitId, stats: target.stats };
                }
            }
        } else if( data.unitType == "structure" ) {
            if (data.unitFaction == 0) {
                let building = this.towns[data.unitFaction].layout[data.unitId];
                if (building) {
                    building.stats.health = data.unitHealth;
                }
                let target = this.enemyManager.getEnemy(data.targetId);
                if (target) {
                    target.stats.health = data.targetHealth;
                    this.selectedTarget = { type: 'enemy', id: target.id, stats: target.stats };
                }
            } else if (data.unitFaction == 1) {
                if(data.targetType == "player"){
                    let player = this.playerManager.getPlayer(data.targetId);
                    if (player) {
                        player.stats.health = data.targetHealth;
                    }
                } else if(data.targetType == "unit"){
                   
                } else if(data.targetType == "structure"){
                    let target = this.towns[data.targetFaction].layout[data.targetId];
                    if (target) {
                        target.stats.health = data.targetHealth;
                    }
                }
                let building = this.towns[data.unitFaction].layout[data.unitId];
                if (building) {
                    building.stats.health = data.unitHealth;
                }
            }
        }
    }

    combatLogUpdate(data) {
        this.combatLog = data.combatLog;
        window.game.combatLogUI.updateCombatLog(data.combatLog);
    
    }

    playerRespawn(data) {
        if (data.playerId === this.currentPlayerId) {
            // If the current player has respawned, update their position and health
            let player = this.getCurrentPlayer();
            if (player) {
                player.position = data.position;
                player.stats.health = data.health;
                // Adjust the offset to center the view on the player's new position
                this.offsetX = this.canvas.width / 2 - player.position.x * CONFIG.tileSize;
                this.offsetY = this.canvas.height / 2 - player.position.y * CONFIG.tileSize;
            }
        } else {
            // If another player has respawned, just update their position and health
            let player = this.playerManager.getPlayer(data.playerId);
            if (player) {
                player.position = data.position;
                player.stats.health = data.health;
            }
        }
    }
    
    updateTrees(data) {
        this.trees = data.trees;
       // this.renderManager.terrainRendered = false;
    }
    updateStones(data) {
        this.stones = data.stones;
       // this.renderManager.terrainRendered = false;
    }
    updateTowns(data) {
        this.towns = data.towns;
        this.towns.forEach((town) => {
            town.center = { x: town.center[0], y: town.center[1] };
        });
       // this.renderManager.terrainRendered = false;
    }
    levelUp(data) {
        this.playerManager.playerLevelUp(data.playerId, data);
    }

    targetDeath(data) {
        if( data.targetType == "unit" ) {
            this.enemyManager.removeEnemy(data.targetId);
           // if (data.unitType == "player") {
                //let player =  this.playerManager.getPlayer(data.unitId);
                // if (player) {
                //     player.stats.experience = data.experience;
                //     player.stats.level = data.level;
                //     player.stats.next_level_exp = data.next_level_exp;
                // }
           // }
        } else if( data.targetType == "structure" ) {
            delete this.towns[data.targetFaction].layout[data.targetId];
            this.enemyManager.removeEnemy(data.targetId);
            //if (data.unitType == "player") {
               // let player =  this.playerManager.getPlayer(data.unitId);
                // if (player) {
                //     player.stats.experience = data.experience;
                //     player.stats.level = data.level;
                //     player.stats.next_level_exp = data.next_level_exp;
                // }
           // }
        }
    }    
    
    enemyMove(data) {
        let enemy = this.enemyManager.getEnemy(data.enemyId);
        if (enemy) {
            enemy.position = data.position
        }
    }
    // Add an item to the game state
    addItem(itemData) {
        this.items[itemData.itemId] = itemData.item;
    }
    
    // Remove an item from the game state
    removeItem(itemId) {
        delete this.items[itemId];
    }
    
    itemPickup(data) {
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                let item = this.items[data.itemId];
                if(item){
                    player.addItemToInventory(item);
                    delete this.items[data.itemId];
                }
            }
        }
        // Assuming there is a method to remove the item from the game world
        // this.removeItemFromWorld(data.itemId);
    }

    potionUsed(data) {
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.stats.health = data.newHealth;
                player.removeItemFromInventory(data.potionId);
            }
        }
    }
    isPlayerOnRoad() {
        const player = this.getCurrentPlayer();
        if (!player) {
            return false; // Player not found or invalid playerId
        }

        const playerPos = player.position;

        // Check if the player's position matches any position in the roads array
        return this.roads.some(roadSegment => 
            roadSegment.some(roadPos => 
                roadPos.x === playerPos.x && roadPos.y === playerPos.y
            )
        );
    }
    isPlayerInTown() {
        const player = this.getCurrentPlayer();
        if (!player) {
            return false; // Player not found or invalid playerId
        }

        const playerPos = player.position;

        // Check if the player's position matches any position in the roads array
        return this.towns.some(townPos => 
            townPos.x === playerPos.x && townPos.y === playerPos.y
        );    
    }
    
    getBuildingTypeAtCurrentTile() {
        const player = this.getCurrentPlayer();
        if (!player) {
            return false; // Player not found or invalid playerId
        }

        const playerPos = player.position;
        let building = null;
        // Check if the player's position matches any position in the roads array
        this.towns.forEach((town) => {
            town.layout.forEach((_building) => {
                if(_building.position.x === playerPos.x && _building.position.y === playerPos.y){
                    building = _building;                    
                }
            });
        });    
        return building;
    }

    updateResource(data) {
        
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.removeItemFromInventory(data.itemId);
                player.stats.resources[data.resourceType] = data.newValue;
                this.renderManager.updateTechTree();
            }
        }
    }

    updatePlayerResources(data) {
        
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.stats.resources = data.resources;
                this.renderManager.updateTechTree();
            }
        }
    }

    healthRegeneration(data) {
        let player = this.playerManager.getPlayer(data.playerId);
        if (player) {
            player.stats.health = parseInt(data.newHealth);
        }
    }

    healthRegeneration(data) {
        if( data.playerId ) {
            let player = this.playerManager.getPlayer(data.playerId);
            if (player) {
                player.stats.health = parseInt(data.newHealth);
            }
        } else if( data.enemyId ) {
            let enemy = this.enemyManager.getEnemy(data.enemyId);
            if (enemy) {
                enemy.stats.health = parseInt(data.newHealth);
            }

        }
    }
    // Additional methods for managing and querying the game state can be added here
}

import PlayerManager from './PlayerManager';
import EnemyManager from './EnemyManager';
import Terrain from './Terrain';
import RenderManager from './RenderManager';
import Pathfinding from './Utility/Pathfinding';
import { CONFIG } from './config';

export default class GameState {
    constructor(context, debugCanvas, assetManager) {
        this.context = context;
        this.canvas = context.canvas;
        this.canvas.width = window.innerWidth;
        this.debugCanvas = debugCanvas;
        this.assetManager = assetManager;
        this.playerManager = new PlayerManager(this);
        this.enemyManager = new EnemyManager(this);
        this.terrain = null;
        this.combatLog = [];
        this.roads = [];
        this.items = {};
        this.towns = [];
        this.trees = [];
        this.chats = [];
        this.selectedTarget = null;
        this.currentPlayerId = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.renderManager = new RenderManager(this, assetManager);    
        this.terrainCosts = [20, 10, 5, 10, 10, 1, 0];    
    }

    init(data) {
        this.currentPlayerId = data.id;
        this.terrain = new Terrain(data.terrain);
        this.towns = data.towns;
        this.roads = data.roads;
        this.trees = data.trees;
     
        this.playerManager.initPlayers(data.players);
        this.enemyManager.initEnemies(data.enemies);
        this.adjustViewToCurrentPlayer();
    }
    getTerrainCost(position) {
        let cost = this.terrainCosts[this.terrain.map[position.y][position.x]] ;
 
        return 1 / ((cost + 1) / 3);
   
    }
    findPath(start, goal) {
        let tempTerrain = [];
        for(let i = 0; i < this.terrain.map.length; i++) {
            tempTerrain[i] = [];
            for(let j = 0; j < this.terrain.map[i].length; j++) {
                tempTerrain[i][j] = this.terrain.map[i][j];
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
        console.log(start, goal);
        let pathfinding = new Pathfinding(tempTerrain, this.terrainCosts);
        let path = pathfinding.aStar(start, goal);
        console.log(path);
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
        if (data.playerId) {
            let player = this.playerManager.getPlayer(data.playerId);
            if (player) {
                player.stats.health = data.playerHealth;
            }
        }
        if (data.enemyId) {
            let enemy = this.enemyManager.getEnemy(data.enemyId);
            if (enemy) {
                enemy.stats.health = data.enemyHealth;
                this.selectedTarget = { type: 'enemy', id: data.enemyId, stats: enemy.stats };
                if (data.enemyHealth <= 0) {
                    this.enemyManager.removeEnemy(data.enemyId);
                }
            }
        }
    }

    combatLogUpdate(data) {
        if (data.playerId === this.currentPlayerId) {
            this.combatLog = data.combatLog;
            window.game.combatLogUI.updateCombatLog(data.combatLog);
        }
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

    levelUp(data) {
        this.playerManager.playerLevelUp(data.playerId, data);
    }

    enemyDeath(data) {
        this.enemyManager.removeEnemy(data.enemyId);
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.stats.experience = data.experience;
                player.stats.level = data.level;
                player.stats.next_level_exp = data.next_level_exp;
            }
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
    updateResource(data) {
        
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.removeItemFromInventory(data.itemId);
                player.resources[data.resourceType] = data.newValue;
                console.log(`Player has ${data.newValue} ${data.resourceType}`);
            }
        }
    }

    healthRegeneration(data) {
        let player = this.playerManager.getPlayer(data.playerId);
        if (player) {
            player.stats.health = parseInt(data.newHealth);
        }
    }
    // Additional methods for managing and querying the game state can be added here
}

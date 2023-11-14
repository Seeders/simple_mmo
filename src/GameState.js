import PlayerManager from './PlayerManager';
import EnemyManager from './EnemyManager';
import Terrain from './Terrain';
import RenderManager from './RenderManager';
import { CONFIG } from './config';

export default class GameState {
    constructor(context, debugCanvas, assetManager) {
        this.context = context;
        this.canvas = context.canvas;
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
        this.renderManager.terrainRendered = false;
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

    healthRegeneration(data) {
        let player = this.playerManager.getPlayer(data.playerId);
        if (player) {
            player.stats.health = data.newHealth;
        }
    }
    // Additional methods for managing and querying the game state can be added here
}

import { CONFIG } from './config';
import Player from './Player';
import RenderManager from './RenderManager';
// GameState.js
export default class GameState {
    constructor(context, assetManager) {
        this.context = context;
        this.canvas = context.canvas;
        this.players = {};
        this.enemies = {};
        this.items = {};
        this.terrain = [];
        this.combatLog = [];
        this.chats = [];
        this.selectedTarget = null;
        this.currentPlayerId = null;
        this.offsetX = 0;
        this.offsetY = 0;      
        this.renderManager = new RenderManager(this, assetManager);  
    }

    // Initialize the game state with data from the server
    init(data) {
        this.currentPlayerId = data.id;
        this.terrain = data.terrain;
        for (const player of data.players) {
            this.addPlayer({id: player.id, color: player.color, position: player.position, stats: player.stats});
        }
        for (const enemy of data.enemies) {
            this.enemies[enemy.id] = {color: 'red', position: enemy.position, stats: enemy.stats};
        }
        let player = this.getCurrentPlayer();
        if( player ) {
            this.offsetX = this.canvas.width / 2 - player.position.x * CONFIG.tileSize;
            this.offsetY = this.canvas.height / 2 - player.position.y * CONFIG.tileSize;
        }
    }

    drawGame() {
        this.renderManager.renderGame(this);
    }


    healthRegeneration(data) {
        let player = this.getPlayer(data.playerId)
        if (player) {
            player.stats.health = data.newHealth;
        }
    }

    // Update the position of a player
    updatePlayerPosition(playerId, newPosition) {
        if (this.players[playerId]) {
            this.players[playerId].position = newPosition;
        }
    }

    // Remove a player from the game state
    removePlayer(playerId) {
        delete this.players[playerId];
    }

    // Add a new player to the game state
    addPlayer(playerData) {
        this.players[playerData.id] = new Player(playerData);
    }

    levelUp(data){
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if (player) {
                player.stats.level = data.level;
                player.stats.max_health = data.max_health;
                player.stats.health = data.health;
                player.stats.next_level_exp = data.next_level_exp;
            }
        }
    }

    enemyDeath(data){
        if (data.playerId === this.currentPlayerId) {
            // Update player's experience and level
            let player = this.getCurrentPlayer();
            player.stats.experience = data.experience;
            player.stats.level = data.level;
            player.stats.next_level_exp = data.next_level_exp;
        }
        // Remove the enemy from the game
        delete this.enemies[data.enemyId];
    }
    // Update the state of an enemy
    updateEnemy(enemyId, enemyData) {
        if (this.enemies[enemyId]) {
            this.enemies[enemyId].update(enemyData);
        } else {
            this.enemies[enemyId] = new Enemy(enemyData);
        }
    }

    // Remove an enemy from the game state
    removeEnemy(enemyId) {
        delete this.enemies[enemyId];
    }

    // Add an item to the game state
    addItem(itemData) {
        this.items[itemData.itemId] = itemData.item;
    }

    // Remove an item from the game state
    removeItem(itemId) {
        delete this.items[itemId];
    }

    itemPickup(data){
        if (data.playerId === this.currentPlayerId) {
            let player = this.getCurrentPlayer();
            if(player){    
            // Add the item to the player's inventory
                player.addItemToInventory(this.items[data.itemId]);
            }
        }
        this.removeItem(data.itemId);	
    }

    potionUsed(data) {
        if(data.playerId === this.currentPlayerId) { // Assuming playerId is the current player's ID
            let player = this.getCurrentPlayer();
            if( player ) {
                player.stats['health'] = data.newHealth; // Update the player's health on the UI
                player.removeItemFromInventory(data.potionId);
            }
        }
    }

    // Get the current player's state
    getCurrentPlayer() {
        return this.players[this.currentPlayerId];
    }

    // Get a player by ID
    getPlayer(playerId) {
        return this.players[playerId];
    }

    // Get an enemy by ID
    getEnemy(enemyId) {
        return this.enemies[enemyId];
    }

    // Get an item by ID
    getItem(itemId) {
        return this.items[itemId];
    }

    // Get the terrain data
    getTerrain() {
        return this.terrain;
    }

    receiveChat(data){        
        this.chats.push(data);
        window.game.chatUI.addChatMessage(data);
    }

    combatUpdate(data){
        // Handle combat updates
        if (data.playerId) {
            this.getPlayer(data.playerId).stats.health = data.playerHealth;
        }
        if (data.enemyId && this.enemies[data.enemyId]) {
            this.enemies[data.enemyId].stats.health = data.enemyHealth;
            if (data.enemyHealth <= 0) {
                delete this.enemies[data.enemyId];
            }
        }
    }

    combatLogUpdate(data) {
        if( data.playerId === this.currentPlayerId) {
            // Update the combat log with the new entries
            this.combatLog = data.combatLog;
            window.game.combatLogUI.updateCombatLog(data.combatLog);
        }
    }

    playerRespawn(data){
        if (data.playerId === this.currentPlayerId) {
            // If the current player has respawned, update their position and health
            let player = this.getCurrentPlayer()
            if(player){
                player.position = data.position;
                player.stats.health = data.health;
                // Adjust the offset to center the view on the player's new position
                this.offsetX = this.canvas.width / 2 - player.position.x * CONFIG.tileSize;
                this.offsetY = this.canvas.height / 2 - player.position.y * CONFIG.tileSize;
            }
        } else {
            // If another player has respawned, just update their position and health
            let player = this.getPlayer(data.playerId);
            if (player) {
                player.position = data.position;
                player.stats.health = data.health;
            }
        }
    }

    // ... Additional methods to manage and query the game state ...
}

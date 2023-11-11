import Player from './Player';

class PlayerManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.players = {};
    }

    // Initialize players from provided data
    initPlayers(playerDataArray) {
        playerDataArray.forEach(playerData => {
            this.addPlayer(playerData);
        });
    }

    // Add a new player to the game state
    addPlayer(playerData) {
        if (!this.players[playerData.id]) {
            this.players[playerData.id] = new Player(this.gameState, playerData);
        }
    }

    // Update an existing player's state
    updatePlayer(playerId, playerData) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.update(playerData);
        } else {
            this.addPlayer(playerData); // Add the player if it doesn't exist
        }
    }

    // Remove a player from the game state
    removePlayer(playerId) {
        if (this.players[playerId]) {
            delete this.players[playerId];
        }
    }

    // Get a player by their ID
    getPlayer(playerId) {
        return this.players[playerId];
    }

    // Handle player respawn
    playerRespawn(playerId, respawnData) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.respawn(respawnData);
        }
    }

    // Handle player level up
    playerLevelUp(playerId, levelUpData) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.levelUp(levelUpData);
        }
    }

    // Additional methods for player management can be added here
}

export default PlayerManager;

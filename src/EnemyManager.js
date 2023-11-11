import Enemy from './Enemy';

class EnemyManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.enemies = {};
    }

    // Initialize enemies from provided data
    initEnemies(enemyDataArray) {
        enemyDataArray.forEach(enemyData => {
            this.addEnemy(enemyData);
        });
    }

    // Add a new enemy to the game state
    addEnemy(enemyData) {
        if (!this.enemies[enemyData.id]) {
            this.enemies[enemyData.id] = new Enemy(this.gameState, enemyData);
        }
    }

    // Update an existing enemy's state
    updateEnemy(enemyId, enemyData) {
        const enemy = this.getEnemy(enemyId);
        if (enemy) {
            enemy.update(enemyData);
        } else {
            this.addEnemy(enemyData); // Add the enemy if it doesn't exist
        }
    }

    // Remove an enemy from the game state
    removeEnemy(enemyId) {
        if (this.enemies[enemyId]) {
            delete this.enemies[enemyId];
        }
    }

    // Get an enemy by its ID
    getEnemy(enemyId) {
        return this.enemies[enemyId];
    }

    // Handle enemy death
    enemyDeath(enemyId) {
        // Additional logic can be added here, such as updating the game state or player stats
        this.removeEnemy(enemyId);
    }

    // Additional methods for enemy management can be added here
}

export default EnemyManager;

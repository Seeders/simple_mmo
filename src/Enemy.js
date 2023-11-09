// Enemy.js
export default class Enemy {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.position = data.position;
        this.stats = {
            health: data.stats.health,
            max_health: data.stats.max_health,
            attackPower: data.stats.attackPower,
            defense: data.stats.defense,
            // ... other stats like speed, experience value, etc.
        };
        this.alive = true;
    }

    // Update the enemy's state
    update(data) {
        this.position = data.position || this.position;
        this.stats.health = data.stats.health || this.stats.health;
        this.stats.max_health = data.stats.max_health || this.stats.max_health;
        this.stats.attackPower = data.stats.attackPower || this.stats.attackPower;
        this.stats.defense = data.stats.defense || this.stats.defense;
        // ... update other stats as necessary
        this.checkAlive();
    }

    // Check if the enemy is still alive
    checkAlive() {
        if (this.stats.health <= 0) {
            this.alive = false;
        }
    }

    // Method to handle the enemy's attack
    attack(target) {
        // Calculate damage based on enemy's attack power and target's defense
        const damage = Math.max(this.stats.attackPower - target.stats.defense, 0);
        target.receiveDamage(damage);
        return damage;
    }

    // Method to handle receiving damage
    receiveDamage(amount) {
        this.stats.health -= amount;
        this.checkAlive();
    }

    // Method to respawn the enemy with full health
    respawn() {
        this.stats.health = this.stats.max_health;
        this.alive = true;
    }

    // ... Additional methods for enemy behavior ...
}

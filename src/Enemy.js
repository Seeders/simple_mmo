// Enemy.js
export default class Enemy {
    constructor(data) {
        this.id = data.id;
        this.type = data.stats.type;
        this.name = data.stats.name;
        this.position = data.position;
        this.stats = {
            health: data.stats.health,
            max_health: data.stats.max_health,
            damage: data.stats.damage,
            defense: data.stats.defense,
            level: data.stats.level,
            // ... other stats like speed, experience value, etc.
        };
        this.alive = true;
    }

    // Update the enemy's state
    update(data) {
        this.position = data.position || this.position;
        this.type = data.type || this.type;
        this.stats.health = data.stats.health || this.stats.health;
        this.stats.max_health = data.stats.max_health || this.stats.max_health;
        this.stats.damage = data.stats.damage || this.stats.damage;
        this.stats.defense = data.stats.defense || this.stats.defense;
        this.stats.level = data.stats.level || this.stats.level;
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
        const damage = Math.max(this.stats.damage - target.stats.defense, 0);
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

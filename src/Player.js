// Player.js
export default class Player {
    constructor(data) {
        console.log(`Creating player with ${data}`);
        this.id = data.id;
        this.name = data.id;
        this.position = data.position;
        this.stats = {
            health: data.stats.health,
            max_health: data.stats.max_health,
            attackPower: data.stats.attackPower,
            defense: data.stats.defense,
            experience: data.stats.experience,
            next_level_exp: data.stats.next_level_exp,
            level: data.stats.level,
            // ... other stats like mana, speed, etc.
        };
        this.inventory = data.inventory || [];
    }

    // Update the player's state
    update(data) {
        this.position = data.position || this.position;
        this.stats.health = data.stats.health || this.stats.health;
        this.stats.max_health = data.stats.max_health || this.stats.max_health;
        this.stats.attackPower = data.stats.attackPower || this.stats.attackPower;
        this.stats.defense = data.stats.defense || this.stats.defense;
        this.stats.experience = data.stats.experience || this.stats.experience;
        this.stats.next_level_exp = data.stats.next_level_exp || this.stats.next_level_exp;
        this.stats.level = data.stats.level || this.stats.level;
        // ... update other stats and inventory as necessary
    }

    addItemToInventory(itemData){
        this.inventory.push(itemData);
        window.game.inventoryUI.addItemToInventory(itemData);
    }

    removeItemFromInventory(itemId){
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.inventory.splice(itemIndex, 1);
            window.game.inventoryUI.removeItemFromInventory(itemId);
        }
    }
    // Method to handle the player's attack
    attack(target) {
        // Calculate damage based on player's attack power and target's defense
        const damage = Math.max(this.stats.attackPower - target.stats.defense, 0);
        target.receiveDamage(damage);
        return damage;
    }

    // Method to handle receiving damage
    receiveDamage(amount) {
        this.stats.health -= amount;
        if (this.stats.health <= 0) {
            this.die();
        }
    }

    // Method to handle the player's death
    die() {
        // Handle death (e.g., respawn logic, experience penalty, etc.)
        console.log(`${this.name} has died.`);
        // ... additional death handling ...
    }

    // Method to add experience and handle leveling up
    addExperience(amount) {
        this.stats.experience += amount;
        if (this.stats.experience >= this.getNextLevelExperience()) {
            this.levelUp();
        }
    }

    // Method to calculate the experience needed for the next level
    getNextLevelExperience() {
        // This is a placeholder formula and should be replaced with your game's leveling formula
        return this.stats.level * 100;
    }

    // Method to handle leveling up
    levelUp() {
        this.stats.level++;
        this.stats.experience = 0;
        this.stats.max_health += 10; // Example increment, adjust as needed
        this.stats.attackPower += 2; // Example increment, adjust as needed
        // ... additional stats increases and level up logic ...
        console.log(`${this.name} has reached level ${this.stats.level}!`);
    }

    // Method to use an item from the inventory
    useItem(itemId) {
        // Find the item in the inventory
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const item = this.inventory[itemIndex];
            // Apply the item's effect
            this.applyItemEffect(item);
            // Remove the item from the inventory
            this.inventory.splice(itemIndex, 1);
        } else {
            console.log('Item not found in inventory.');
        }
    }


    // Method to apply an item's effect
    applyItemEffect(item) {
        // Example: if the item is a health potion, restore health
        if (item.type === 'health_potion') {
            this.stats.health = Math.min(this.stats.health + item.effect, this.stats.max_health);
            console.log(`${this.name} used a Health Potion. Health is now ${this.stats.health}.`);
        }
        // ... handle other item types and effects ...
    }

    // ... Additional methods for player behavior ...
}

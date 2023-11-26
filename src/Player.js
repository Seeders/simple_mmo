import Unit from './Unit';
import { CONFIG } from './config';
export default class Player extends Unit {
    constructor(gameState, data) {        
        super(gameState, data);
        this.spriteSheetKey = 'champ_okomo';      
        this.inventory = data.inventory || [];
        this.isOnRoad = false;
        this.faction = 0;
        this.inventory.forEach((item) => {            
            window.game.inventoryUI.addItemToInventory(item);
        });
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
    levelUp(data) {
        this.stats.level = data.level;
        this.stats.experience = 0;
        this.stats.max_health = data.max_health; // Example increment, adjust as needed
        this.stats.health = data.health;        
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

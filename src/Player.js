import { CONFIG } from "./config";
// Player.js
export default class Player {
    constructor(gameState, data) {
        this.gameState = gameState;
        this.id = data.id;
        this.name = data.id;
        this.position = data.position;
        this.spriteSheetKey = 'champ_okomo';

        // Create an object to store the mapping information
        this.sprites = {};

        this.mapWalkAnimations();
        this.mapAttackAnimations();
        this.animationState = {
            frameIndex: 0, // Current frame in the animation sequence
            direction: 'down', // Current direction of animation
            isAttacking: false, // Whether the player is currently attacking
            attackFrameDelay: 250, // Delay in milliseconds between attack frames
            lastAttackFrameTime: 0, // Last time the attack frame was updated
        };

        this.move(this.animationState.direction);


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
    mapWalkAnimations(){
         // Define the number of rows and columns in the sprite sheet
         let rows = 4;
         let cols = 5;
 
         let prefix = 'move';
         // Define the names of the sprites
         let names = ["down", "up", "left", "right"];
 
         // Loop through the rows and columns
         for (let i = 0; i < rows; i++) {
             for (let j = 0; j < cols; j++) {
                 // Calculate the x and y coordinates of the sprite
                 let x = j * CONFIG.tileSize;
                 let y = i * CONFIG.tileSize;
 
                 // Create a name for the sprite based on its row and column
                 let name = names[i] + (j + 1);
 
                 // Add the sprite to the object
                 this.sprites[`${prefix}_${name}`] = {x: x, y: y};
             }
         }
    }
    mapAttackAnimations(){
         // Define the number of rows and columns in the sprite sheet
         let startRow = 4;
         let rows = 4;
         let cols = 4;
         let prefix = 'attack';
         // Define the names of the sprites
         let names = ["down", "up", "left", "right"];
 
          // Loop through the rows and columns
        for (let i = 0; i < rows; i++) { // Start i at 0 to use with the names array
            for (let j = 0; j < cols; j++) {
                // Calculate the x and y coordinates of the sprite
                let x = j * CONFIG.tileSize;
                // Use startRow + i to offset to the correct row on the sprite sheet
                let y = (startRow + i) * CONFIG.tileSize;

                // Create a name for the sprite based on its row and column
                let name = names[i] + (j + 1);

                // Add the sprite to the object
                this.sprites[`${prefix}_${name}`] = {x: x, y: y};
            }
        }
    }
    // Call this method whenever the player moves
    move(direction) {
        let frameCount = 5;
        // Set the current direction of the player
        this.animationState.direction = direction;

        // Update the current sprite based on the direction and frame index
        this.currentSprite = this.sprites[`move_${direction}${this.animationState.frameIndex + 1}`];

        // Increment the frame index and loop back if it exceeds the number of frames
        this.animationState.frameIndex = (this.animationState.frameIndex + 1) % frameCount;
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

    // Called every frame from the main game loop
    render() {
        if (this.animationState.isAttacking) {
            this.attack();
        }
    }
    // Method to handle the player's attack
    attack() {
        let frameCount = 4;
        let currentTime = Date.now();

        // If the animation is not already playing, start it
        if (!this.animationState.isAttacking) {
            this.animationState.isAttacking = true;
            this.animationState.frameIndex = 0; // Reset to the first frame
            this.animationState.lastAttackFrameTime = currentTime; // Set the last frame time to now
        }

        // If the animation is playing, update the sprite and frame index
        if (this.animationState.isAttacking) {
            // Check if enough time has passed since the last frame update
            if (currentTime - this.animationState.lastAttackFrameTime >= this.animationState.attackFrameDelay) {
                // Update the current sprite based on the direction and frame index
                this.currentSprite = this.sprites[`attack_${this.animationState.direction}${this.animationState.frameIndex + 1}`];

                // Increment the frame index
                this.animationState.frameIndex++;
                // If the last frame is reached, end the animation
                if (this.animationState.frameIndex >= frameCount) {
                    this.animationState.isAttacking = false; // Stop the attack animation
                    this.animationState.frameIndex = 0; // Reset the frame index
                    // Optionally, switch back to a non-attacking sprite
                    this.currentSprite = this.sprites[`move_${this.animationState.direction}1`];
                }

                // Update the last frame time
                this.animationState.lastAttackFrameTime = currentTime;
            }
        }
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

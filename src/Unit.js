
import { CONFIG } from "./config";

// Unit.js
export default class Unit {
    constructor(gameState, data) {
        this.gameState = gameState;
        this.id = data.id;
        this.position = data.position;
        this.name = data.stats.name;
        delete data.stats.name;
        this.stats = data.stats;
        this.alive = true;
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

    }


    // Called every frame from the main game loop
    render() {
        if (this.animationState.isAttacking) {
            this.attack();
        }
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
    // Method to handle the player's attack
    attack() {
        let frameCount = 4;
        let currentTime = Date.now();

        // If the animation is not already playing, start it
        if (!this.animationState.isAttacking) {
            this.animationState.isAttacking = true;
            this.animationState.frameIndex = 0; // Reset to the first frame
            this.animationState.lastAttackFrameTime = currentTime; // Set the last frame time to now
            this.animationState.attackFrameDelay = (1000 / this.stats.attack_speed) / frameCount;

            console.log(`${this.name} - ${this.stats.attack_speed}`);
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

    // ... other common methods ...
}

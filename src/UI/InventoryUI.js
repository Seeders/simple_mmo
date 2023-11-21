
import { CONFIG } from "../config"
// InventoryManager.js
export default class InventoryManager {
    constructor(gameState, assetManager) {
        this.gameState = gameState;
        this.assetManager = assetManager;
        this.createInventorySlots(25);
        this.setupDropZones();
    }   

    addItemToInventory(item) {
        for (let i = 0; i < 25; i++) { // Loop through slots
            const slotId = `slot-${i}`;
            const slotElement = document.getElementById(slotId);
            if (!slotElement.firstChild) { // Find the first empty slot
                this.addItemToSlot(item, slotId);
                break;
            }
        }
    }

    removeItemFromInventory(itemId) {
        // Remove the potion element from the inventory UI
        let itemElement = document.getElementById(`item-${itemId}`);
        if (itemElement) {
            itemElement.remove();
        }        
    }

    makeItemDraggable(itemElement) {
        itemElement.draggable = true;
        itemElement.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', itemElement.id);
        });
    }

    createInventorySlots(numberOfSlots) {
        const inventoryElement = document.getElementById('inventory');
        for (let i = 0; i < numberOfSlots; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot';
            slotElement.id = `slot-${i}`;
            inventoryElement.appendChild(slotElement);
        }
    }

    // Function to initialize drop zones
    setupDropZones() {
        const slots = document.querySelectorAll('.slot'); // Select all slot elements
        slots.forEach(slot => {
            slot.addEventListener('dragover', (event) => {
                event.preventDefault(); // Allow the drop by preventing the default handling of the element
            });

            slot.addEventListener('drop', (event) => {
                event.preventDefault();
                const itemId = event.dataTransfer.getData('text/plain');
                const itemElement = document.getElementById(itemId);
                if (slot.childElementCount === 0) { // Only allow drop if the slot is empty
                    slot.appendChild(itemElement); // Move the item to the slot
                    // Send a message to the server about the item drop
                    window.game.networkManager.send('item_dropped', {                        
                        playerId: this.gameState.currentPlayerId,
                        itemId: itemId.replace('item-', ''), // Assuming the ID is prefixed with 'item-'
                        slot: slot.id // Send the slot ID to the server as well
                    });
                }
            });
        });
    }

    addItemToSlot(item, slotId) {
        const slotElement = document.getElementById(slotId);
        if (slotElement && !slotElement.firstChild) { // Check if the slot is empty
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.id = `item-${item.id}`;
    

            
            let key = `${item.item_type}_${item.type}`;
            if(!item.item_type){
                console.log(`${key} -> ${item.type}`);
                key = item.type;
            }
            const sprite = this.assetManager.assets[key]; // Path to your sprite sheet
            const spriteSheetUrl = sprite.src; // Path to your sprite sheet
            // Sprite sheet information
            const spriteWidth = sprite.width; // Width of a single sprite
            const spriteHeight = sprite.width; // Height of a single sprite
            const spriteRow = 0; // Row of the sprite in the sprite sheet
            const spriteColumn = 0; // Column of the sprite in the sprite sheet
    
            // Calculate background position
            const backgroundPosX = -(spriteColumn * spriteWidth) + 'px';
            const backgroundPosY = -(spriteRow * spriteHeight) + 'px';
            // Set the background image to the sprite for the item
            itemElement.style.background = `url('${spriteSheetUrl}') ${backgroundPosX} ${backgroundPosY}`;
            itemElement.style.backgroundSize = `${spriteWidth}px`;
            itemElement.style.width = `${spriteWidth}px`;
            itemElement.style.height = `${spriteHeight}px`;
    
            itemElement.onclick = () => this.useItem(item.id); // Set up the click to use the item
            this.makeItemDraggable(itemElement);
            slotElement.appendChild(itemElement);
        } else {
            console.error('Slot is not empty or does not exist');
        }
    }
    
    useItem(itemId) {
        // Send a message to the server that the item is used
        window.game.networkManager.send('item_used', {            
            playerId: this.gameState.currentPlayerId,
            itemId: itemId
        });
    }
   
}

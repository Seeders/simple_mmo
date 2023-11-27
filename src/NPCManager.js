import NPC from './NPC';

class NPCManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.npcs = {};
    }

    // Initialize npcs from provided data
    initEnemies(npcDataArray) {
        npcDataArray.forEach(npcData => {
            this.addNPC(npcData);
        });
    }

    // Add a new npc to the game state
    addNPC(npcData) {
        if (!this.npcs[npcData.id]) {
            this.npcs[npcData.id] = new NPC(this.gameState, npcData);
        }
    }

    // Update an existing npc's state
    updateNPC(npcId, npcData) {
        const npc = this.getNPC(npcId);
        if (npc) {
            npc.update(npcData);
        } else {
            this.addNPC(npcData); // Add the npc if it doesn't exist
        }
    }

    // Remove an npc from the game state
    removeNPC(npcId) {
        if (this.npcs[npcId]) {
            delete this.npcs[npcId];
        }
    }

    // Get an npc by its ID
    getNPC(npcId) {
        return this.npcs[npcId];
    }

    // Handle npc death
    npcDeath(npcId) {
        // Additional logic can be added here, such as updating the game state or player stats
        this.removeNPC(npcId);
    }

    // Additional methods for npc management can be added here
}

export default NPCManager;

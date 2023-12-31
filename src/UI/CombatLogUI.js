// UI.js
export default class CombatLogUI {
    constructor(gameState) {
        this.gameState = gameState;        
        this.combatLogElement = document.getElementById('combat-log');       
        // ... other UI elements
    }

    // Update the combat log
    updateCombatLog(messages) {
        const formattedMessages = messages.map(message => `<p>${message}</p>`).join('');
        this.combatLogElement.innerHTML = formattedMessages;
    }

    // Update the player stats UI
    updatePlayerStats() {
        const player = this.gameState.player;
        if (player) {
            this.playerStatsElement.textContent = `Level: ${player.level} Health: ${player.health}`;
            // Add more stats as needed
        }
    }

    // Initialize UI event listeners
    setupEventListeners() {
  
        // Add more event listeners as needed for other UI interactions
    }

}

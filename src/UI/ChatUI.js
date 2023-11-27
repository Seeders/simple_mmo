// UI.js
export default class ChatUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.chat = []
        this.chatInput = document.getElementById('chatInput');
        this.chatMessagesElement = document.getElementById('chatMessages');
        this.setupEventListeners()
        // ... other UI elements
    }

    // Update the chat UI with a new message
    addChatMessage(data) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${data.sender}: ${data.message}`;
        this.chatMessagesElement.appendChild(messageElement);
        this.chatMessagesElement.scrollTop = this.chatMessagesElement.scrollHeight;
    }

    // Initialize UI event listeners
    setupEventListeners() {        
        this.chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const message = chatInput.value;
                chatInput.value = '';
                // Assuming there's a network class to handle sending messages
                this.gameState.networkManager.send('chat', { playerId: this.gameState.currentPlayerId, message: message });
                this.chat.push({type: "chat", message: message});
                this.addChatMessage({ sender: this.gameState.currentPlayerId, message: message });
            }
        });

        // Add more event listeners as needed for other UI interactions
    }
}

// main.js
import GameState from './GameState';
import NetworkManager from './NetworkManager';
import CombatLogUI from './UI/CombatLogUI';
import ChatUI from './UI/ChatUI';
import InventoryUI from './UI/InventoryUI';
import AssetManager from './AssetManager';
import EventHandler from './EventHandler';
import { CONFIG } from './config';
import '../styles.css';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

async function loadAssets(assetManager) {
  // Queue assets for download
  // Define an object with all the assets
  const assetsToLoad = {
    'hero': 'images/hero.png',
    'lava_beast': 'images/lava_beast.png',
    'forest_sprite': 'images/forest_sprite.png',
    'rock_troll': 'images/rock_troll.png',
    'ghost_wraith': 'images/ghost_wraith.png',
    'desert_scorpion': 'images/desert_scorpion.png',
    'sky_serpent': 'images/sky_serpent.png',
    'crystal_giant': 'images/crystal_giant.png',
    'swamp_hag': 'images/swamp_hag.png',
    'thunder_djinn': 'images/thunder_djinn.png',
    'bone_warrior': 'images/bone_warrior.png',

    'water': 'images/water.png',
    'sand': 'images/sand.png',
    'grass': 'images/grass.png',
    'forest': 'images/forest.png',
    'mountain': 'images/mountain.png',
    
    'health_potion': 'images/health_potion.png',
    // ... add other assets here
  };

  // Queue all assets for download
  Object.entries(assetsToLoad).forEach(([key, path]) => {
    assetManager.queueDownload(key, path);
  });

  try {
    await assetManager.downloadAll();
    console.log('All assets have been loaded');
  } catch (error) {
    console.error('Error loading assets:', error);
  }
}

function setupGame(assetManager) {
  const gameState = new GameState(ctx, assetManager);
  const networkManager = new NetworkManager(CONFIG.serverUrl, gameState);
  const chatUI = new ChatUI(gameState);
  const combatLogUI = new CombatLogUI(gameState);
  const inventoryUI = new InventoryUI(gameState);
  const eventHandler = new EventHandler(gameState, networkManager);
  eventHandler.setupEventListeners();

  return { gameState, networkManager, combatLogUI, chatUI, inventoryUI: inventoryUI };
}

function gameLoop(gameState) {
  function loop() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // gameState.update();
    // gameState.render();
    requestAnimationFrame(loop);
  }
  loop();
}

async function main() {
  const assetManager = new AssetManager();
  await loadAssets(assetManager);

  const { gameState, networkManager, combatLogUI, chatUI, inventoryUI } = setupGame(assetManager);
  //gameLoop(gameState);

  // If you need to expose some components globally or to other modules you can attach them to window or export them.
  window.game = {
    gameState: gameState,
    networkManager: networkManager, 
    chatUI: chatUI,
    combatLogUI: combatLogUI, 
    inventoryUI: inventoryUI
  };
}

main().catch(console.error);

// Optionally, if you need to export anything from this module:
//export { gameState, networkManager, assetManager, inventoryUI, chatUI };

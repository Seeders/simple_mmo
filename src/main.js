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
    'champ_okomo': 'images/Characters/Champions/Okomo.png',
    'demon': 'images/Characters/Monsters/Demons/ArmouredRedDemon.png',
    'flame_guardian': 'images/Characters/Monsters/Demons/RedDemon.png',
    'imp': 'images/Characters/Monsters/Demons/PurpleDemon.png',
    'black_dragon': 'images/Characters/Monsters/Dragons/BlackDragon.png',
    'blue_dragon': 'images/Characters/Monsters/Dragons/BlueDragon.png',
    'red_dragon': 'images/Characters/Monsters/Dragons/RedDragon.png',
    'white_dragon': 'images/Characters/Monsters/Dragons/WhiteDragon.png',
    'yellow_dragon': 'images/Characters/Monsters/Dragons/YellowDragon.png',
    'giant_crab': 'images/Characters/Monsters/GiantAnimals/GiantCrab.png',
    'mammoth': 'images/Characters/Monsters/Frostborn/Mammoth.png',
    'wendigo': 'images/Characters/Monsters/Frostborn/Wendigo.png',
    'yeti': 'images/Characters/Monsters/Frostborn/Yeti.png',
    'archer_goblin': 'images/Characters/Monsters/Orcs/ArcherGoblin.png',
    'club_goblin': 'images/Characters/Monsters/Orcs/ClubGoblin.png',
    'farmer_goblin': 'images/Characters/Monsters/Orcs/FarmerGoblin.png',
    'kamikaze_goblin': 'images/Characters/Monsters/Orcs/KamikazeGoblin.png',
    'minotaur': 'images/Characters/Monsters/Orcs/Minotaur.png',
    'orc': 'images/Characters/Monsters/Orcs/Orc.png',
    'orc_mage': 'images/Characters/Monsters/Orcs/OrcMage.png',
    'orc_shaman': 'images/Characters/Monsters/Orcs/OrcShaman.png',
    'spear_goblin': 'images/Characters/Monsters/Orcs/SpearGoblin.png',
    'pirate_captain': 'images/Characters/Monsters/Pirates/PirateCaptain.png',
    'pirate_grunt': 'images/Characters/Monsters/Pirates/PirateGrunt.png',
    'pirate_gunner': 'images/Characters/Monsters/Pirates/PirateGunner.png',
    'blue_slime': 'images/Characters/Monsters/Slimes/SlimeBlue.png',
    'green_slime': 'images/Characters/Monsters/Slimes/Slime.png',
    'king_blue_slime': 'images/Characters/Monsters/Slimes/KingSlimeBlue.png',
    'king_green_slime': 'images/Characters/Monsters/Slimes/KingSlimeGreen.png',
    'mega_blue_slime': 'images/Characters/Monsters/Slimes/MegaSlimeBlue.png',
    'mega_green_slime': 'images/Characters/Monsters/Slimes/MegaSlimeGreen.png',
    'necromancer': 'images/Characters/Monsters/Undead/Necromancer.png',
    'skeleton': 'images/Characters/Monsters/Undead/Skeleton-Soldier.png',
    'health_potion': 'images/health_potion.png',
    'terrain': './images/Ground/Grass.png',
    'townSprite': './images/Buildings/Wood/Chapels.png',
    'pine_tree': './images/Nature/PineTrees.png'
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
  gameState.renderManager.renderGame();
  requestAnimationFrame(() => gameLoop(gameState));
}

async function main() {
  const assetManager = new AssetManager();
  await loadAssets(assetManager);

  const { gameState, networkManager, combatLogUI, chatUI, inventoryUI } = setupGame(assetManager);
  gameLoop(gameState);

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

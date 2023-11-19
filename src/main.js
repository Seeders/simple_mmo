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
const debugCanvas = document.getElementById('debugCanvas');
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
    'health_potion': 'images/Objects/potions.png',
    'terrain': './images/Ground/Grass.png',
    'town': './images/Buildings/Wood/Keep.png',
    'pine_tree': './images/Nature/PineTrees.png',
    'stump_tree': './images/Nature/PineTrees.png',
    'wood': './images/Nature/PineTrees.png',
    'stone': './images/Nature/Rocks.png',
    'gold': './images/Nature/PineTrees.png',
    'road': './images/Ground/road.png',
    'water0': './tiles/0_water/0.png',
    'water_bg_1': './images/backgrounds/water.png',
    'water_bg_2': './images/backgrounds/water.png',
    'sand_bg_1': './images/backgrounds/beach.png',
    'sand_bg_2': './images/backgrounds/beach2.png',
    'grass_bg_1': './images/backgrounds/grass.png',
    'grass_bg_2': './images/backgrounds/grass2.png',
    'forest_bg_1': './images/backgrounds/forest.png',
    'forest_bg_2': './images/backgrounds/forest2.png',
    'mountain_bg_1': './images/backgrounds/mountain.png',
    'mountain_bg_2': './images/backgrounds/mountain2.png',
    'sand0': './tiles/1_sand/0.png',
    'sand1': './tiles/1_sand/1.png',
    'sand2': './tiles/1_sand/2.png',
    'sand3': './tiles/1_sand/3.png',
    'grass0_1': './tiles/2_grass/0_1.png',
    'grass0_2': './tiles/2_grass/0_2.png',
    'grass0': './tiles/2_grass/0.png',
    'grass1': './tiles/2_grass/1.png',
    'grass2': './tiles/2_grass/2.png',
    'grass3': './tiles/2_grass/3.png',
    'forest0': './tiles/3_forest/0.png',
    'forest1': './tiles/3_forest/1.png',
    'forest2': './tiles/3_forest/2.png',
    'forest3': './tiles/3_forest/3.png',
    'mountain0': './tiles/4_mountain/0.png',
    'mountain1': './tiles/4_mountain/1.png',
    'mountain2': './tiles/4_mountain/2.png',
    'mountain3': './tiles/4_mountain/3.png',
    'box_selector': './images/ui/BoxSelector.png',
    'house': './images/Buildings/Wood/huts.png',
    'blacksmith': './images/Buildings/Wood/Workshops.png',
    'barracks': './images/Buildings/Wood/Barracks.png',
    'market': './images/Buildings/Wood/Market.png',
    'tavern': './images/Buildings/Wood/Taverns.png',
    'temple': './images/Buildings/Wood/Chapels.png',
    'dock': './images/Buildings/Wood/Docks.png'
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
const assetManager = new AssetManager();
const gameState = new GameState(ctx, debugCanvas, assetManager);
const networkManager = new NetworkManager(CONFIG.serverUrl, gameState, connectedCallback);

function setupGame(assetManager) {
  const chatUI = new ChatUI(gameState);
  const combatLogUI = new CombatLogUI(gameState);
  const inventoryUI = new InventoryUI(gameState, assetManager);
  const eventHandler = new EventHandler(gameState, networkManager);
  eventHandler.setupEventListeners();

  return { gameState, networkManager, combatLogUI, chatUI, inventoryUI: inventoryUI };
}

function gameLoop(gameState) {
  gameState.renderManager.renderGame();
  requestAnimationFrame(() => gameLoop(gameState));
}

// Optionally, if you need to export anything from this module

async function main() {

  const { gameState, networkManager, combatLogUI, chatUI, inventoryUI } = setupGame(assetManager);

  const loginModal = document.getElementById("loginModal");
  const loginForm = document.getElementById("loginForm");

  // Function to handle login
  const handleLogin = async (username, password) => {
    try {
      loginModal.style.display = "none";
      await loadAssets(assetManager);
      await networkManager.login(username, password);
      gameLoop(gameState);

      window.game = {
        gameState,
        networkManager,
        chatUI,
        combatLogUI,
        inventoryUI
      };
    } catch (error) {
      console.error("Login failed:", error);
      loginModal.style.display = "block"; // Show login modal on login failure
    }
  };

  // Check if credentials are stored in localStorage
  const storedUsername = localStorage.getItem("username");
  const storedPassword = localStorage.getItem("password");

  if (storedUsername && storedPassword) {
    // Attempt to automatically log in
    await handleLogin(storedUsername, storedPassword);
  } else {
    // Show login modal
    loginModal.style.display = "block";
  }

  loginForm.onsubmit = async function(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Store credentials in localStorage for automatic login next time
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    await handleLogin(username, password);
  };
}

function connectedCallback() {
  main().catch(console.error);
}
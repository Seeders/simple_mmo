// main.js
import GameState from './GameState';
import NetworkManager from './NetworkManager';
import AssetManager from './AssetManager';
import EventHandler from './EventHandler';
import { CONFIG } from './Config/config';
import { assetsToLoad } from './Config/assets';
import '../styles.css';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Function to load assets
async function loadAssets(assetManager) {
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

// Function to handle login
async function handleLogin(gameState, networkManager, username, password, loginModal) {
  try {
    loginModal.style.display = "none";
    await loadAssets(gameState.assetManager);

    window.game = {
      gameState
    };

    await networkManager.login(username, password);
  } catch (error) {
    console.error("Login failed:", error);
    loginModal.style.display = "block"; // Show login modal on login failure
  }
}
// Function to handle login
async function handleRegister(gameState, networkManager, username, password, loginModal) {
  try {
    loginModal.style.display = "none";
    await loadAssets(gameState.assetManager);

    window.game = {
      gameState
    };

    await networkManager.register(username, password);
  } catch (error) {
    console.error("Login failed:", error);
    loginModal.style.display = "block"; // Show login modal on login failure
  }
}

// Main application logic
async function main(gameState, networkManager) {
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registrationModal");
  const loginForm = document.getElementById("loginForm");

  loginForm.onsubmit = async function(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    await handleLogin(gameState, networkManager, username, password, loginModal);
  };

  // Auto-login if credentials are stored
  const storedUsername = localStorage.getItem("username");
  const storedPassword = localStorage.getItem("password");
  if (storedUsername && storedPassword) {
    await handleLogin(gameState, networkManager, storedUsername, storedPassword, loginModal);
  } else {
    loginModal.style.display = "block";
  }
  const registerForm = document.getElementById("registerForm");

  registerForm.onsubmit = async function(event) {
    event.preventDefault();
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    await handleRegister(gameState, networkManager, username, password, loginModal);
    await handleLogin(gameState, networkManager, username, password, registerModal);
  };

}

// Function to start the game
function start() {
  const assetManager = new AssetManager();
  const gameState = new GameState(ctx, assetManager);
  const networkManager = new NetworkManager(CONFIG.serverUrl, gameState, () => {
    gameState.setNetworkManager(networkManager);
    main(gameState, networkManager).catch(console.error);
  });

  new EventHandler(gameState, networkManager).setupEventListeners();
}

// Start the application
start();

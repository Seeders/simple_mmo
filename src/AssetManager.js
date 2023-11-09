export default class AssetManager {
  constructor() {
    this.assets = {};
    this.loadedAssets = 0;
    this.totalAssets = 0;
    this.onAllAssetsLoaded = null; // Callback when all assets are loaded
  }

  // Method to add an asset to the manager
  queueDownload(name, src) {
    this.totalAssets++;
    const img = new Image();
    img.onload = () => this.assetLoaded(name, img);
    img.onerror = () => console.error(`Error loading image: ${src}`);
    img.src = src;
    this.assets[name] = img;
  }

  // Method to check if all assets are loaded
  assetLoaded(name, img) {
    console.log(`Asset loaded: ${name}`);
    this.loadedAssets++;
    if (this.loadedAssets === this.totalAssets) {
      if (this.onAllAssetsLoaded) {
        this.onAllAssetsLoaded();
      }
    }
  }

  // Method to get an asset
  getAsset(name) {
    return this.assets[name];
  }

  // Method to check if all assets are loaded and set a callback
  downloadAll() {
    return new Promise((resolve, reject) => {
      if (this.loadedAssets === this.totalAssets) {
        resolve();
      } else {
        this.onAllAssetsLoaded = resolve;
      }
    });
  }
}

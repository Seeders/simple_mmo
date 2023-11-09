export default class Terrain {
    constructor(tileSize, terrainSprites) {
      this.tileSize = tileSize;
      this.terrainColors = {
        'water': '#0000ff',
        'sand': '#f4a460',
        'grass': '#008000',
        'forest': '#006400',
        'mountain': '#a52a2a'
      };
      this.terrainSprites = terrainSprites; // An object containing the Image objects for terrain
      this.map = []; // 2D array representing the map
    }
  
    // Generate a random map for demonstration purposes
    generateRandomMap(width, height) {
      const terrainTypes = Object.keys(this.terrainSprites);
      for (let y = 0; y < height; y++) {
        this.map[y] = [];
        for (let x = 0; x < width; x++) {
          const terrainType = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
          this.map[y][x] = terrainType;
        }
      }
    }
  
    // Render the terrain on the given context
    render(ctx, offsetX, offsetY) {
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const terrainType = this.map[y][x];
          const img = this.terrainSprites[terrainType];
          if (img.complete) {
            ctx.drawImage(img, x * this.tileSize + offsetX, y * this.tileSize + offsetY, this.tileSize, this.tileSize);
          } else {
            // Optionally draw a placeholder or load the image if it's not done yet
            img.onload = () => {
              ctx.drawImage(img, x * this.tileSize + offsetX, y * this.tileSize + offsetY, this.tileSize, this.tileSize);
            };
          }
        }
      }
    }
  
    // Get the type of terrain at the given tile coordinates
    getTerrainTypeAt(x, y) {
      if (x >= 0 && x < this.map[0].length && y >= 0 && y < this.map.length) {
        return this.map[y][x];
      }
      return null; // Out of bounds
    }
  }
  
  // Example usage:
  // Assuming you have an object called 'terrainImages' with Image objects for each terrain type
  const terrain = new Terrain(32, terrainImages);
  terrain.generateRandomMap(50, 50); // Generate a random map with 50x50 tiles
  
  // Later in your game loop, you would call terrain.render(ctx, offsetX, offsetY) to draw the map
  
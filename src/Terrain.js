export default class Terrain {
    constructor(map) {
      this.terrainColors = {
        'water': '#0000ff',
        'sand': '#f4a460',
        'grass': '#008000',
        'forest': '#006400',
        'mountain': '#a52a2a'
      };
      this.map = map; // 2D array representing the map
    }
    // Get the type of terrain at the given tile coordinates
    getTerrainTypeAt(x, y) {
      if (x >= 0 && x < this.map[0].length && y >= 0 && y < this.map.length) {
        return this.map[y][x];
      }
      return null; // Out of bounds
    }
}
  
  // Later in your game loop, you would call terrain.render(ctx, offsetX, offsetY) to draw the map
  
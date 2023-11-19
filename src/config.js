export const CONFIG = {
    tileSize: 32, // Size of each tile in pixels
    unitSize: 16,
    worldSize: 100,
    miniMapSize: 300,
    serverUrl: "ws://localhost:6789/",    
    tileTypes: ['water', 'sand', 'grass', 'forest', 'mountain'],
    terrainColors: {
        'water': '#0000ff',
        'sand': '#f4a460',
        'grass': '#008000',
        'forest': '#006400',
        'mountain': '#a52a2a'
    }
}
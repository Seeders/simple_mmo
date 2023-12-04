export const CONFIG = {
    tileSize: 64, // Size of each tile in pixels
    unitSize: 16,
    worldSize: 100,
    overworldMiniMapSize: 1024,
    miniMapSize: 300,
    zoom: 1,
    serverUrl: "ws://localhost:6789/",    
    tileTypes: ['water', 'sand', 'grass', 'forest', 'mountain'],
    overworldTileTypes: [ 'ocean', 'river', 'coast','grass',  'desert', 'forest', 'mountain', 'volcanic', 'mystical', 'ruins' ],
    overworldTileSize: 32,
    overworldSize: 32,
    roadTileIndex: 2,
    terrainColors: {
        'water': '#0000ff',
        'sand': '#f4a460',
        'grass': '#008000',
        'forest': '#006400',
        'mountain': '#a52a2a'
    }
}
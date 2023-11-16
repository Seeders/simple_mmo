// tileMapModule.js

class TileAnalysis {
    constructor() {
      this.heightIndex = 0;
      this.neighborLowerCount = 0;
      this.cornerLowerCount = 0;
      this.topLess = false;
      this.leftLess = false;
      this.rightLess = false;
      this.botLess = false;
      this.c1Less = false;
      this.c2Less = false;
      this.c3Less = false;
      this.c4Less = false;
      this.c1Less2 = false;
      this.c2Less2 = false;
      this.c3Less2 = false;
      this.c4Less2 = false;
    }
  }
  
  const TileTransforms = {
    None: 0,
    ClockWise90: 1,
    CounterClockWise90: 2,
    Rotate180: 3,
    FlipHorizontal: 4,
    FlipVertical: 5,
  };
  
  const TileAtom = {
    Full: 0,
    OneCorner: 1,
    TwoCorner: 2,
    ThreeCorner: 3,
  };
  
  const TileMolecule = {
    Full: 0,
    Corner: 1,
    Edge: 2,
    Tunnel: 3,
    TwoSides: 4,
    Penninsula: 5,
    Island: 6,
  };
  const atomTextures = {
    [TileAtom.Full]: "0.png",
    [TileAtom.OneCorner]: "1.png",
    [TileAtom.TwoCorner]: "2.png",
    [TileAtom.ThreeCorner]: "3.png",
};
  function loadTexture(src, callback) {
    const img = new Image();
    img.src = src;
    img.onload = () => callback(img);
    return img;
  }
  

class TileMap {
	constructor(gameState, assetManager, canvas, tileSize, layers) {
		this.gameState = gameState;
		this.assetManager = assetManager;
		this.canvas = canvas;
		this.tileSize = tileSize;
		this.numColumns = 0;
		this.layers = layers;
		this.tileMap = [];
	

	}
    load(){
		this.tileMap = this.gameState.terrain.map;
		this.numColumns = this.tileMap.length;
		// Load all textures


		if( !this.layerTextures || this.layerTextures.length == 0 ) {
			this.layerTextures = [];    
			var textures = [];        
			this.layers.forEach((layer, index) => {
				textures[index] = [];
				for (const key in atomTextures) {
					const img = this.assetManager.assets[`${layer}${key}`]; 
					console.log(img.src);  
					textures[index].push(img);
				}
			});
			this.layers.forEach((layer, index) => {	  
				const textureData = this.buildBaseMolecules(textures[index]);
				const rotationsDict = this.getSpriteRotations(textureData, true);
				this.layerTextures[index] = rotationsDict;
			});
		}
		// Example usage
		let analyzedMap = this.analyzeMap(this.tileMap);
		this.drawMap(analyzedMap, this.layerTextures, this.canvas);
    }
    drawTexture(texture, x, y) {
		ctx.drawImage(texture, x, y, this.tileSize / 2, this.tileSize / 2); // Assuming each atom is 256x256
    }

    // Function to generate a molecule texture for various molecule ty
	buildBaseMolecules(sprites) {
		// Define texture objects
		const fullTexture = document.createElement("canvas");
		const oneCornerTexture = document.createElement("canvas");
		const twoCornerTexture = document.createElement("canvas");
		const threeCornerTexture = document.createElement("canvas");
		fullTexture.setAttribute('willReadFrequently', true); 
		oneCornerTexture.setAttribute('willReadFrequently', true); 
		twoCornerTexture.setAttribute('willReadFrequently', true); 
		threeCornerTexture.setAttribute('willReadFrequently', true); 
		// Set the texture sizes
		const spriteResolution = sprites[0].width;
		const finalTileBaseResolution = spriteResolution * 2;
        const tileResolutionMidIndex = (finalTileBaseResolution * finalTileBaseResolution / 2) + (finalTileBaseResolution / 2);
		const bottomLeftOffset = 0;
        const bottomRightOffset = finalTileBaseResolution / 2;
        const topLeftOffset = finalTileBaseResolution * finalTileBaseResolution / 2; 
        const topRightOffset = finalTileBaseResolution * finalTileBaseResolution / 2 + finalTileBaseResolution / 2; 

		fullTexture.width = spriteResolution;
		fullTexture.height = spriteResolution;

		oneCornerTexture.width = spriteResolution;
		oneCornerTexture.height = spriteResolution;

		twoCornerTexture.width = spriteResolution;
		twoCornerTexture.height = spriteResolution;

		threeCornerTexture.width = spriteResolution;
		threeCornerTexture.height = spriteResolution;	
		

		// Get sprite textures
		const fullSprite = sprites[0];
		const oneCornerSprite = sprites[1];
		const twoCornerSprite = sprites[2];
		const threeCornerSprite = sprites[3];

		// Create CanvasRenderingContext2D objects for each texture
		const fullCtx = fullTexture.getContext("2d");
		const oneCornerCtx = oneCornerTexture.getContext("2d", { willReadFrequently: true });
		const twoCornerCtx = twoCornerTexture.getContext("2d", { willReadFrequently: true });
		const threeCornerCtx = threeCornerTexture.getContext("2d", { willReadFrequently: true });
		
		// Copy pixels from sprites to texture canvases
		fullCtx.drawImage(fullSprite,0,0);
		oneCornerCtx.drawImage(oneCornerSprite,0,0);
		twoCornerCtx.drawImage(twoCornerSprite,0,0);
		threeCornerCtx.drawImage(threeCornerSprite,0,0);

		// Get pixel data from the canvases
		const fullImageData = fullCtx.getImageData(0, 0, spriteResolution, spriteResolution);
		const oneCornerImageData = oneCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution);
		
		const twoCornerTopImageData = twoCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution);
		const twoCornerLeftImageData = this.rotateTexture(twoCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution), -Math.PI / 2);
		const twoCornerRightImageData = this.rotateTexture(twoCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution), Math.PI / 2);
		const twoCornerBottomImageData = this.flipTextureVertical(twoCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution));
		
		const threeCornerTopRightImageData = threeCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution);
		const threeCornerTopLeftImageData = this.flipTextureHorizontal(threeCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution));
		const threeCornerBottomLeftImageData = this.rotateTexture(threeCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution), Math.PI);
		const threeCornerBottomRightImageData = this.flipTextureVertical(threeCornerCtx.getImageData(0, 0, spriteResolution, spriteResolution));

				
		// Define molecule objects
		const fullTile = document.createElement("canvas");
		const cornerTile = document.createElement("canvas");
		const edgeTile = document.createElement("canvas");
		const tunnelTile = document.createElement("canvas");
		const twoSidesTile = document.createElement("canvas");
		const penninsulaTile = document.createElement("canvas");
		const islandTile = document.createElement("canvas");

		// document.body.appendChild(fullTile);
		// document.body.appendChild(cornerTile);
		// document.body.appendChild(edgeTile);
		// document.body.appendChild(tunnelTile);
		// document.body.appendChild(twoSidesTile);
		// document.body.appendChild(penninsulaTile);
		// document.body.appendChild(islandTile);
		
		fullTile.width = finalTileBaseResolution;
		fullTile.height = finalTileBaseResolution;

		cornerTile.width = spriteResolution;
		cornerTile.height = spriteResolution;

		edgeTile.width = finalTileBaseResolution;
		edgeTile.height = finalTileBaseResolution;
		
		tunnelTile.width = finalTileBaseResolution;
		tunnelTile.height = finalTileBaseResolution;

		twoSidesTile.width = finalTileBaseResolution;
		twoSidesTile.height = finalTileBaseResolution;

		penninsulaTile.width = finalTileBaseResolution;
		penninsulaTile.height = finalTileBaseResolution;

		islandTile.width = finalTileBaseResolution;
		islandTile.height = finalTileBaseResolution;
		
		const fullTileCtx = fullTile.getContext('2d', { willReadFrequently: true });
		const cornerTileCtx = cornerTile.getContext('2d', { willReadFrequently: true });
		const edgeTileCtx = edgeTile.getContext('2d', { willReadFrequently: true });
		const tunnelTileCtx = tunnelTile.getContext('2d', { willReadFrequently: true });
		const twoSidesTileCtx = twoSidesTile.getContext('2d', { willReadFrequently: true });
		const penninsulaTileCtx = penninsulaTile.getContext('2d', { willReadFrequently: true });
		const islandTileCtx = islandTile.getContext('2d', { willReadFrequently: true });
		fullTileCtx.putImageData(fullImageData, 0, 0);
		fullTileCtx.putImageData(fullImageData, spriteResolution, 0);
		fullTileCtx.putImageData(fullImageData, 0, spriteResolution);
		fullTileCtx.putImageData(fullImageData, spriteResolution, spriteResolution);

		cornerTileCtx.fillStyle = 'black';
		cornerTileCtx.fillRect(0, 0, spriteResolution, spriteResolution);
		cornerTileCtx.putImageData(oneCornerImageData, 0, 0);
		
		edgeTileCtx.fillStyle = 'black';
		edgeTileCtx.fillRect(0, 0, finalTileBaseResolution, finalTileBaseResolution);
		edgeTileCtx.putImageData(twoCornerTopImageData, 0, 0);
		edgeTileCtx.putImageData(twoCornerTopImageData, spriteResolution, 0);
		
		tunnelTileCtx.fillStyle = 'black';
		tunnelTileCtx.fillRect(0, 0, finalTileBaseResolution, finalTileBaseResolution);
		tunnelTileCtx.putImageData(twoCornerBottomImageData, 0, 0);
		tunnelTileCtx.putImageData(twoCornerBottomImageData, spriteResolution, 0);
		tunnelTileCtx.putImageData(twoCornerTopImageData, 0, spriteResolution);
		tunnelTileCtx.putImageData(twoCornerTopImageData, spriteResolution, spriteResolution);
		
		twoSidesTileCtx.fillStyle = 'black';
		twoSidesTileCtx.fillRect(0, 0, finalTileBaseResolution, finalTileBaseResolution);
		twoSidesTileCtx.putImageData(twoCornerTopImageData, 0, 0);
		twoSidesTileCtx.putImageData(threeCornerTopRightImageData, spriteResolution, 0);
		twoSidesTileCtx.putImageData(twoCornerRightImageData, spriteResolution, spriteResolution);
		
		penninsulaTileCtx.fillStyle = 'black';
		penninsulaTileCtx.fillRect(0, 0, finalTileBaseResolution, finalTileBaseResolution);
		penninsulaTileCtx.putImageData(threeCornerTopLeftImageData, 0, 0);
		penninsulaTileCtx.putImageData(threeCornerTopRightImageData, spriteResolution, 0);
		penninsulaTileCtx.putImageData(twoCornerLeftImageData, 0, spriteResolution);
		penninsulaTileCtx.putImageData(twoCornerRightImageData, spriteResolution,spriteResolution);
		
		islandTileCtx.fillStyle = 'black';
		islandTileCtx.fillRect(0, 0, finalTileBaseResolution, finalTileBaseResolution);
		islandTileCtx.putImageData(threeCornerTopLeftImageData, 0, 0);
		islandTileCtx.putImageData(threeCornerTopRightImageData, spriteResolution, 0);
		islandTileCtx.putImageData(threeCornerBottomLeftImageData, 0, spriteResolution);
		islandTileCtx.putImageData(threeCornerBottomRightImageData, spriteResolution,spriteResolution);

		
		// Create an array of textures
		var imageDataList = [
			fullTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
			cornerTileCtx.getImageData(0, 0, spriteResolution, spriteResolution),
			edgeTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
			tunnelTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
			twoSidesTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
			penninsulaTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
			islandTileCtx.getImageData(0, 0, finalTileBaseResolution, finalTileBaseResolution),
		];

		return imageDataList;
	}

	getSpriteRotations(imageDataDict, hasCorners, addNoise = false) {
		let rotationDict = {};

		let requiredTransforms = {};

		requiredTransforms[TileMolecule.Full] = [];
		requiredTransforms[TileMolecule.Corner] = [TileTransforms.FlipHorizontal, TileTransforms.FlipVertical, TileTransforms.Rotate180];
		requiredTransforms[TileMolecule.Edge] = [TileTransforms.ClockWise90, TileTransforms.CounterClockWise90, TileTransforms.Rotate180];
		requiredTransforms[TileMolecule.Tunnel] = [TileTransforms.CounterClockWise90];
		requiredTransforms[TileMolecule.TwoSides] = [TileTransforms.FlipHorizontal, TileTransforms.FlipVertical, TileTransforms.Rotate180];
		requiredTransforms[TileMolecule.Penninsula] = [TileTransforms.FlipVertical, TileTransforms.ClockWise90, TileTransforms.CounterClockWise90];
		requiredTransforms[TileMolecule.Island] = [];

		Object.keys(imageDataDict).forEach(tileBase => {
			let rotations = {};
			let colors = imageDataDict[tileBase];
			let isCorner = tileBase === TileMolecule.Corner;
			rotations[TileTransforms.None] = colors;

			if (requiredTransforms[tileBase].includes(TileTransforms.ClockWise90)) {
				rotations[TileTransforms.ClockWise90] = this.rotateTexture(colors, Math.PI / 2);
			}
			if (requiredTransforms[tileBase].includes(TileTransforms.CounterClockWise90)) {
				rotations[TileTransforms.CounterClockWise90] = this.rotateTexture(colors, -Math.PI / 2);
			}
			if (requiredTransforms[tileBase].includes(TileTransforms.Rotate180)) {
				rotations[TileTransforms.Rotate180] = this.rotateTexture(colors, Math.PI);
			}
			if (requiredTransforms[tileBase].includes(TileTransforms.FlipHorizontal)) {
				rotations[TileTransforms.FlipHorizontal] = this.flipTextureHorizontal(colors);
			}
			if (requiredTransforms[tileBase].includes(TileTransforms.FlipVertical)) {
				rotations[TileTransforms.FlipVertical] = this.flipTextureVertical(colors);
			}

			rotationDict[tileBase] = rotations;
		});

		return rotationDict;
	}

	rotateTexture(imageData, angle) {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.putImageData(imageData, 0, 0);

		const rotatedTexture = document.createElement("canvas");
		rotatedTexture.width = imageData.width;
		rotatedTexture.height = imageData.height;
		const rotatedCtx = rotatedTexture.getContext("2d");

		rotatedCtx.translate(rotatedTexture.width / 2, rotatedTexture.height / 2);
		rotatedCtx.rotate(angle);
		rotatedCtx.translate(-rotatedTexture.width / 2, -rotatedTexture.height / 2);

		rotatedCtx.drawImage(tempCanvas, 0, 0);

		return rotatedCtx.getImageData(0, 0, rotatedTexture.width, rotatedTexture.height);
	}
	flipTextureVertical(imageData) {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.putImageData(imageData, 0, 0);

		const canvas = document.createElement("canvas");
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext("2d");

		ctx.translate(0, canvas.height);
		ctx.scale(1, -1);
		ctx.drawImage(tempCanvas, 0, 0);

		return ctx.getImageData(0, 0, imageData.width, imageData.height);
	}
	flipTextureHorizontal(imageData) {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.putImageData(imageData, 0, 0);

		const canvas = document.createElement("canvas");
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext("2d");

		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(tempCanvas, 0, 0);

		return ctx.getImageData(0, 0, imageData.width, imageData.height);
	}

	analyzeTile(locationIndex) {
		let tileAnalysis = new TileAnalysis();
		let row = Math.floor(locationIndex / this.numColumns);
		let col = locationIndex % this.numColumns;

		if (row < 0 || row >= this.numColumns || col < 0 || col >= this.numColumns) {
			return tileAnalysis; // Out of bounds
		}

		let tileName = this.tileMap[row][col];
		tileAnalysis.heightIndex = this.layers.indexOf(tileName);

		// Helper function to check if a location is within bounds
		function isWithinBounds(r, c, n) {
			return r >= 0 && r < n && c >= 0 && c < n;
		}

		// Helper function to check and update tile analysis
		var checkAndUpdate = ((r, c, n, propertyLess, propertyLess2) => {
			if (isWithinBounds(r, c, n) && this.layers.indexOf(this.tileMap[r][c]) < tileAnalysis.heightIndex) {
				tileAnalysis[propertyLess] = true;
				if(['topLess', 'leftLess', 'rightLess', 'botLess'].indexOf(propertyLess) >= 0 ) {
					tileAnalysis.neighborLowerCount++;
				} else if(['c1Less', 'c2Less', 'c3Less', 'c4Less', 'c1Less2', 'c2Less2', 'c3Less2', 'c4Less2'].indexOf(propertyLess) >= 0 ) {
					tileAnalysis.cornerLowerCount++;
				}
			}
		});

		checkAndUpdate(row - 1, col, this.numColumns, 'topLess');
		checkAndUpdate(row, col - 1, this.numColumns, 'leftLess');
		checkAndUpdate(row, col + 1, this.numColumns, 'rightLess');
		checkAndUpdate(row + 1, col, this.numColumns, 'botLess');
		checkAndUpdate(row - 1, col - 1, this.numColumns, 'c1Less', 'c1Less2');
		checkAndUpdate(row - 1, col + 1, this.numColumns, 'c2Less', 'c2Less2');
		checkAndUpdate(row + 1, col - 1, this.numColumns, 'c3Less', 'c3Less2');
		checkAndUpdate(row + 1, col + 1, this.numColumns, 'c4Less', 'c4Less2');

		return tileAnalysis;
	}

	// Function to generate a random integer between min and max (inclusive)
	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// Function to generate a random 10x10 map
	generateRandomMap(rows, columns) {
		let map = [];
		for (let i = 0; i < rows; i++) {
			let row = [];
			for (let j = 0; j < columns; j++) {
				row.push(getRandomInt(0, layers.length - 1)); // Random height between 0 and 10
			}
			map.push(row);
		}
		return map;
	}
	analyzeMap() {
		let analyzedTiles = [];

		for (let i = 0; i < this.numColumns; i++) {
			for (let j = 0; j < this.numColumns; j++) {
				let locationIndex = i * this.numColumns + j;
				analyzedTiles.push(this.analyzeTile(locationIndex));
			}
		}

		return analyzedTiles;
	}

	//
	getTransformedTexture(transformationDict, tileAnalysis, tileBase){
		switch(tileAnalysis.neighborLowerCount){				
			case 1:
				if(tileAnalysis.leftLess){                    
					return transformationDict[tileBase][TileTransforms.CounterClockWise90];
				} else if(tileAnalysis.rightLess){
                    return transformationDict[tileBase][TileTransforms.ClockWise90];
				} else if(tileAnalysis.botLess){		
					return transformationDict[tileBase][TileTransforms.Rotate180];
				}
				break;
			case 2:
				if(tileAnalysis.topLess && tileAnalysis.leftLess){
					return transformationDict[tileBase][TileTransforms.FlipHorizontal];
				} else if(tileAnalysis.botLess && tileAnalysis.leftLess){		
					return transformationDict[tileBase][TileTransforms.Rotate180];
				} else if(tileAnalysis.botLess && tileAnalysis.rightLess){		
					return transformationDict[tileBase][TileTransforms.FlipVertical];
				} else if(tileAnalysis.leftLess && tileAnalysis.rightLess){
					return transformationDict[tileBase][TileTransforms.CounterClockWise90];
				}
				break;
			case 3:
				if(!tileAnalysis.topLess){
					return transformationDict[tileBase][TileTransforms.FlipVertical];
				} else if(!tileAnalysis.leftLess){		
					return transformationDict[tileBase][TileTransforms.ClockWise90];
				} else if(!tileAnalysis.rightLess){		
					return transformationDict[tileBase][TileTransforms.CounterClockWise90];
				}
				break;
			case 4:
				break;
			default:
				break;
		}		
        return transformationDict[tileBase][TileTransforms.None];
	}
	getTileBaseByTileAnalysis(tileAnalysis){
		var tileBase = 0;								
		switch(tileAnalysis.neighborLowerCount){
			case 0:
				tileBase = 0;
				break;
			case 1:
				tileBase = 2;
				break;
			case 2:
				if((tileAnalysis.topLess && tileAnalysis.botLess) || (tileAnalysis.leftLess && tileAnalysis.rightLess)){
					tileBase = 3;
				} else {
					tileBase = 4;
				}
				break;								
			default:
				tileBase = tileAnalysis.neighborLowerCount + 2;
				break;
		}
		return tileBase;
	}

	colorImageData(imageData, tileAnalysis) {
		var tempCanvas = document.createElement('canvas');
		tempCanvas.width = this.tileSize;
		tempCanvas.height = this.tileSize;
		var tempCtx = tempCanvas.getContext('2d');
		var tempImageData = tempCtx.createImageData(this.tileSize, this.tileSize);

		for (let j = 0; j < this.tileSize; j++) {
			for (let i = 0; i < this.tileSize; i++) {
				let index = j * this.tileSize + i;
				let dataIndex = index * 4;

				let pColor = { r: imageData.data[dataIndex], g: imageData.data[dataIndex + 1], b: imageData.data[dataIndex + 2], a: imageData.data[dataIndex + 3] };
				let tColor = { r: 255, g: 0, b: 0, a: 255 }; // Assuming outputTexture[index] is similar to pColor
				let bColor = { r: 0, g: 255, b: 0, a: 255 }; // Black color

				if (this.layerTextures.length > tileAnalysis.heightIndex) {
					let baseColors = this.layerTextures[tileAnalysis.heightIndex][TileMolecule.Full][TileTransforms.None];
					if (baseColors.data.length > index) {
						bColor = { r: baseColors.data[dataIndex], g: baseColors.data[dataIndex + 1], b: baseColors.data[dataIndex + 2], a: baseColors.data[dataIndex + 3] };
					}
				}
				if (tileAnalysis.heightIndex - 1 >= 0) {
					let neighborColors = this.layerTextures[tileAnalysis.heightIndex - 1][TileMolecule.Full][TileTransforms.None];
					if (neighborColors.data.length > index) {
						tColor = { r: neighborColors.data[dataIndex], g: neighborColors.data[dataIndex + 1], b: neighborColors.data[dataIndex + 2], a: neighborColors.data[dataIndex + 3] };
					}
				}
				let fColor = pColor;
				if (this.isEqualColor(fColor, { r: 0, g: 0, b: 0, a: 0 })) fColor = tColor;
				if (this.isEqualColor(fColor, { r: 0, g: 0, b: 0, a: 255 })) fColor = bColor;

				tempImageData.data[dataIndex] = fColor.r;
				tempImageData.data[dataIndex + 1] = fColor.g;
				tempImageData.data[dataIndex + 2] = fColor.b;
				tempImageData.data[dataIndex + 3] = fColor.a;
			}
		}

		tempCtx.putImageData(tempImageData, 0, 0);
		return tempCtx.getImageData(0, 0, this.tileSize, this.tileSize);
	}

	isEqualColor(color1, color2) {
		return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && color1.a === color2.a;
	}


	addCornerGraphics(imageData, tileAnalysis) {
		let cornerSize = this.tileSize / 2;
		let cornerTexture;
	
		let heightLessIndex = 0;
		let heightIndex = tileAnalysis.heightIndex;
	
		if (tileAnalysis.cornerLowerCount > 0) {
			if (tileAnalysis.c1Less && ((!tileAnalysis.topLess && !tileAnalysis.leftLess) || tileAnalysis.c1Less2)) {
				if (tileAnalysis.c1Less2 && tileAnalysis.heightIndex > 0) {
					cornerTexture = this.layerTextures[heightLessIndex][TileMolecule.Corner][TileTransforms.FlipHorizontal];
					return this.colorCornerTextureRoutine(imageData, 0, 0, cornerTexture, tileAnalysis, true);
				} else {
					cornerTexture = this.layerTextures[heightIndex][TileMolecule.Corner][TileTransforms.FlipHorizontal];
					return this.colorCornerTextureRoutine(imageData, 0, 0, cornerTexture, tileAnalysis, false);
				}
			}
			// Assuming tileAnalysis, textureDict, and other variables are already defined
			if (tileAnalysis.c2Less && ((!tileAnalysis.topLess && !tileAnalysis.rightLess) || tileAnalysis.c2Less2)) {
				if (tileAnalysis.c2Less2 && tileAnalysis.heightIndex > 0) {
					cornerTexture = this.layerTextures[heightLessIndex][TileMolecule.Corner][TileTransforms.None];
					return this.colorCornerTextureRoutine(imageData, cornerSize, 0, cornerTexture, tileAnalysis, true);
				} else {
					cornerTexture = this.layerTextures[heightIndex][TileMolecule.Corner][TileTransforms.None];
					return this.colorCornerTextureRoutine(imageData, cornerSize, 0, cornerTexture, tileAnalysis, false);
				}
			}

			if (tileAnalysis.c3Less && ((!tileAnalysis.botLess && !tileAnalysis.leftLess) || tileAnalysis.c3Less2)) {
				if (tileAnalysis.c3Less2 && tileAnalysis.heightIndex > 0) {
					cornerTexture = this.layerTextures[heightLessIndex][TileMolecule.Corner][TileTransforms.Rotate180];
					return this.colorCornerTextureRoutine(imageData, 0, cornerSize, cornerTexture, tileAnalysis, true);
				} else {
					cornerTexture = this.layerTextures[heightIndex][TileMolecule.Corner][TileTransforms.Rotate180];
					return this.colorCornerTextureRoutine(imageData, 0, cornerSize, cornerTexture, tileAnalysis, false);
				}
			}

			if (tileAnalysis.c4Less && ((!tileAnalysis.botLess && !tileAnalysis.rightLess) || tileAnalysis.c4Less2)) {
				if (tileAnalysis.c4Less2 && tileAnalysis.heightIndex > 0) {
					cornerTexture = this.layerTextures[heightLessIndex][TileMolecule.Corner][TileTransforms.FlipVertical];
					return this.colorCornerTextureRoutine(imageData, cornerSize, cornerSize, cornerTexture, tileAnalysis, true);
				} else {
					cornerTexture = this.layerTextures[heightIndex][TileMolecule.Corner][TileTransforms.FlipVertical];
					return this.colorCornerTextureRoutine(imageData, cornerSize, cornerSize, cornerTexture, tileAnalysis, false);
				}
			}
		}
		return imageData;
	}
	
	colorCornerTextureRoutine(outputImageData, x, y, cornerImageData, tileAnalysis, isLess2) {
		var tempCanvas = document.createElement('canvas');
		let cornerSize = this.tileSize / 2;
		tempCanvas.width = cornerSize;
		tempCanvas.height = cornerSize;
		var tempCtx = tempCanvas.getContext('2d');
		var tempImageData = tempCtx.createImageData(cornerSize, cornerSize);

		let baseHeightIndex = tileAnalysis.heightIndex;
        let less1HeightIndex = tileAnalysis.heightIndex;
        let less2HeightIndex = tileAnalysis.heightIndex;
        if( baseHeightIndex > 1) {
            baseHeightIndex = tileAnalysis.heightIndex;
            less1HeightIndex = tileAnalysis.heightIndex - 1;
            less2HeightIndex = tileAnalysis.heightIndex - 2;
        } else if( baseHeightIndex > 0) {
            baseHeightIndex = tileAnalysis.heightIndex;
            less1HeightIndex = tileAnalysis.heightIndex - 1;
            less2HeightIndex = tileAnalysis.heightIndex - 1;
        } 

        let baseColors = this.layerTextures[baseHeightIndex][TileMolecule.Full][TileTransforms.None];
        let lessBaseColors = this.layerTextures[less1HeightIndex][TileMolecule.Full][TileTransforms.None];
        let less2BaseColors = this.layerTextures[less2HeightIndex][TileMolecule.Full][TileTransforms.None];

		for (let j = 0; j < cornerSize; j++) {
			for (let i = 0; i < cornerSize; i++) {
				let baseIndex = (j * this.tileSize + i) * 4;
	
				let baseColor = this.getColorFromImageData(baseColors, baseIndex);
				let lessColor = this.getColorFromImageData(lessBaseColors, baseIndex);
				let lessBaseColor = this.getColorFromImageData(lessBaseColors, baseIndex); // Assuming lessBaseColor is similar to lessColor
				let less2Color = this.getColorFromImageData(less2BaseColors, baseIndex);
				let less2BaseColor = this.getColorFromImageData(less2BaseColors, baseIndex); // Assuming less2BaseColor is similar to less2Color
	
				let tColor = this.getColorFromImageData(outputImageData, baseIndex);
	
				let sourceOriginX = i;
				let sourceOriginY = j * cornerSize;
				let sourcePixel = (sourceOriginY + sourceOriginX) * 4;
				let pColor = this.getColorFromImageData(cornerImageData, sourcePixel);
				let fColor = pColor;
	
				if (isLess2) {
					if (this.isEqualColor(pColor, lessColor)) {
						fColor = tColor;
					}
					if (fColor.a === 0) {
						fColor = less2Color;
					}
				} else {
					if (fColor.a === 0) fColor = lessColor;
				}
	
				if (this.isEqualColor(fColor, { r: 0, g: 0, b: 0, a: 255 })) {
					if (isLess2) {
						fColor = less2BaseColor;
					} else {
						if (pColor.a !== 0) {
							fColor = baseColor;
						} else {
							fColor = lessBaseColor;
						}
					}
				}
	
				let tempDataIndex = (j * cornerSize + i) * 4;
				tempImageData.data[tempDataIndex] = fColor.r;
				tempImageData.data[tempDataIndex + 1] = fColor.g;
				tempImageData.data[tempDataIndex + 2] = fColor.b;
				tempImageData.data[tempDataIndex + 3] = fColor.a;
			}
		}
	
		tempCtx.putImageData(tempImageData, 0, 0);
		var outputCanvas = document.createElement('canvas');
		outputCanvas.width = this.tileSize;
		outputCanvas.height = this.tileSize;
		var outputCtx = outputCanvas.getContext('2d');
		outputCtx.putImageData(outputImageData, 0, 0);

		outputCtx.drawImage(tempCanvas, x, y, cornerSize, cornerSize);
		return outputCtx.getImageData(0, 0, this.tileSize, this.tileSize);
	}
	
	getColorFromImageData(imageData, index) {
		return {
			r: imageData.data[index],
			g: imageData.data[index + 1],
			b: imageData.data[index + 2],
			a: imageData.data[index + 3]
		};
	}	
	
	

	drawMap(analyzedMap) {

		const ctx = this.canvas.getContext('2d');
		

		analyzedMap.forEach((tileAnalysis, index) => {

			const x = (index % this.numColumns) * this.tileSize;
			const y = Math.floor(index / this.numColumns) * this.tileSize;
			var tileBase = this.getTileBaseByTileAnalysis(tileAnalysis);
			const imageData = this.getTransformedTexture(this.layerTextures[tileAnalysis.heightIndex], tileAnalysis, tileBase);
			const coloredData = this.colorImageData(imageData, tileAnalysis);
			const corneredData = this.addCornerGraphics(coloredData, tileAnalysis);
			ctx.putImageData(corneredData, x, y);

		});
	}
  }
  
  export default TileMap;
  
export default class CanvasUtility {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    paintTexture(imageData) {
        this.setSize(imageData.width, imageData.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imageData, 0, 0);
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
	rotateTexture(imageData, angle) {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
		tempCtx.putImageData(imageData, 0, 0);

		const rotatedTexture = document.createElement("canvas");
		rotatedTexture.width = imageData.width;
		rotatedTexture.height = imageData.height;
		const rotatedCtx = rotatedTexture.getContext("2d", { willReadFrequently: true });

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
		const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
		tempCtx.putImageData(imageData, 0, 0);

		const canvas = document.createElement("canvas");
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });

		ctx.translate(0, canvas.height);
		ctx.scale(1, -1);
		ctx.drawImage(tempCanvas, 0, 0);

		return ctx.getImageData(0, 0, imageData.width, imageData.height);
	}

	flipTextureHorizontal(imageData) {
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
		tempCtx.putImageData(imageData, 0, 0);

		const canvas = document.createElement("canvas");
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });

		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(tempCanvas, 0, 0);

		return ctx.getImageData(0, 0, imageData.width, imageData.height);
	}
}
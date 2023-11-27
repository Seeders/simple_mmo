import Unit from './Unit';

export default class NPC extends Unit {
    constructor(gameState, data) {
        super(gameState, data);
        this.type = this.stats.type;
        this.spriteSheetKey = this.type;
        delete this.stats.type;
    }
}

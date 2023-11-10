import Unit from './Unit';

export default class Enemy extends Unit {
    constructor(gameState, data) {
        super(gameState, data);
        this.type = this.stats.type;
        delete this.stats.type;
    }

}
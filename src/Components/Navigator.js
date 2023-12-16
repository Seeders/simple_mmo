import Component from './Component';
import { CONFIG } from '../Config/config';
export default class Navigator extends Component {
    constructor(parent, data) {
        super(parent, data);        
        this.path = data && data.path ? data.path : [];
    }

    setPath(path) {
        console.log('setPath', path);
        this.path = path;
        this.moveAlongPath();

    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
   
    moveAlongPath() {
        console.log("moveAlongPath");
        let nextStep = 0;
        let t = 0; // Interpolation factor
        const updateRate = 100; // Milliseconds, adjust as needed

        const move = () => {
            console.log("move", this.path);
            if (nextStep < this.path.length) {  
                let roadBonus = this.parent.isOnRoad ? 1.5 : this.parent.gameState.getTerrainCost({ x: parseInt(parseInt(this.parent.position.x) / CONFIG.tileSize),  y: parseInt(parseInt(this.parent.position.y) / CONFIG.tileSize)});
   
                let start = { x: this.parent.position.x, y: this.parent.position.y };
                let end = { x: this.path[nextStep].x * CONFIG.tileSize, y: this.path[nextStep].y * CONFIG.tileSize };
                t += (updateRate * roadBonus * this.parent.stats['move_speed']) / 1000;
        
                let newPosition = { x: this.lerp(start.x, end.x, t), y: this.lerp(start.y, end.y, t) };

                this.parent.position = newPosition;

                if (t >= 1) {
                    t = 0;
                    nextStep++;
                }
            } else {
                this.parent.playerMoveDestination = null;
                this.path = null;
                clearInterval(this.moveInterval);
            }
        };
        if(this.moveInterval){
            // Clear any existing interval and start a new one
            clearInterval(this.moveInterval);
        }
        this.moveInterval = setInterval(move, updateRate);

        // Modify handleClick or any other function that sets a new destination
        // to clear and reset the interval when a new destination is clicked
    }
}

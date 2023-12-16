import Component from './Component';

export default class Inventory extends Component {
    constructor(parent, data) {
        super(parent, data);
        this.inventory = this.data.inventory;
    }
}

export default class Pathfinding {
    constructor(terrain, costs) {
        this.terrain = terrain; // Terrain should provide access to the game grid and movement costs
		this.costs = costs
    }

    aStar(start, goal) {
		let openSet = new PriorityQueue((a, b) => a.f < b.f, this._isEqual.bind(this));
		let cameFrom = new Map();
		let gScore = new Map();
		let fScore = new Map();
		let closedSet = new Set();
		let closestNode = start; // Keep track of the node closest to the goal
		let closestNodeDistance = this._heuristic(start, goal);
		
		gScore.set(this._hash(start), 0);
		fScore.set(this._hash(start), closestNodeDistance);
	
		openSet.enqueue({ position: start, f: closestNodeDistance });
		
		while (!openSet.isEmpty()) {
			let current = openSet.dequeue().position;
			// Add current node to closed set
			closedSet.add(this._hash(current));
			if (this._isEqual(current, goal)) {
				return this._reconstructPath(cameFrom, current);
			}
	
			let currentDistance = this._heuristic(current, goal);
			if (currentDistance < closestNodeDistance) {
				closestNode = current;
				closestNodeDistance = currentDistance;
			}
	
			for (let neighbor of this._getNeighbors(current)) {
				// Skip if neighbor is in closed set
				if (closedSet.has(this._hash(neighbor))) {
					continue;
				}
				let tentativeGScore = gScore.get(this._hash(current)) + this._cost(neighbor);

				if (tentativeGScore < (gScore.get(this._hash(neighbor)) || Infinity)) {
					cameFrom.set(this._hash(neighbor), current);
					gScore.set(this._hash(neighbor), tentativeGScore);
					fScore.set(this._hash(neighbor), tentativeGScore + this._heuristic(neighbor, goal));
	
					if (!openSet.contains(neighbor)) {
						openSet.enqueue({ position: neighbor, f: fScore.get(this._hash(neighbor)) });
					}
				}
			}
		}
	
		// If no path is found, check if the closest node is the start node
		if (this._isEqual(closestNode, start)) {
			return []; // Return an empty path if the closest node is the start node
		} else {
			return this._reconstructPath(cameFrom, closestNode); // Return the path to the closest node
		}
	}
	

    _heuristic(nodeA, nodeB) {
        // Use Manhattan distance as the heuristic
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    _cost(node) {
        // Use the node's position to get the terrain type, and then the cost for that type
        const terrainType = this.terrain[node.y][node.x];
        return this.costs[terrainType];
    }

	_getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }  // West
            // Add more directions here if you allow diagonal movement
        ];

        directions.forEach(dir => {
            const neighborX = node.x + dir.x;
            const neighborY = node.y + dir.y;

            // Check if neighbor is within the bounds of the terrain
            if (neighborX >= 0 && neighborX < this.terrain[0].length && neighborY >= 0 && neighborY < this.terrain.length) {
                const terrainType = this.terrain[neighborY][neighborX];
				// Check if the terrain type is passable (cost > 0)
				if (this.costs[terrainType] > 0) {
					neighbors.push({ x: neighborX, y: neighborY });
				}
            }
        });

        return neighbors;
    }

	_reconstructPath(cameFrom, current) {
		let totalPath = [current];
	
		while (cameFrom.has(this._hash(current))) {
			current = cameFrom.get(this._hash(current));
			totalPath.unshift(current);
		}
	
		return totalPath;
	}

    _isEqual(nodeA, nodeB) {
        return nodeA.x === nodeB.x && nodeA.y === nodeB.y;
    }

    _hash(node) {
        return `${node.x},${node.y}`;
    }
}

class PriorityQueue {
    constructor(comparator = (a, b) => a > b, equals = (a, b) => a === b) {
        this._heap = [];
        this._comparator = comparator;
        this._equals = equals; // New equality function		
    }

    enqueue(value) {
        this._heap.push(value);
        this._siftUp();
    }

    dequeue() {
        const result = this._heap[0];
        const end = this._heap.pop();

        if (this._heap.length > 0) {
            this._heap[0] = end;
            this._siftDown();
        }

        return result;
    }

    isEmpty() {
        return this._heap.length === 0;
    }

    contains(node) {
        return this._heap.some(element => this._equals(element.position, node));
    }

    _siftUp() {
        let nodeIndex = this._heap.length - 1;

        while (nodeIndex > 0 && this._compare(nodeIndex, this._parent(nodeIndex))) {
            this._swap(nodeIndex, this._parent(nodeIndex));
            nodeIndex = this._parent(nodeIndex);
        }
    }

    _siftDown() {
        let nodeIndex = 0;

        while (
            (this._left(nodeIndex) < this._heap.length && this._compare(this._left(nodeIndex), nodeIndex)) ||
            (this._right(nodeIndex) < this._heap.length && this._compare(this._right(nodeIndex), nodeIndex))
        ) {
            let maxChild = (this._right(nodeIndex) < this._heap.length && this._compare(this._right(nodeIndex), this._left(nodeIndex))) ? this._right(nodeIndex) : this._left(nodeIndex);

            this._swap(nodeIndex, maxChild);
            nodeIndex = maxChild;
        }
    }

    _parent(index) {
        return ((index - 1) >> 1);
    }

    _left(index) {
        return (2 * index + 1);
    }

    _right(index) {
        return (2 * index + 2);
    }

    _compare(i, j) {
        return this._comparator(this._heap[i], this._heap[j]);
    }

    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }
}

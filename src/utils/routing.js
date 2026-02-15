
import campusData from '../data/campusData';

class RoutingEngine {
    constructor() {
        this.graph = new Map();
        this.allNodes = [];
        this.buildGraph();
    }

    // Build a graph from GeoJSON LineStrings (roads and walkways)
    buildGraph() {
        const features = campusData.features.filter(f =>
            (f.properties.type === 'road' || f.properties.type === 'walkway') &&
            f.geometry.type === 'LineString'
        );

        features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i];
                const p2 = coords[i + 1];

                const node1 = this.getNodeKey(p1);
                const node2 = this.getNodeKey(p2);

                this.addEdge(node1, node2, this.getDistance(p1, p2));
                this.addEdge(node2, node1, this.getDistance(p1, p2));
            }
        });

        // Connect intersections (points that are very close to each other but not identical)
        const threshold = 0.00005; // approx 5 meters
        const nodes = Array.from(this.graph.keys());

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const p1 = this.parseNodeKey(nodes[i]);
                const p2 = this.parseNodeKey(nodes[j]);
                const dist = this.getDistance(p1, p2);

                if (dist < threshold * 111320) { // rough lat/lng to meters
                    this.addEdge(nodes[i], nodes[j], dist);
                    this.addEdge(nodes[j], nodes[i], dist);
                }
            }
        }
    }

    getNodeKey(coord) {
        return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    }

    parseNodeKey(key) {
        return key.split(',').map(Number);
    }

    addEdge(u, v, weight) {
        if (!this.graph.has(u)) this.graph.set(u, []);
        // Check if edge already exists to avoid duplicates
        if (!this.graph.get(u).find(edge => edge.node === v)) {
            this.graph.get(u).push({ node: v, weight });
        }
    }

    getDistance(c1, c2) {
        const dx = c1[0] - c2[0];
        const dy = c1[1] - c2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearestNode(coord) {
        let minDist = Infinity;
        let nearest = null;

        for (const nodeKey of this.graph.keys()) {
            const nodeCoord = this.parseNodeKey(nodeKey);
            const dist = this.getDistance(coord, nodeCoord);
            if (dist < minDist) {
                minDist = dist;
                nearest = nodeKey;
            }
        }
        return nearest;
    }

    // Dijkstra's Algorithm
    findPath(startCoord, endCoord) {
        const startNode = this.findNearestNode(startCoord);
        const endNode = this.findNearestNode(endCoord);

        if (!startNode || !endNode) return null;

        const distances = new Map();
        const previous = new Map();
        const pq = new PriorityQueue();

        for (const node of this.graph.keys()) {
            distances.set(node, Infinity);
        }
        distances.set(startNode, 0);
        pq.enqueue(startNode, 0);

        while (!pq.isEmpty()) {
            const { element: currNode } = pq.dequeue();

            if (currNode === endNode) {
                const path = [];
                let temp = currNode;
                while (temp) {
                    path.push(this.parseNodeKey(temp));
                    temp = previous.get(temp);
                }
                return path.reverse();
            }

            const neighbors = this.graph.get(currNode) || [];
            neighbors.forEach(neighbor => {
                const alt = distances.get(currNode) + neighbor.weight;
                if (alt < distances.get(neighbor.node)) {
                    distances.set(neighbor.node, alt);
                    previous.set(neighbor.node, currNode);
                    pq.enqueue(neighbor.node, alt);
                }
            });
        }

        return null; // No path found
    }
    // For Debugging: Export graph as GeoJSON
    getGraphGeoJSON() {
        const features = [];

        // Add Nodes
        for (const [key, neighbors] of this.graph.entries()) {
            const coord = this.parseNodeKey(key);
            features.push({
                type: 'Feature',
                properties: { type: 'node' },
                geometry: { type: 'Point', coordinates: coord }
            });

            // Add Edges
            neighbors.forEach(neighbor => {
                const neighborCoord = this.parseNodeKey(neighbor.node);
                features.push({
                    type: 'Feature',
                    properties: { type: 'edge' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [coord, neighborCoord]
                    }
                });
            });
        }
        return { type: 'FeatureCollection', features };
    }

    // Drift Correction: Find nearest point on any edge in the graph
    snapToRoad(coord) {
        let minDistance = Infinity;
        let snappedPoint = coord;

        for (const [uKey, neighbors] of this.graph.entries()) {
            const p1 = this.parseNodeKey(uKey);
            neighbors.forEach(neighbor => {
                const p2 = this.parseNodeKey(neighbor.node);
                const projected = this.getNearestPointOnSegment(coord, p1, p2);
                const dist = this.getDistance(coord, projected);

                if (dist < minDistance) {
                    minDistance = dist;
                    snappedPoint = projected;
                }
            });
        }

        // Only snap if we are within a reasonable distance (e.g., 20m)
        return minDistance < 0.0002 ? snappedPoint : coord;
    }

    getNearestPointOnSegment(p, a, b) {
        const atob = [b[0] - a[0], b[1] - a[1]];
        const atop = [p[0] - a[0], p[1] - a[1]];
        const len = atob[0] * atob[0] + atob[1] * atob[1];
        let dot = atop[0] * atob[0] + atop[1] * atob[1];
        let t = Math.min(1, Math.max(0, dot / len));
        return [a[0] + atob[0] * t, a[1] + atob[1] * t];
    }
}

class PriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        if (!added) this.items.push(queueElement);
    }
    dequeue() {
        return this.items.shift();
    }
    isEmpty() {
        return this.items.length === 0;
    }
}

export const routingEngine = new RoutingEngine();

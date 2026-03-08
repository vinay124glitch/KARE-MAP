
import campusData from '../data/campusData';

class RoutingEngine {
    constructor() {
        this.graph = new Map();
        this.roadSegments = []; // Store all road segments for snapping
        this.buildGraph();
    }

    /**
     * Build the routing graph ONLY from actual road features.
     * Walkways are building outlines and should NOT be routable.
     */
    buildGraph() {
        // ONLY use type === 'road' for routing (actual campus roads)
        const roadFeatures = campusData.features.filter(f =>
            f.properties.type === 'road' &&
            f.geometry.type === 'LineString'
        );

        console.log(`[RoutingEngine] Building graph from ${roadFeatures.length} road features`);

        roadFeatures.forEach(feature => {
            const coords = feature.geometry.coordinates;
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i];
                const p2 = coords[i + 1];

                // Store segment for snapping
                this.roadSegments.push([p1, p2]);

                // Add densified intermediate nodes for long segments
                const segDist = this.haversineDistance(p1, p2);
                const DENSIFY_THRESHOLD = 30; // meters
                if (segDist > DENSIFY_THRESHOLD) {
                    const numIntermediate = Math.ceil(segDist / DENSIFY_THRESHOLD);
                    let prevCoord = p1;
                    for (let k = 1; k <= numIntermediate; k++) {
                        const t = k / (numIntermediate + 1);
                        const interCoord = [
                            p1[0] + (p2[0] - p1[0]) * t,
                            p1[1] + (p2[1] - p1[1]) * t
                        ];
                        const prevKey = this.getNodeKey(prevCoord);
                        const interKey = this.getNodeKey(interCoord);
                        const d = this.haversineDistance(prevCoord, interCoord);
                        this.addEdge(prevKey, interKey, d);
                        this.addEdge(interKey, prevKey, d);
                        prevCoord = interCoord;
                    }
                    // Connect last intermediate to p2
                    const prevKey = this.getNodeKey(prevCoord);
                    const endKey = this.getNodeKey(p2);
                    const d = this.haversineDistance(prevCoord, p2);
                    this.addEdge(prevKey, endKey, d);
                    this.addEdge(endKey, prevKey, d);
                } else {
                    const node1 = this.getNodeKey(p1);
                    const node2 = this.getNodeKey(p2);
                    this.addEdge(node1, node2, segDist);
                    this.addEdge(node2, node1, segDist);
                }
            }
        });

        // Connect intersection nodes that are very close together
        const INTERSECTION_THRESHOLD = 15; // meters
        const nodes = Array.from(this.graph.keys());

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const p1 = this.parseNodeKey(nodes[i]);
                const p2 = this.parseNodeKey(nodes[j]);
                const dist = this.haversineDistance(p1, p2);

                if (dist < INTERSECTION_THRESHOLD) {
                    this.addEdge(nodes[i], nodes[j], dist);
                    this.addEdge(nodes[j], nodes[i], dist);
                }
            }
        }

        console.log(`[RoutingEngine] Graph built with ${this.graph.size} nodes`);
    }

    getNodeKey(coord) {
        return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    }

    parseNodeKey(key) {
        return key.split(',').map(Number);
    }

    addEdge(u, v, weight) {
        if (!this.graph.has(u)) this.graph.set(u, []);
        if (!this.graph.get(u).find(edge => edge.node === v)) {
            this.graph.get(u).push({ node: v, weight });
        }
    }

    /**
     * Haversine distance in meters between two [lng, lat] coords
     */
    haversineDistance(c1, c2) {
        const R = 6371e3;
        const toRad = deg => deg * Math.PI / 180;
        const dLat = toRad(c2[1] - c1[1]);
        const dLng = toRad(c2[0] - c1[0]);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(c1[1])) * Math.cos(toRad(c2[1])) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Simple Euclidean distance for quick comparison
     */
    getDistance(c1, c2) {
        const dx = c1[0] - c2[0];
        const dy = c1[1] - c2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Find nearest graph node to a coordinate.
     * Uses haversine for accuracy.
     */
    findNearestNode(coord) {
        let minDist = Infinity;
        let nearest = null;

        for (const nodeKey of this.graph.keys()) {
            const nodeCoord = this.parseNodeKey(nodeKey);
            const dist = this.haversineDistance(coord, nodeCoord);
            if (dist < minDist) {
                minDist = dist;
                nearest = nodeKey;
            }
        }
        return nearest;
    }

    /**
     * Find nearest point on any road segment (for accurate snapping)
     */
    findNearestRoadPoint(coord) {
        let minDist = Infinity;
        let bestPoint = coord;

        for (const [p1, p2] of this.roadSegments) {
            const projected = this.getNearestPointOnSegment(coord, p1, p2);
            const dist = this.haversineDistance(coord, projected);
            if (dist < minDist) {
                minDist = dist;
                bestPoint = projected;
            }
        }

        return { point: bestPoint, distance: minDist };
    }

    /**
     * Dijkstra's Algorithm - finds shortest path along roads only
     */
    findPath(startCoord, endCoord) {
        const startNode = this.findNearestNode(startCoord);
        const endNode = this.findNearestNode(endCoord);

        if (!startNode || !endNode) return null;
        if (startNode === endNode) {
            return [this.parseNodeKey(startNode)];
        }

        const distances = new Map();
        const previous = new Map();
        const visited = new Set();
        const pq = new PriorityQueue();

        for (const node of this.graph.keys()) {
            distances.set(node, Infinity);
        }
        distances.set(startNode, 0);
        pq.enqueue(startNode, 0);

        while (!pq.isEmpty()) {
            const { element: currNode } = pq.dequeue();

            if (visited.has(currNode)) continue;
            visited.add(currNode);

            if (currNode === endNode) {
                // Reconstruct path
                const path = [];
                let temp = currNode;
                while (temp) {
                    path.push(this.parseNodeKey(temp));
                    temp = previous.get(temp);
                }
                const result = path.reverse();

                // Prepend the actual start point (snapped to road)
                const startSnap = this.findNearestRoadPoint(startCoord);
                if (startSnap.distance < 100) {
                    result.unshift(startSnap.point);
                }

                // Append the actual destination point (snapped to road)
                const endSnap = this.findNearestRoadPoint(endCoord);
                if (endSnap.distance < 100) {
                    result.push(endSnap.point);
                }

                return result;
            }

            const neighbors = this.graph.get(currNode) || [];
            for (const neighbor of neighbors) {
                if (visited.has(neighbor.node)) continue;
                const alt = distances.get(currNode) + neighbor.weight;
                if (alt < distances.get(neighbor.node)) {
                    distances.set(neighbor.node, alt);
                    previous.set(neighbor.node, currNode);
                    pq.enqueue(neighbor.node, alt);
                }
            }
        }

        // Dijkstra failed - try connecting via closest intermediate road node
        console.warn('[RoutingEngine] No direct path found, trying intermediate routing...');
        return this.findPathViaIntermediate(startCoord, endCoord);
    }

    /**
     * Fallback: try routing via the midpoint of the campus road network
     */
    findPathViaIntermediate(startCoord, endCoord) {
        // Find all graph nodes, pick those near the midline of campus
        const campusMidLng = 77.6780;
        const campusMidLat = 9.5750;

        let closestToMid = null;
        let minDistToMid = Infinity;

        for (const nodeKey of this.graph.keys()) {
            const coord = this.parseNodeKey(nodeKey);
            const dist = this.haversineDistance(coord, [campusMidLng, campusMidLat]);
            if (dist < minDistToMid) {
                minDistToMid = dist;
                closestToMid = nodeKey;
            }
        }

        if (!closestToMid) return null;

        // Try routing start->mid and mid->end
        const startNode = this.findNearestNode(startCoord);
        const midNode = closestToMid;
        const endNode = this.findNearestNode(endCoord);

        const path1 = this._dijkstra(startNode, midNode);
        const path2 = this._dijkstra(midNode, endNode);

        if (path1 && path2) {
            // Combine, removing duplicate mid node
            return [...path1, ...path2.slice(1)];
        }

        // Last resort: return road-snapped endpoints connected via nearest road nodes
        const startSnap = this.findNearestRoadPoint(startCoord);
        const endSnap = this.findNearestRoadPoint(endCoord);
        return [startSnap.point, endSnap.point];
    }

    /**
     * Internal Dijkstra without fallback (to avoid recursion)
     */
    _dijkstra(startNode, endNode) {
        if (!startNode || !endNode || !this.graph.has(startNode) || !this.graph.has(endNode)) return null;

        const distances = new Map();
        const previous = new Map();
        const visited = new Set();
        const pq = new PriorityQueue();

        for (const node of this.graph.keys()) {
            distances.set(node, Infinity);
        }
        distances.set(startNode, 0);
        pq.enqueue(startNode, 0);

        while (!pq.isEmpty()) {
            const { element: currNode } = pq.dequeue();
            if (visited.has(currNode)) continue;
            visited.add(currNode);

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
            for (const neighbor of neighbors) {
                if (visited.has(neighbor.node)) continue;
                const alt = distances.get(currNode) + neighbor.weight;
                if (alt < distances.get(neighbor.node)) {
                    distances.set(neighbor.node, alt);
                    previous.set(neighbor.node, currNode);
                    pq.enqueue(neighbor.node, alt);
                }
            }
        }
        return null;
    }

    /**
     * Export graph as GeoJSON for debugging
     */
    getGraphGeoJSON() {
        const features = [];

        for (const [key, neighbors] of this.graph.entries()) {
            const coord = this.parseNodeKey(key);
            features.push({
                type: 'Feature',
                properties: { type: 'node' },
                geometry: { type: 'Point', coordinates: coord }
            });

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

    /**
     * Snap a coordinate to the nearest road.
     * Used for drift correction during live navigation.
     */
    snapToRoad(coord) {
        const { point, distance } = this.findNearestRoadPoint(coord);
        // Only snap if within ~25m of a road
        return distance < 25 ? point : coord;
    }

    getNearestPointOnSegment(p, a, b) {
        const atob = [b[0] - a[0], b[1] - a[1]];
        const atop = [p[0] - a[0], p[1] - a[1]];
        const len = atob[0] * atob[0] + atob[1] * atob[1];
        if (len === 0) return a; // a and b are the same point
        const dot = atop[0] * atob[0] + atop[1] * atob[1];
        const t = Math.min(1, Math.max(0, dot / len));
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

export class Node {
    constructor(id) {
        this.id = id;

        this.connectedNodes = [];
        this.inEdges = [];
        this.outEdges = [];
        this.drawData = {};
    }

    connectedTo(node) {
        for (var i = 0; i < this.connectedNodes.length; i++) {
            var connectedNode = this.connectedNodes[i];
            if (connectedNode.id == node.id) {
                return true;
            }
        }
        return false;
    }

    addConnected(node) {
        if (!this.connectedTo(node)) {
            this.connectedNodes.push(node);
            node.connectedNodes.push(this);
            return true;
        }
        return false;
    }
}

export class Edge {
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}


export class Graph {
    constructor() {
        this.nodes = [];
        this.nodeSet = {};
        this.edges = [];
    }

    addNode(node) {
        if (this.nodeSet[node.id] === undefined) {
            this.nodeSet[node.id] = node;
            this.nodes.push(node);
            return true;
        }
        return false;
    }

    addEdge(source, target) {
        if (source.addConnected(target)) {
            var edge = new Edge(source, target);
            this.edges.push(edge);
            source.outEdges.push(edge);
            target.inEdges.push(edge);
            return true;
        }
        return false;
    }
}
import * as THREE from 'three';
import { Graph, Node } from './graph.js';
import { SimulatedAnnealing } from './simulatedAnnealing.js';

function createGraph(options) {
    // Create an instance of the graph
    const graph = new Graph();

    // Add random nodes to the graph
    for (let i = 0; i < options.numNodes; i++) {
        const node = new Node(i);
        graph.addNode(node);
    }

    // Add random edges to the graph
    for (let i = 0; i < options.numEdges; i++) {
        // Choose random node
        let sourceIndex = Math.floor(Math.random() * options.numNodes);
        let targetIndex = Math.floor(Math.random() * options.numNodes);

        // Make sure we don't connect a node to itself
        if (options.numNodes > 1) {
            while (sourceIndex == targetIndex) {
                targetIndex = Math.floor(Math.random() * options.numNodes);
            }
        }

        // Make sure we don't duplicate edges
        while (graph.nodes[sourceIndex].connectedTo(graph.nodes[targetIndex])) {
            // Choose random node
            sourceIndex = Math.floor(Math.random() * options.numNodes);
            targetIndex = Math.floor(Math.random() * options.numNodes);

            // Make sure we don't connect a node to itself
            if (options.numNodes > 1) {
                while (sourceIndex == targetIndex) {
                    targetIndex = Math.floor(Math.random() * options.numNodes);
                }
            }
        }

        // Get the nodes
        const sourceNode = graph.nodes[sourceIndex];
        const targetNode = graph.nodes[targetIndex];
        graph.addEdge(sourceNode, targetNode);
    }

    // Make sure each node is connected to at least one other node
    for (let i = 0; i < options.numNodes; i++) {
        if (graph.nodes[i].connectedNodes.length == 0) {
            // Choose random node
            let targetIndex = Math.floor(Math.random() * options.numNodes);

            // Make sure we don't connect a node to itself
            if (options.numNodes > 1) {
                while (i == targetIndex) {
                    targetIndex = Math.floor(Math.random() * options.numNodes);
                }
            }

            // Get the nodes
            const targetNode = graph.nodes[targetIndex];
            graph.addEdge(graph.nodes[i], targetNode);
        }
    }

    // Make sure that the graph is connected
    const connectedNodes = [];
    const queue = [];

    queue.push(graph.nodes[0]);
    connectedNodes.push(graph.nodes[0]);

    // Do a breadth-first search to find all connected nodes
    while (queue.length > 0) {
        const node = queue.shift();
        for (let i = 0; i < node.connectedNodes.length; i++) {
            const connectedNode = node.connectedNodes[i];
            if (!connectedNodes.includes(connectedNode)) {
                connectedNodes.push(connectedNode);
                queue.push(connectedNode);
            }
        }
    }

    // Connect the unconnected nodes
    for (let i = 0; i < graph.nodes.length; i++) {
        const node = graph.nodes[i];
        if (!connectedNodes.includes(node)) {

            // If the node is not connected, connect it with a random connected node
            let connectedNodeIndex = Math.floor(Math.random() * connectedNodes.length);
            const connectedNode = connectedNodes[connectedNodeIndex];
            graph.addEdge(node, connectedNode);
        }
    }

    console.log("Graph created with " + graph.nodes.length + " nodes and " + graph.edges.length + " edges")
    options.numEdges = graph.edges.length;
    options.lambda3 = ((options.numEdges)/(options.numNodes * (options.numNodes - 1))) * 0.05;
    options.lambda4 = (1 - Math.sqrt((options.numEdges)/(options.numNodes * (options.numNodes - 1)))) * 2.0;

    return graph;
}

function drawGraph(graph, options) {
    const scene = new THREE.Scene();
    const sceneGeometriesToUpdate = [];

    // Draw the nodes
    for (let i = 0; i < graph.nodes.length; i++) {
        const node = graph.nodes[i];

        // random color for material
        const color = Math.random() * 0xffffff;

        // create node geometry
        var nodeGeometry, nodeMaterial;
        if (options.graphType == "2d") {
            nodeGeometry = new THREE.CircleGeometry(options.circleSize);
            nodeMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8});
        }
        else {
            nodeGeometry = new THREE.SphereGeometry(options.sphereSize);
            //nodeMaterial = new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: 0.8});
            nodeMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8});
        }

        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

        // random position for node between scene boundary (0 +- gridSpace)
        nodeMesh.position.x = Math.random() * (options.gridSpace * 2) - options.gridSpace;
        nodeMesh.position.y = Math.random() * (options.gridSpace * 2) - options.gridSpace;

        if (options.graphType == "3d") {
            nodeMesh.position.z = Math.random() * (options.gridSpace * 2) - options.gridSpace;
        }

        node.drawData.mesh = nodeMesh;

        scene.add(nodeMesh);

        if (options.graphType == "3d") {
            const light = new THREE.PointLight(0xffffff, 1, 300);
            light.position.set(0, 0, 5);
            scene.add(light);

            const light2 = new THREE.PointLight(0xffffff, 1, 300);
            light2.position.set(0, 5, 0);
            scene.add(light2);

            const light3 = new THREE.PointLight(0xffffff, 1, 300);
            light3.position.set(5, 0, 0);
            scene.add(light3);
        }
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0f0f0f, transparent: true, opacity: 0.8});
    for (let i = 0; i < graph.edges.length; i++) {
        const edge = graph.edges[i];
        const lineGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(2 * 3);

        // TODO: verify this works when data is updated
        positions[0] = edge.source.drawData.mesh.position.x;
        positions[1] = edge.source.drawData.mesh.position.y;

        if (options.graphType == "3d") {
            positions[2] = edge.source.drawData.mesh.position.z;
        }
        else {
            positions[2] = 0;
        }

        positions[3] = edge.target.drawData.mesh.position.x;
        positions[4] = edge.target.drawData.mesh.position.y;

        if (options.graphType == "3d") {
            positions[5] = edge.target.drawData.mesh.position.z;
        }
        else {
            positions[5] = 0;
        }

        lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.frustumCulled = false;

        sceneGeometriesToUpdate.push(line);
        scene.add(line);
    }

    return {
        scene, 
        sceneGeometriesToUpdate
    };
}

export function restartScene(options) {
    const graph = createGraph(options);
    const {scene, sceneGeometriesToUpdate} = drawGraph(graph, options);
    const simulatedAnneaing = new SimulatedAnnealing(graph, options);
    return {
        graph,
        scene,
        sceneGeometriesToUpdate,
        simulatedAnneaing
    };
}

export function updateSceneGeometries(graph, sceneGeometriesToUpdate, options) {
    for (let i = 0; i < sceneGeometriesToUpdate.length; i++) {
        const edge = graph.edges[i];
        const line = sceneGeometriesToUpdate[i];

        var positions = [];

        positions.push(edge.source.drawData.mesh.position.x);
        positions.push(edge.source.drawData.mesh.position.y);

        if (options.graphType == "3d") {
            positions.push(edge.source.drawData.mesh.position.z);
        }
        else {
            positions.push(0);
        }

        positions.push(edge.target.drawData.mesh.position.x);
        positions.push(edge.target.drawData.mesh.position.y);

        if (options.graphType == "3d") {
            positions.push(edge.target.drawData.mesh.position.z);
        }
        else {
            positions.push(0);
        }

        line.geometry.getAttribute('position').set(new Float32Array(positions));
        line.geometry.getAttribute('position').needsUpdate = true;
    }
}
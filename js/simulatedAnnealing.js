import { Node, Edge, Graph } from './graph.js';
import * as THREE from 'three';

export class SimulatedAnnealing {
    constructor(graph, options) {
        this.options = options;
        this.graph = graph;

        if (this.options.graphType == "2d") {
            // initialize and set up the simulated annealing algorithm
            this.temperature = 0.02 * Math.sqrt(this.options.numNodes);
            this.max_iterations = 100000;
            this.max_stages = 25;
            this.iteration = 0;
            this.stages = 0;
            this.iterationSinceLast = 0;
            this.rangeCircleRadius = 1.0 * this.options.gridSpace * Math.max(1, (this.options.numNodes / 20));

            this.previousTotalEnergy = Infinity;
            this.previousNodeDistributionEnergy = Infinity;
            this.previousBorderlineEnergy = Infinity;
            this.previousEdgeLengthEnergy = Infinity;
            this.previousEdgeCrossingEnergy = Infinity;

            this.computeInitial2DEnergy();
        }

        if (this.options.graphType == "3d") {
            // initialize and set up the simulated annealing algorithm
            this.temperature = 0.2;
            this.max_iterations = 100000;
            this.max_stages = 25;
            this.iteration = 0;
            this.stages = 0;
            this.iterationSinceLast = 0;
            this.rangeCircleRadius = 1.0 * this.options.gridSpace * Math.max(1, (this.options.numNodes / 20));

            this.previousTotalEnergy = Infinity;
            this.previousNodeDistributionEnergy = Infinity;
            this.previousBorderlineEnergy = Infinity;
            this.previousEdgeLengthEnergy = Infinity;
            this.previousGravitationalEnergy = Infinity;

            this.computeInitial3DEnergy();
        }
    }

    update() {
        if (this.options.graphType == "2d") {
            this.update2D();
        }
        else if (this.options.graphType == "3d") {
            this.update3D();
        }
    }

    update2D() {
        if (this.iteration < this.max_iterations && this.stages < this.max_stages && this.temperature > 0.0001) {
            this.iteration += 1;
            this.iterationSinceLast += 1;

            if (this.iterationSinceLast > 30 * this.graph.nodes.length) {
                this.temperature = this.temperature * 0.8;
                this.iterationSinceLast = 0;
                this.stages += 1;
            }

            // choose random node
            var randomNodeIndex = Math.floor(Math.random() * this.graph.nodes.length);
            var randomNode = this.graph.nodes[randomNodeIndex];
            var currentNodeLocation = randomNode.drawData.mesh.position;

            var oldNodeLocation = currentNodeLocation.clone();

            // choose random node offset
            var nodeOffset = new THREE.Vector3().randomDirection();
            nodeOffset.z = 0;
            nodeOffset.normalize();

            // range circle radius should be decreasing slowler than linearly
            var scalar = 1 - (this.stages / this.max_stages);
            if (scalar < 0.5) {
                scalar = 0.5;
            }
            // random between 0.03 and current value
            scalar = Math.random() * (scalar - 0.03) + 0.03;

            nodeOffset.multiplyScalar(this.rangeCircleRadius * scalar);

            // compute new node location
            var newNodeLocation = currentNodeLocation.clone();
            newNodeLocation.add(nodeOffset);

            // if outside the grid space then choose random offset direction again
            // apply an epsilon to the grid space to prevent nodes from being placed on the border
            var spaceMultiplier = Math.max(1, (this.options.numNodes / 20));
            var leftBorder = (this.options.gridSpace * spaceMultiplier) - 0.1;
            var rightBorder = (-this.options.gridSpace * spaceMultiplier) + 0.1;
            var topBorder = (this.options.gridSpace * spaceMultiplier) - 0.1;
            var bottomBorder = (-this.options.gridSpace * spaceMultiplier) + 0.1;

            // var leftBorder = this.options.gridSpace - 0.1;
            // var rightBorder = -this.options.gridSpace + 0.1;
            // var topBorder = this.options.gridSpace - 0.1;
            // var bottomBorder = -this.options.gridSpace + 0.1;

            while (
                newNodeLocation.x > leftBorder ||
                newNodeLocation.x < rightBorder ||
                newNodeLocation.y > topBorder ||
                newNodeLocation.y < bottomBorder
            ) {
                nodeOffset = new THREE.Vector3().randomDirection();
                nodeOffset.z = 0;
                nodeOffset.normalize();
                nodeOffset.multiplyScalar(this.rangeCircleRadius * (scalar));
                newNodeLocation = currentNodeLocation.clone();
                newNodeLocation.add(nodeOffset);
            }

            currentNodeLocation.x = newNodeLocation.x;
            currentNodeLocation.y = newNodeLocation.y;
            currentNodeLocation.z = newNodeLocation.z;

            // Node distribution energy
            // compute node distribution energy
            var totalNodeDistributionEnergy = 0;
            for (var i = 0; i < this.graph.nodes.length; i++) {
                var node = this.graph.nodes[i];
                var nodeLocation = node.drawData.mesh.position;

                for (var j = i + 1; j < this.graph.nodes.length; j++) {
                    var otherNode = this.graph.nodes[j];
                    var otherNodeLocation = otherNode.drawData.mesh.position;

                    var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                    var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                    nodeDistanceEnergy = Math.min(nodeDistanceEnergy, this.options.lambda1);
                    totalNodeDistributionEnergy += nodeDistanceEnergy;
                }
            }
            /*var totalNodeDistributionEnergy = this.previousNodeDistributionEnergy;

            // Remove the energy on the original node location
            for (var i = 0; i < this.graph.nodes.length; i++) {
                var node = this.graph.nodes[i];
                var nodeLocation = node.drawData.mesh.position;

                if (node.id != randomNode.id) {
                    var nodeDistance = nodeLocation.distanceTo(currentNodeLocation);
                    var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                    totalNodeDistributionEnergy -= nodeDistanceEnergy;
                }
            }

            // Add the energy on the new node location
            for (var i = 0; i < this.graph.nodes.length; i++) {
                var node = this.graph.nodes[i];
                var nodeLocation = node.drawData.mesh.position;

                if (node.id != randomNode.id) {
                    var nodeDistance = nodeLocation.distanceTo(newNodeLocation);
                    var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                    totalNodeDistributionEnergy += nodeDistanceEnergy;
                }
            }*/

            // borderline energy
            var totalBorderlineEnergy = 0;
            /*var totalBorderlineEnergy = this.previousBorderlineEnergy;

            // Remove the energy on the original node location
            var oldLeftDistance = currentNodeLocation.distanceTo(new THREE.Vector3(this.options.gridSpace, 0, 0));
            var oldRightDistance = currentNodeLocation.distanceTo(new THREE.Vector3(-this.options.gridSpace, 0, 0));
            var oldTopDistance = currentNodeLocation.distanceTo(new THREE.Vector3(0, this.options.gridSpace, 0));
            var oldBottomDistance = currentNodeLocation.distanceTo(new THREE.Vector3(0, -this.options.gridSpace, 0));

            var horizontalBorderlineEnergy = 1 / Math.pow(oldLeftDistance, 2) + 1 / Math.pow(oldRightDistance, 2);
            var verticalBorderlineEnergy = 1 / Math.pow(oldTopDistance, 2) + 1 / Math.pow(oldBottomDistance, 2);
            totalBorderlineEnergy -= this.options.lambda2 * (horizontalBorderlineEnergy + verticalBorderlineEnergy);

            // Add the energy on the new node location
            var newLeftDistance = newNodeLocation.distanceTo(new THREE.Vector3(this.options.gridSpace, 0, 0));
            var newRightDistance = newNodeLocation.distanceTo(new THREE.Vector3(-this.options.gridSpace, 0, 0));
            var newTopDistance = newNodeLocation.distanceTo(new THREE.Vector3(0, this.options.gridSpace, 0));
            var newBottomDistance = newNodeLocation.distanceTo(new THREE.Vector3(0, -this.options.gridSpace, 0));

            horizontalBorderlineEnergy = 1 / Math.pow(newLeftDistance, 2) + 1 / Math.pow(newRightDistance, 2);
            verticalBorderlineEnergy = 1 / Math.pow(newTopDistance, 2) + 1 / Math.pow(newBottomDistance, 2);
            totalBorderlineEnergy += this.options.lambda2 * (horizontalBorderlineEnergy + verticalBorderlineEnergy);*/

            // edge length energy
            var totalEdgeLengthEnergy = 0;
            for (var i = 0; i < this.graph.edges.length; i++) {
                var edge = this.graph.edges[i];
                var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
                var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
                totalEdgeLengthEnergy += edgeLengthEnergy;
            }

            /*var totalEdgeLengthEnergy = this.previousEdgeLengthEnergy;
            for (var i = 0; i < randomNode.inEdges.length; i++) {
                // subtract the energy on the original edge
                var edge = randomNode.inEdges[i];
                var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
                var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
                totalEdgeLengthEnergy -= edgeLengthEnergy;

                // add the energy on the new edge, location is newNodeLocation
                var newEdgeLength = edge.source.drawData.mesh.position.distanceTo(newNodeLocation);
                var newEdgeLengthEnergy = this.options.lambda3 * Math.pow(newEdgeLength, 2);
                totalEdgeLengthEnergy += newEdgeLengthEnergy;
            }
            for (var i = 0; i < randomNode.outEdges.length; i++) {
                // subtract the energy on the original edge
                var edge = randomNode.outEdges[i];
                var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
                var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
                totalEdgeLengthEnergy -= edgeLengthEnergy;

                // add the energy on the new edge, location is newNodeLocation
                var newEdgeLength = newNodeLocation.distanceTo(edge.target.drawData.mesh.position);
                var newEdgeLengthEnergy = this.options.lambda3 * Math.pow(newEdgeLength, 2);
                totalEdgeLengthEnergy += newEdgeLengthEnergy;
            }*/

            // edge crossing energy
            var totalEdgeCrossingEnergy = 0;
            for (var i = 0; i < this.graph.edges.length; i++) {
                var edge = this.graph.edges[i];
                var edgeSourceLocation = edge.source.drawData.mesh.position;
                var edgeTargetLocation = edge.target.drawData.mesh.position;

                for (var j = i + 1; j < this.graph.edges.length; j++) {
                    var otherEdge = this.graph.edges[j];
                    var otherEdgeSourceLocation = otherEdge.source.drawData.mesh.position;
                    var otherEdgeTargetLocation = otherEdge.target.drawData.mesh.position;

                    // skip if edges share a node
                    if (edge.source.id == otherEdge.source.id || edge.source.id == otherEdge.target.id || edge.target.id == otherEdge.source.id || edge.target.id == otherEdge.target.id) {
                        continue;
                    }
    
                    if (this.lineSegmentIntersection(edgeSourceLocation, edgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                        totalEdgeCrossingEnergy += this.options.lambda4;
                    }
                }
            }
            /*
            var totalEdgeCrossingEnergy = this.previousEdgeCrossingEnergy;
            for (var i = 0; i < randomNode.inEdges.length; i++) {
                var edge = randomNode.inEdges[i];
                var edgeSourceLocation = edge.source.drawData.mesh.position;
                var edgeTargetLocation = edge.target.drawData.mesh.position;
                var newEdgeTargetLocation = newNodeLocation;

                for (var j = 0; j < this.graph.edges.length; j++) {
                    var otherEdge = this.graph.edges[j];
                    var otherEdgeSourceLocation = otherEdge.source.drawData.mesh.position;
                    var otherEdgeTargetLocation = otherEdge.target.drawData.mesh.position;

                    if (otherEdge.source.id == randomNode.id) {
                        continue;
                    }
                    else if (otherEdge.target.id == randomNode.id) {
                        continue;
                    }

                    if (this.lineSegmentIntersection(edgeSourceLocation, edgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                        totalEdgeCrossingEnergy -= this.options.lambda4;
                    }

                    if (this.lineSegmentIntersection(edgeSourceLocation, newEdgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                        totalEdgeCrossingEnergy += this.options.lambda4;
                    }
                }
            }
            for (var i = 0; i < randomNode.outEdges.length; i++) {
                var edge = randomNode.outEdges[i];
                var edgeSourceLocation = edge.source.drawData.mesh.position;
                var edgeTargetLocation = edge.target.drawData.mesh.position;
                var newEdgeSourceLocation = newNodeLocation;

                for (var j = 0; j < this.graph.edges.length; j++) {
                    var otherEdge = this.graph.edges[j];
                    var otherEdgeSourceLocation = otherEdge.source.drawData.mesh.position;
                    var otherEdgeTargetLocation = otherEdge.target.drawData.mesh.position;

                    if (otherEdge.source.id == randomNode.id) {
                        continue;
                    }
                    else if (otherEdge.target.id == randomNode.id) {
                        continue;
                    }

                    if (this.lineSegmentIntersection(edgeSourceLocation, edgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                        totalEdgeCrossingEnergy -= this.options.lambda4;
                    }

                    if (this.lineSegmentIntersection(newEdgeSourceLocation, edgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                        totalEdgeCrossingEnergy += this.options.lambda4;
                    }
                }
            }*/

            // TODO: node edge distance energy can be useful... but original work only uses it for fine-tuning

            var newTotalEnergy = totalNodeDistributionEnergy + totalBorderlineEnergy + totalEdgeLengthEnergy + totalEdgeCrossingEnergy;
            var deltaEnergy = this.previousTotalEnergy - newTotalEnergy; // e - e'
            /*console.log("delta energy: " + deltaEnergy);
            console.log("total energy: " + newTotalEnergy);
            console.log("temperature: " + this.temperature);
            console.log("node distribution energy: " + totalNodeDistributionEnergy);
            console.log("borderline energy: " + totalBorderlineEnergy);
            console.log("edge length energy: " + totalEdgeLengthEnergy);
            console.log("edge crossing energy: " + totalEdgeCrossingEnergy);*/

            if (deltaEnergy > 0) {
                // accept the new graph
                this.previousTotalEnergy = newTotalEnergy;
                this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
                this.previousBorderlineEnergy = totalBorderlineEnergy;
                this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
                this.previousEdgeCrossingEnergy = totalEdgeCrossingEnergy;

                //currentNodeLocation.x = newNodeLocation.x;
                //currentNodeLocation.y = newNodeLocation.y;
                //currentNodeLocation.z = newNodeLocation.z;
            }
            else {
                // accept the new graph with some probability
                var probability = Math.exp(deltaEnergy / this.temperature);
                //console.log("probability: " + probability);
                if (Math.random() < probability) {
                    // accept the new graph
                    this.previousTotalEnergy = newTotalEnergy;
                    this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
                    this.previousBorderlineEnergy = totalBorderlineEnergy;
                    this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
                    this.previousEdgeCrossingEnergy = totalEdgeCrossingEnergy;

                    //currentNodeLocation.x = newNodeLocation.x;
                    //currentNodeLocation.y = newNodeLocation.y;
                    //currentNodeLocation.z = newNodeLocation.z;
                }
                else {
                    // reject the new graph
                    currentNodeLocation.x = oldNodeLocation.x;
                    currentNodeLocation.y = oldNodeLocation.y;
                    currentNodeLocation.z = oldNodeLocation.z;
                }
            }
        }
    }

    computeInitial2DEnergy() {
        var totalNodeDistributionEnergy = 0;
        var totalBorderlineEnergy = 0;
        var totalEdgeLengthEnergy = 0;
        var totalEdgeCrossingEnergy = 0;

        // compute node distribution energy
        for (var i = 0; i < this.graph.nodes.length; i++) {
            var node = this.graph.nodes[i];
            var nodeLocation = node.drawData.mesh.position;

            for (var j = i + 1; j < this.graph.nodes.length; j++) {
                var otherNode = this.graph.nodes[j];
                var otherNodeLocation = otherNode.drawData.mesh.position;

                var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                totalNodeDistributionEnergy += nodeDistanceEnergy;
            }
        }

        // compute borderline energy
        for (var i = 0; i < this.graph.nodes.length; i++) {
            var node = this.graph.nodes[i];
            var nodeLocation = node.drawData.mesh.position;

            var leftDistance = nodeLocation.distanceTo(new THREE.Vector3(this.options.gridSpace, 0, 0));
            var rightDistance = nodeLocation.distanceTo(new THREE.Vector3(-this.options.gridSpace, 0, 0));
            var topDistance = nodeLocation.distanceTo(new THREE.Vector3(0, this.options.gridSpace, 0));
            var bottomDistance = nodeLocation.distanceTo(new THREE.Vector3(0, -this.options.gridSpace, 0));

            var horizontalBorderlineEnergy = 1 / Math.pow(leftDistance, 2) + 1 / Math.pow(rightDistance, 2);
            var verticalBorderlineEnergy = 1 / Math.pow(topDistance, 2) + 1 / Math.pow(bottomDistance, 2);
            totalBorderlineEnergy += this.options.lambda2 * (horizontalBorderlineEnergy + verticalBorderlineEnergy);
        }

        // compute edge length energy
        for (var i = 0; i < this.graph.edges.length; i++) {
            var edge = this.graph.edges[i];
            var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
            var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
            totalEdgeLengthEnergy += edgeLengthEnergy;
        }

        // compute edge crossing energy
        for (var i = 0; i < this.graph.edges.length; i++) {
            var edge = this.graph.edges[i];
            var edgeSourceLocation = edge.source.drawData.mesh.position;
            var edgeTargetLocation = edge.target.drawData.mesh.position;

            for (var j = i + 1; j < this.graph.edges.length; j++) {
                var otherEdge = this.graph.edges[j];
                var otherEdgeSourceLocation = otherEdge.source.drawData.mesh.position;
                var otherEdgeTargetLocation = otherEdge.target.drawData.mesh.position;

                // skip if edges share a node
                if (edge.source.id == otherEdge.source.id || edge.source.id == otherEdge.target.id || edge.target.id == otherEdge.source.id || edge.target.id == otherEdge.target.id) {
                    continue;
                }

                if (this.lineSegmentIntersection(edgeSourceLocation, edgeTargetLocation, otherEdgeSourceLocation, otherEdgeTargetLocation)) {
                    totalEdgeCrossingEnergy += this.options.lambda4;
                }
            }
        }

        this.previousTotalEnergy = totalNodeDistributionEnergy + totalBorderlineEnergy + totalEdgeLengthEnergy + totalEdgeCrossingEnergy;
        this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
        this.previousBorderlineEnergy = totalBorderlineEnergy;
        this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
        this.previousEdgeCrossingEnergy = totalEdgeCrossingEnergy;

        console.log("initial total energy: " + this.previousTotalEnergy);
        console.log("initial node distribution energy: " + this.previousNodeDistributionEnergy);
        console.log("initial borderline energy: " + this.previousBorderlineEnergy);
        console.log("initial edge length energy: " + this.previousEdgeLengthEnergy);
        console.log("initial edge crossing energy: " + this.previousEdgeCrossingEnergy);

    }

    update3D() {
        if (this.iteration < this.max_iterations && this.stages < this.max_stages && this.temperature > 0.0001) {
            this.iteration += 1;
            this.iterationSinceLast += 1;

            if (this.iterationSinceLast > 30 * this.graph.nodes.length) {
                this.temperature = this.temperature * 0.8;
                this.iterationSinceLast = 0;
                this.stages += 1;
            }

            // choose random node
            var randomNodeIndex = Math.floor(Math.random() * this.graph.nodes.length);
            var randomNode = this.graph.nodes[randomNodeIndex];
            var currentNodeLocation = randomNode.drawData.mesh.position;

            var oldNodeLocation = currentNodeLocation.clone();

            // choose random node offset
            var nodeOffset = new THREE.Vector3().randomDirection();
            nodeOffset.normalize();

            // range circle radius should be decreasing slowler than linearly
            var scalar = 1 - (this.stages / this.max_stages);
            if (scalar < 0.5) {
                scalar = 0.5;
            }
            // random between 0.03 and current value
            scalar = Math.random() * (scalar - 0.03) + 0.03;

            nodeOffset.multiplyScalar(this.rangeCircleRadius * scalar);

            // compute new node location
            var newNodeLocation = currentNodeLocation.clone();
            newNodeLocation.add(nodeOffset);

            // if outside the grid space then choose random offset direction again
            // apply an epsilon to the grid space to prevent nodes from being placed on the border
            var leftBorder = (this.options.gridSpace * 2) - 0.1;
            var rightBorder = (-this.options.gridSpace * 2) + 0.1;
            var topBorder = (this.options.gridSpace * 2) - 0.1;
            var bottomBorder = (-this.options.gridSpace * 2) + 0.1;
            var frontBorder = (this.options.gridSpace * 2) - 0.1;
            var backBorder = (-this.options.gridSpace * 2) + 0.1;

            while (
                newNodeLocation.x > leftBorder ||
                newNodeLocation.x < rightBorder ||
                newNodeLocation.y > topBorder ||
                newNodeLocation.y < bottomBorder ||
                newNodeLocation.z > frontBorder ||
                newNodeLocation.z < backBorder
            ) {
                nodeOffset = new THREE.Vector3().randomDirection();
                nodeOffset.normalize();
                nodeOffset.multiplyScalar(this.rangeCircleRadius * (scalar));
                newNodeLocation = currentNodeLocation.clone();
                newNodeLocation.add(nodeOffset);
            }

            currentNodeLocation.x = newNodeLocation.x;
            currentNodeLocation.y = newNodeLocation.y;
            currentNodeLocation.z = newNodeLocation.z;

            // Node distribution energy
            // compute node distribution energy
            var totalNodeDistributionEnergy = 0;
            for (var i = 0; i < this.graph.nodes.length; i++) {
                var node = this.graph.nodes[i];
                var nodeLocation = node.drawData.mesh.position;

                for (var j = i + 1; j < this.graph.nodes.length; j++) {
                    var otherNode = this.graph.nodes[j];
                    var otherNodeLocation = otherNode.drawData.mesh.position;

                    var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                    var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                    nodeDistanceEnergy = Math.min(nodeDistanceEnergy, this.options.lambda1);
                    totalNodeDistributionEnergy += nodeDistanceEnergy;
                }
            }

            // borderline energy
            var totalBorderlineEnergy = 0;

            // edge length energy
            var totalEdgeLengthEnergy = 0;
            for (var i = 0; i < this.graph.edges.length; i++) {
                var edge = this.graph.edges[i];
                var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
                var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
                totalEdgeLengthEnergy += edgeLengthEnergy;
            }

            // gravitational energy
            var totalGravitationalEnergy = 0;
            for (var i = 0; i < this.graph.nodes.length; i++) {
                var node = this.graph.nodes[i];
                var nodeLocation = node.drawData.mesh.position;

                for (var j = i + 1; j < this.graph.nodes.length; j++) {
                    var otherNode = this.graph.nodes[j];
                    var otherNodeLocation = otherNode.drawData.mesh.position;

                    var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                    var massMultiplier = node.connectedNodes.length * otherNode.connectedNodes.length;
                    var gravitationalEnergy = this.options.lambda5 * (massMultiplier / Math.pow(nodeDistance, 2));
                    totalGravitationalEnergy += gravitationalEnergy;
                }
            }

            var newTotalEnergy = totalNodeDistributionEnergy + totalBorderlineEnergy + totalEdgeLengthEnergy + totalGravitationalEnergy;
            var deltaEnergy = this.previousTotalEnergy - newTotalEnergy; // e - e'

            if (deltaEnergy > 0) {
                // accept the new graph
                this.previousTotalEnergy = newTotalEnergy;
                this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
                this.previousBorderlineEnergy = totalBorderlineEnergy;
                this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
                this.previousGravitationalEnergy = totalGravitationalEnergy;
            }
            else {
                // accept the new graph with some probability
                var probability = Math.exp(deltaEnergy / this.temperature);
                if (Math.random() < probability) {
                    // accept the new graph
                    this.previousTotalEnergy = newTotalEnergy;
                    this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
                    this.previousBorderlineEnergy = totalBorderlineEnergy;
                    this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
                    this.previousGravitationalEnergy = totalGravitationalEnergy;
                }
                else {
                    // reject the new graph
                    currentNodeLocation.x = oldNodeLocation.x;
                    currentNodeLocation.y = oldNodeLocation.y;
                    currentNodeLocation.z = oldNodeLocation.z;
                }
            }
        }
    }

    computeInitial3DEnergy() {
        var totalNodeDistributionEnergy = 0;
        var totalBorderlineEnergy = 0;
        var totalEdgeLengthEnergy = 0;
        var totalGravitationalEnergy = 0;

        // compute node distribution energy
        for (var i = 0; i < this.graph.nodes.length; i++) {
            var node = this.graph.nodes[i];
            var nodeLocation = node.drawData.mesh.position;

            for (var j = i + 1; j < this.graph.nodes.length; j++) {
                var otherNode = this.graph.nodes[j];
                var otherNodeLocation = otherNode.drawData.mesh.position;

                var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                var nodeDistanceEnergy = this.options.lambda1 / Math.pow(nodeDistance, 2);
                totalNodeDistributionEnergy += nodeDistanceEnergy;
            }
        }

        // compute borderline energy
        for (var i = 0; i < this.graph.nodes.length; i++) {
            var node = this.graph.nodes[i];
            var nodeLocation = node.drawData.mesh.position;

            var leftDistance = nodeLocation.distanceTo(new THREE.Vector3(this.options.gridSpace, 0, 0));
            var rightDistance = nodeLocation.distanceTo(new THREE.Vector3(-this.options.gridSpace, 0, 0));
            var topDistance = nodeLocation.distanceTo(new THREE.Vector3(0, this.options.gridSpace, 0));
            var bottomDistance = nodeLocation.distanceTo(new THREE.Vector3(0, -this.options.gridSpace, 0));
            var frontDistance = nodeLocation.distanceTo(new THREE.Vector3(0, 0, this.options.gridSpace));
            var backDistance = nodeLocation.distanceTo(new THREE.Vector3(0, 0, -this.options.gridSpace));

            var horizontalBorderlineEnergy = 1 / Math.pow(leftDistance, 2) + 1 / Math.pow(rightDistance, 2);
            var verticalBorderlineEnergy = 1 / Math.pow(topDistance, 2) + 1 / Math.pow(bottomDistance, 2);
            var depthBorderlineEnergy = 1 / Math.pow(frontDistance, 2) + 1 / Math.pow(backDistance, 2);
            totalBorderlineEnergy += this.options.lambda2 * (horizontalBorderlineEnergy + verticalBorderlineEnergy + depthBorderlineEnergy);
        }

        // compute edge length energy
        for (var i = 0; i < this.graph.edges.length; i++) {
            var edge = this.graph.edges[i];
            var edgeLength = edge.source.drawData.mesh.position.distanceTo(edge.target.drawData.mesh.position);
            var edgeLengthEnergy = this.options.lambda3 * Math.pow(edgeLength, 2);
            totalEdgeLengthEnergy += edgeLengthEnergy;
        }

        // compute gravitational energy
        for (var i = 0; i < this.graph.nodes.length; i++) {
            var node = this.graph.nodes[i];
            var nodeLocation = node.drawData.mesh.position;

            for (var j = i + 1; j < this.graph.nodes.length; j++) {
                var otherNode = this.graph.nodes[j];
                var otherNodeLocation = otherNode.drawData.mesh.position;

                var nodeDistance = nodeLocation.distanceTo(otherNodeLocation);
                var massMultiplier = node.connectedNodes.length * otherNode.connectedNodes.length;
                var gravitationalEnergy = this.options.lambda5 * (massMultiplier / Math.pow(nodeDistance, 2));
                totalGravitationalEnergy += gravitationalEnergy;
            }
        }

        this.previousTotalEnergy = totalNodeDistributionEnergy + totalBorderlineEnergy + totalEdgeLengthEnergy + totalGravitationalEnergy;
        this.previousNodeDistributionEnergy = totalNodeDistributionEnergy;
        this.previousBorderlineEnergy = totalBorderlineEnergy;
        this.previousEdgeLengthEnergy = totalEdgeLengthEnergy;
        this.previousGravitationalEnergy = totalGravitationalEnergy;

        console.log("initial total energy: " + this.previousTotalEnergy);
        console.log("initial node distribution energy: " + this.previousNodeDistributionEnergy);
        console.log("initial borderline energy: " + this.previousBorderlineEnergy);
        console.log("initial edge length energy: " + this.previousEdgeLengthEnergy);
        console.log("initial gravitational energy: " + this.previousGravitationalEnergy);
    }

    lineSegmentIntersection(p1, q1, p2, q2) {
        var dx1 = q1.x - p1.x;
        var dy1 = q1.y - p1.y;
        var dx2 = q2.x - p2.x;
        var dy2 = q2.y - p2.y;

        var determinant = dx1 * dy2 - dy1 * dx2;
        if (determinant == 0) {
            return false;
        }

        var dx3 = p1.x - p2.x;
        var dy3 = p1.y - p2.y;

        var t = (dx3 * dy2 - dy3 * dx2) / determinant;
        if (t < 0 || t > 1) {
            return false;
        }

        var u = (dx1 * dy3 - dy1 * dx3) / determinant;
        if (u < 0 || u > 1) {
            return false;
        }

        return true;
    }
}
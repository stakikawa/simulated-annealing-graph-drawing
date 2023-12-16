import { setup } from './webglSetup.js';
import { restartScene, updateSceneGeometries } from './sceneSetup.js';

const {
	renderer, 
	camera,
	controls
} = setup();

// variables
var scene, graph, sceneGeometriesToUpdate, simulatedAnneaing;
var animationFrameId = null;
var graphType = "2d";

var input = {
	numNodes: 20,
	numEdges: 20,
	circleSize: 0.15,
	sphereSize: 0.15
}

var numNodes = 20;
var numEdges = 20;
var lambda1 = 1.0 / numNodes;
var lambda2 = 0;
var lambda3 = ((numEdges)/(numNodes * (numNodes - 1))) * 0.05;
var lambda4 = (1 - Math.sqrt((numEdges)/(numNodes * (numNodes - 1)))) * 2.0;
var lambda5 = 1.0;

var options = {
	graphType: graphType,
	numNodes: numNodes,
	numEdges: numEdges,
	gridSpace: 5.0,
	circleSize: 0.15,
	sphereSize: 0.15,
	lambda1: lambda1,
	lambda2: lambda2,
	lambda3: lambda3,
	lambda4: lambda4,
	lambda5: lambda5
}

// setup gui
var gui = new dat.GUI();
var restart2DButton = { restart2D: function() { 
	options.graphType = "2d";
	initialize(); 
} };
var restart3DButton = { restart3D: function() { 
	options.graphType = "3d";
	initialize(); 
} };
window.onload = function() {
	gui.add(input, 'numNodes', 3, 50);
	gui.add(input, 'numEdges', 3, 50);

	var f1 = gui.addFolder("2D Graph");
	f1.add(input, 'circleSize', 0.03, 0.5);
	f1.add(restart2DButton, 'restart2D');

	var f2 = gui.addFolder("3D Graph");
	f2.add(input, 'sphereSize', 0.03, 0.5);
	f2.add(restart3DButton, 'restart3D');
}

function initialize() {
	// stop render loop if running
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
	}

	// update options
	options.numNodes = input.numNodes;
	options.numEdges = input.numEdges;
	options.circleSize = input.circleSize;
	options.sphereSize = input.sphereSize;
	options.lambda1 = 1.0 / options.numNodes;
	options.lambda2 = 0;
	options.lambda3 = ((options.numEdges)/(options.numNodes * (options.numNodes - 1))) * 0.05;
	options.lambda4 = (1 - Math.sqrt((options.numEdges)/(options.numNodes * (options.numNodes - 1)))) * 2.0;

	// setup scene
	({graph, scene, sceneGeometriesToUpdate, simulatedAnneaing} = restartScene(options));

	// render loop
	render();
}

// render loop
function render() {
	// update graph simulated annealing
	simulatedAnneaing.update();

	// update scene geometries
	updateSceneGeometries(graph, sceneGeometriesToUpdate, options);

	// update controls
	controls.update();

	// render
	renderer.render(scene, camera);
	animationFrameId = requestAnimationFrame(render);
}

initialize();
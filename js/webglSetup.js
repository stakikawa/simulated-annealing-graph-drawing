import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

// setup
export function setup() {    
	const canvas = document.getElementById("glcanvas");
	const gl = canvas.getContext("webgl2");

	// Only continue if WebGL 2 is available and working
	if (gl === null) {
		alert("Unable to initialize WebGL 2. Your browser or machine may not support it.");
		return;
	}

	const renderer = new THREE.WebGLRenderer({ canvas, gl, alpha:true, antialias: true });

	// Set clear color to white
	renderer.setClearColor(new THREE.Color(1.0, 1.0, 1.0));
	//renderer.setClearColor(new THREE.Color(0.8, 0.8, 0.8)); 
	let width = window.innerWidth;
	let height = window.innerHeight;
	const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000000);
	camera.position.z = 20;

	const controls = new TrackballControls(camera, renderer.domElement);
	controls.rotateSpeed = 1.5;
	controls.zoomSpeed = 5.2;
	controls.panSpeed = 1;

	controls.noZoom = false;
	controls.noPan = false; 

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	// On window resize update camera
	function resize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.updateProjectionMatrix();
	}
	window.addEventListener('resize', resize);
	resize();

	return {
		renderer,
		camera,
		controls
	};
}
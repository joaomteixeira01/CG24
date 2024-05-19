import * as THREE from 'three';
import * as PARAMETRIC from 'parametric';
/*import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';*/

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer;

var geometry, material, mesh;

var camera;

var keyDDown = false;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function addMobiusStrip(obj, x, y, z) {
    'use strict';

    const mobiusFunction = function ( u, t, target ) {

		u *= Math.PI;
		t *= 2 * Math.PI;

		u = u * 2;
		const phi = u / 2;
		const major = 2.25, a = 0.125, b = 0.65;

		let x = a * Math.cos( t ) * Math.cos( phi ) - b * Math.sin( t ) * Math.sin( phi );
		const y = a * Math.cos( t ) * Math.sin( phi ) + b * Math.sin( t ) * Math.cos( phi );
		const z = ( major + x ) * Math.sin( u );
		x = ( major + x ) * Math.cos( u );

		target.set( x, y, z );

	}
    geometry = new PARAMETRIC.ParametricGeometry(mobiusFunction, 64, 64);
    material = new THREE.MeshBasicMaterial({color: '#ADD8E6', wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCylinder(obj, x, y, z){
    'use strict';

    geometry = new THREE.CylinderGeometry(2, 2, 3.5, 32);
    material = new THREE.MeshBasicMaterial({color: '#ADD8E6', wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);

}

//E NECESSARIO UM ARRAY COM TODOS OS VERTICES DA FAIXA DE MOBIUS
// A FAIXA E CONSTITUIDA POR TRIANGULOS
// OS VERTICES QUE TEM A FAIXA SAO OS VERTICES DO TRIANGULO
// MAYBE USAR UM BUFFER GEOMETRY PARA ISTO

function createCarrousel(x, y, z){
    'use strict';createCarrousel
    var carrousel = new THREE.Object3D();
    addMobiusStrip(carrousel, 0, 12, 0);
    addCylinder(carrousel, 0, 0, 0);
    scene.add(carrousel);
    carrousel.position.set(x, y, z);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(10));
    createCarrousel(0, 0, 0);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
    'use strict';
    camera = new THREE.PerspectiveCamera(70,
                                         window.innerWidth / window.innerHeight,
                                         1,
                                         1000);
    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(scene.position);
}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createAmbientLight() {
    'use strict';
    const ambientLight = new THREE.AmbientLight(0xFFA500, 0.2);
    scene.add(ambientLight);
}

function turnOnDirectionalLight(){
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1); 
    directionalLight.target.position.set(0, 0, 0); 
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    if(keyDDown){
        
    }
}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera();
    createAmbientLight();

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';
    update();
    render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    'use strict';

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
}

init();
animate();
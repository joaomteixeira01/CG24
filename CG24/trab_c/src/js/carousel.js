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

var camera, topCamera, sideCamera, activeCamera;

// Status of key variables (verify if the key is pressed)
var keyDDown = false;
var key1Down = false;
var key2Down = false;
var key3Down = false;
var keyQDown = false;
var keyWDown = false;
var keyEDown = false;
var key4Down = false;
var key5Down = false;
var key6Down = false;

// VSClock
const clock = new THREE.Clock();

var r1Group, r2Group, r3Group;

// limites for the rings
var upperLimit = 7.5; // altura do mobiusStrip - altura das pecas
var lowerLimit = 0;

var r1Direction = 1; // 1 para subir, -1 para descer
var r2Direction = 1; // Inicialmente subindo
var r3Direction = 1;

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

    geometry = new THREE.CylinderGeometry(2, 2, 3, 32);
    material = new THREE.MeshBasicMaterial({color: '#ADD8E6', wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);

}

function addRing(obj, x, y, z, radius) {
    'use strict';

    const tubeRadius = 1.5; 
    const radialSegments = 9; 
    const tubularSegments = 64; 
    const arc = Math.PI * 2;

    // To create the circular path for the TubeGeometry
    const path = new THREE.Curve();
    path.getPoint = function (t) {
        const angle = t * arc;
        return new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    };

    geometry = new THREE.TubeGeometry(path, tubularSegments, tubeRadius, radialSegments, true);
    material = new THREE.MeshBasicMaterial({ color: '#ADD8E6' , wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = Math.PI / 2;
    obj.add(mesh);
    return mesh;
}

function hyperboloid(u, v, target) {
    u *= 2 * Math.PI;
    v = v * 2 - 1; // Remapeia v de [0,1] para [-1,1]
    const x = Math.sinh(v) * Math.cos(u);
    const y = Math.sinh(v) * Math.sin(u);
    const z = Math.cosh(v);
    target.set(x, y, z);
}


function addParametricSurfacesToRing(ring, radius) {
    const segmentAngle = 2 * Math.PI / 8; // 45 graus em radianos
    for (let i = 0; i < 8; i++) {
        geometry = new PARAMETRIC.ParametricGeometry(hyperboloid, 10, 10);
        material = new THREE.MeshBasicMaterial({ color: new THREE.Color(`hsl(${i * 45}, 100%, 50%)`), wireframe: true });
        mesh = new THREE.Mesh(geometry, material);
        
        // Posicionamento
        const angle = i * segmentAngle;
        mesh.position.x = radius * Math.cos(angle);
        mesh.position.y = radius * Math.sin(angle);

        mesh.rotation.y = Math.PI/2; // Ajustar orientação para enfrentar o centro

        // Criação de um pivô para rotação
        const pivot = new THREE.Object3D();
        pivot.position.set(mesh.position.x, 0, mesh.position.z); // Colocar o pivô no local correto
        pivot.add(mesh); // Adiciona a malha ao pivô, não diretamente ao anel
        ring.add(pivot);

        // Alinhar a malha no pivô para olhar para fora
        mesh.position.set(0, 0, 0); // Resetar a posição da malha no pivô
        mesh.lookAt(pivot.position); // Faz a malha olhar para o pivô, ajustando assim para fora

        // Definir propriedade para animação
        pivot.userData = { speed: 0.02 * (i + 0.5) }; // Velocidades variadas
    }
}

function addSurface(obj, x, y, z, radius, i) {

    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    geometry = new THREE.CylinderGeometry(1,1,2,32);
    material = new THREE.MeshBasicMaterial({color: '#ADD8E6', wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    // Adiciona velocidade de rotação
    mesh.userData.rotationSpeed = 0.01; // Velocidade de rotação constante

}


//E NECESSARIO UM ARRAY COM TODOS OS VERTICES DA FAIXA DE MOBIUS
// A FAIXA E CONSTITUIDA POR TRIANGULOS
// OS VERTICES QUE TEM A FAIXA SAO OS VERTICES DO TRIANGULO
// MAYBE USAR UM BUFFER GEOMETRY PARA ISTO

function createCarrousel(x, y, z){
    'use strict';

    var carrousel = new THREE.Object3D();

    // Cria grupos para cada anel para melhor organização e manipulação
    r1Group = new THREE.Object3D();
    r2Group = new THREE.Object3D();
    r3Group = new THREE.Object3D();

    const r1Radius = 3.5;
    const r2Radius = 6.5;
    const r3Radius = 9.5

    addMobiusStrip(carrousel, 0, 12, 0);
    addCylinder(carrousel, 0, 0, 0);

    // Adiciona anéis a seus respectivos grupos
    carrousel.innerRing = addRing(r1Group, 0, 0, 0, r1Radius); 
    carrousel.middleRing = addRing(r2Group, 0, 0, 0, r2Radius); 
    carrousel.outerRing = addRing(r3Group, 0, 0, 0, r3Radius); 

    // Adiciona grupos ao carrossel principal
    carrousel.add(r1Group);
    carrousel.add(r2Group);
    carrousel.add(r3Group);

    //addParametricSurfacesToRing(carrousel.innerRing, 3.50);
    //addParametricSurfacesToRing(carrousel.middleRing, 6.50);
    //addParametricSurfacesToRing(carrousel.outerRing, 9.50);

    // Exemplo: adiciona 8 superfícies ao redor do 'innerRing'
    for (let i = 0; i < 8; i++) {
        addSurface(r1Group, 0, 2.4, 0, r1Radius, i);
        addSurface(r2Group, 0, 2.4, 0, r2Radius, i);
        addSurface(r3Group, 0, 2.4, 0, r3Radius, i);
    }
    
    carrousel.add(r1Group);
    carrousel.add(r2Group);
    carrousel.add(r3Group);

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
    camera.position.x = 20;
    camera.position.y = 20;
    camera.position.z = 20;
    camera.lookAt(scene.position); 

    // Top Camera 
    topCamera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 1000);
    topCamera.position.set(0, 200, 0);
    topCamera.lookAt(new THREE.Vector3(0, 0, 0)); 

    // 
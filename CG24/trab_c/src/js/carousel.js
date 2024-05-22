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

function addCylinder(obj, x, y, z, radius, height){
    'use strict';

    geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    material = new THREE.MeshBasicMaterial({color: '#ADD8E6', wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);

}

function addRing(scene, x, y, z, innerRadius) {
    'use strict';

    const outerRadius = innerRadius + 2;    // 2 is the value of the rings width
    const thickness = 3;                    // Must be equal to the cylinder hight

    // Creates a circle
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);  // External cicrlce
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);    // Internal circle with a hole
    shape.holes.push(hole);

    // Define as opções de extrusão
    const extrudeSettings = {
        steps: 2,           // Número de pontos ao longo da extrusão
        depth: thickness,   // A profundidade da extrusão
        bevelEnabled: false // Desativa o bisel para manter as faces planas
    };

    // Cria a geometria extrudada a partir da forma
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({ color: '#ADD8E6', wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.rotation.x = Math.PI/2;
    scene.add(mesh);
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

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new THREE.CylinderGeometry(1,1,2,32);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
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

    // ---- DIMENTIONS ----
    const cylinderRadius = 2;
    const cylinderHeight = 3;
    const ringsWidth = 2;
    const r1InnerRadius = cylinderRadius + 0.1;
    const r2InnerRadius = r1InnerRadius + ringsWidth + 0.1;
    const r3InnerRadius = r2InnerRadius + ringsWidth + 0.1;

    // Create groups for better manipulation
    r1Group = new THREE.Object3D();
    r2Group = new THREE.Object3D();
    r3Group = new THREE.Object3D();

    addMobiusStrip(carrousel, 0, 12, 0);
    addCylinder(carrousel, 0, 0, 0, cylinderRadius, cylinderHeight);

    // Adds rings to each group
    carrousel.innerRing = addRing(r1Group, 0, cylinderHeight/2, 0, r1InnerRadius); 
    carrousel.middleRing = addRing(r2Group, 0, cylinderHeight/2, 0, r2InnerRadius); 
    carrousel.outerRing = addRing(r3Group, 0, cylinderHeight/2, 0, r3InnerRadius); 

    // Adds 8 surfaces to each ring
    for (let i = 0; i < 8; i++) {
        // tamanho da base das superficies deve ter em conta ringsWidth
        addSurface(r1Group, 0, 2.5, 0, r1InnerRadius+(ringsWidth/2), i);
        addSurface(r2Group, 0, 2.5, 0, r2InnerRadius+(ringsWidth/2), i);
        addSurface(r3Group, 0, 2.5, 0, r3InnerRadius+(ringsWidth/2), i);
    }

    // Adds groups to the Carrousel
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

    // Side Camera
    sideCamera = new THREE.PerspectiveCamera(7, window.innerWidth / window.innerHeight, 1, 1000);
    sideCamera.position.set(200, 5, 0);
    sideCamera.lookAt(new THREE.Vector3(0, 0, 0));
} 
/*
function createCamera(scene) {
    'use strict';

    // Calcula a proporção de aspecto da janela
    const aspectRatio = window.innerWidth / window.innerHeight;
    const d = 50; // Define o tamanho da visão da câmera

    // Cria a câmera ortográfica
    const camera = new THREE.OrthographicCamera(-d * aspectRatio, d * aspectRatio, d, -d, 1, 1000);
    camera.position.set(0, 50, 0); // Posiciona a câmera acima do centro da cena
    camera.lookAt(scene.position); // Direciona a câmera para olhar para o centro da cena

    return camera;
} */



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
function update(delta){
    'use strict';

    if(keyDDown) {}
    
    if (!key1Down) { 
        console.log('Starting movement position ->', (r1Group.position.y));
        r1Group.position.y += (2 * delta) * r1Direction;
        console.log('MOVING!!!\n position ->', (r1Group.position.y));
        if (r1Group.position.y >= upperLimit || r1Group.position.y <= lowerLimit) {
            console.log('CHANGING DIRECTION!!!');
            r1Direction *= -1; // Inverte a direção se atingir os limites
        } 
    }

    if (keyQDown) { r1Group.position.y -= (2 * delta); }

    if (!key2Down) { 
        r2Group.position.y += (2 * delta) * r2Direction;
        if (r2Group.position.y >= upperLimit || r2Group.position.y <= lowerLimit) {
            r2Direction *= -1;
        }    
    }

    if (keyWDown) { r2Group.position.y -= (2 * delta); }

    if (!key3Down) { 
        r3Group.position.y += (2 * delta) * r3Direction; 
        if (r3Group.position.y >= upperLimit || r3Group.position.y <= lowerLimit) {
            r3Direction *= -1;
        }
    }

    if (keyEDown) { r3Group.position.y -= (2 * delta); }

    if (key4Down) { activeCamera = topCamera; }

    if (key5Down) { activeCamera = camera; }

    if (key6Down) { activeCamera = sideCamera; }

    scene.traverse(function(object) {
        if (object.userData.rotationSpeed) {
            // Rotação constante em torno do eixo Y
            object.rotateY(object.userData.rotationSpeed * delta);
        }
    });


}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';

    renderer.render(scene, activeCamera);
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
    activeCamera = camera;
    createAmbientLight();

    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    const delta = clock.getDelta();

    requestAnimationFrame(animate);

    update(delta);
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

    switch (e.keyCode) {
        
        case 49: // Tecla '1'
            key1Down = !key1Down;
            break;
        case 50: // Tecla '2'
            key2Down = !key2Down;
            break;
        case 51: // Tecla '3'
            key3Down = !key3Down;
            break;
        case 52: // '4'
            key4Down = true;
            break;
        case 53: // '5'
            key5Down = true;
            break;
        case 54: // '6'
            key6Down = true;
            break;
        
    }

    if (key1Down || key2Down || key3Down || keyQDown || keyWDown || keyEDown) {
        e.preventDefault();
        e.stopPropagation();
    }

}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';

    switch (e.keyCode) {

        case 52: // '4'
            key4Down = false;
            break;
        case 53: // '5'
            key5Down = false;
            break;
        case 54: // '6'
            key6Down = false;
            break;
        

    }
}

init();
animate();
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

var carrousel;

var materials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    phong: new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }),
    toon: new THREE.MeshToonMaterial({ color: 0x00ff00 }),
    normal: new THREE.MeshNormalMaterial(),
    basic: new THREE.MeshBasicMaterial({ color: 0x00ff00 })
};

var currentMaterialKey = 'lambert';

// Status of key variables (verify if the key is pressed)
var keyDDown = false;
var key1Down = false;
var key2Down = false;
var key3Down = false;
var key4Down = false;
var key5Down = false;
var key6Down = false;

var keyDDown = false;
var keyQDown = false;
var keyWDown = false;
var keyEDown = false;
var keyRDown = false;
var keySDown = false;

var keyTDown = false;

var directionalLight = null;

// VSClock
const clock = new THREE.Clock();

var r1Group, r2Group, r3Group;

// ---- DIMENTIONS ----
const cylinderRadius = 2;
const cylinderHeight = 15;
const ringsWidth = 2;
const ringsHeight = 3
const r1InnerRadius = cylinderRadius + 0.1;
const r2InnerRadius = r1InnerRadius + ringsWidth + 0.1;
const r3InnerRadius = r2InnerRadius + ringsWidth + 0.1;
const rsInnerRadius = [r1InnerRadius, r2InnerRadius, r3InnerRadius];

// limites for the rings
var upperLimit = (cylinderHeight/2) - (ringsHeight/2); // altura do mobiusStrip - altura das pecas
var lowerLimit = -(cylinderHeight/2) + (ringsHeight/2);

//Surface 1 Dimensions - Cylinder
var radiusCylinder = 1;
var heightCylinder = 2;

//Surface 2 Dimensions - Parallelepiped
var widthParallelepiped = Math.sqrt(2);
var heightParallelepiped = 2;
var depthParallelepiped = Math.sqrt(2);

//Surface 3 Dimensions - Quadrangular Pyramid
var baseQuadPyramid = 2;
var heightQuadPyramid = 2;

//Surface 4 Dimensions - Cone cutted
var radiusConeCutted1 = 1;
var radiusConeCutted2 = 0.5;
var heightConeCutted = 2;

// Surface 5 Dimensions - Cone
var radiusCone = 1;
var heightCone = 2;

// Surface 6 Dimensions - Hexagonal Prism
var radiusHexagonalPrism = 1;
var heightHexagonalPrism = 2;

// Surface 7 Dimensions - Rulled Surface 1
var rulledSurface1Dim = 0.07;

// Surface 8 Dimensions - Rulled Surface 2
var rulledSurface2Dim = 0.12;

var r1Direction = 1; // 1 para subir, -1 para descer
var r2Direction = 1; // Inicialmente subindo
var r3Direction = 1;

const imagePath = '../assets/image.jpg';

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
    material = materials[currentMaterialKey];
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCylinder(obj, x, y, z, radius, height){
    'use strict';

    geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    material = materials[currentMaterialKey];
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
    const material = materials[currentMaterialKey];
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

function cylinder(u, v, target) {
    const angle = 2 * Math.PI * u;  
    const x = radiusCylinder * Math.cos(angle);
    const y = heightCylinder * (v - 0.5); // Altura centrada em y = 0
    const z = radiusCylinder * Math.sin(angle);
            
    target.set(x, y, z);
}

function parallelepiped(u, v, target, face) {
    const x = (u - 0.5) * widthParallelepiped;
    const y = (v - 0.5) * heightParallelepiped;
    const z = (v - 0.5) * depthParallelepiped;

    switch(face) {
        case 0: target.set(x, y, depthParallelepiped / 2); break; // Frente
        case 1: target.set(x, y, -depthParallelepiped / 2); break; // Traseira
        case 2: target.set(x, heightParallelepiped / 2, z); break; // Cima
        case 3: target.set(x, -heightParallelepiped / 2, z); break; // Baixo
        case 4: target.set(widthParallelepiped / 2, y, z); break; // Direita
        case 5: target.set(-widthParallelepiped / 2, y, z); break; // Esquerda
    }
}

function quadPyramid(u, v, target, face) {
    const vertices = [
        // topo
        [0, 1, 0],
        [0, -heightQuadPyramid/2, Math.sqrt(baseQuadPyramid) / 2], 
        [Math.sqrt(baseQuadPyramid) / 2, -heightQuadPyramid/2, 0], 
        [0, -heightQuadPyramid/2, -Math.sqrt(baseQuadPyramid) / 2], 
        [-Math.sqrt(baseQuadPyramid) / 2, -heightQuadPyramid/2, 0] 
    ];
    const indices = [
        [1, 2, 3], //base
        [1, 4, 3], //base
        [1, 2, 0], 
        [2, 3, 0],
        [3, 4, 0],
        [4, 1, 0]
    ];
    const i = Math.floor(u * 2); // Map u to eithe5r 0 or 1

    const vertexIndex = indices[face][i];
    const nextVertexIndex = indices[face][(i + 1) % 3]; // Wrap around to create triangles

    const vertex = vertices[vertexIndex];
    const nextVertex = vertices[nextVertexIndex];

    // Linear interpolation between the two vertices
    const interpolatedX = vertex[0] + (nextVertex[0] - vertex[0]) * v;
    const interpolatedY = vertex[1] + (nextVertex[1] - vertex[1]) * v;
    const interpolatedZ = vertex[2] + (nextVertex[2] - vertex[2]) * v;

    target.set(interpolatedX, interpolatedY, interpolatedZ);
}

function cone(u, v, target) {
    const radius = radiusCone - u; 
    const angle = 2 * Math.PI * v;

    const x = radius * Math.cos(angle);
    const y = u * heightCone; 
    const z = radius * Math.sin(angle);

    target.set(x, y, z);
}

function coneCutted(u, v, target) {
    const radius = radiusConeCutted2 + (radiusConeCutted1 - radiusConeCutted2) * v;
    const angle = u * 2 * Math.PI;

    const x = radius * Math.cos(angle);
    const y = (radius * Math.sin(angle));
    const z = heightConeCutted * (1 - v);

    target.set(x, z, y);
}

function hexagonalPrism(u, v, target) {
    const angle = 2 * Math.PI * v;

    // Coordenadas x e z para a base hexagonal
    const x = radiusHexagonalPrism * Math.cos(angle);
    const z = radiusHexagonalPrism * Math.sin(angle);
    const y = heightHexagonalPrism * u;  // Altura varia linearmente com u

    target.set(x, y, z);
}

function rulledSurface1(u, v, target) {
    
    u = (u - 0.5) * 2 * Math.PI; // u range adjusted to fit the desired size
    v = v * 2 * Math.PI; // v range to cover full rotation
   
    const coshU = Math.cosh(u);
    const sinhU = Math.sinh(u);
   
    const x = rulledSurface1Dim * coshU * Math.cos(v);
    const y = rulledSurface1Dim * sinhU;
    const z = rulledSurface1Dim * coshU * Math.sin(v);
   
    target.set(x, y, z);
}

function rulledSurface2(u, v, target) {

    u = u * 4 * Math.PI; // Multiplicado para várias voltas
    v = v * 2 * Math.PI; // Multiplicado para cobrir uma volta completa

    const x = rulledSurface2Dim * v * Math.cos(u);
    const y = rulledSurface2Dim * v * Math.sin(u);
    const z = rulledSurface2Dim * u;

    target.set(x, y, z);
}

function addSurface1(obj, x, y, z, radius, i) {
    // Cilindro
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(cylinder,32,32);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y + 1, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);
 
    mesh.userData.rotationSpeed = 0.01; // Velocidade de rotação constante
    mesh.name = "Surface1";
    mesh.userData.spotLight = spotLight;
}

function addSurface2(obj, x, y, z, radius, i) {
    // Paralelepipedo
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    const group = new THREE.Group();
    group.name = "Surface2";
    
    for (let i = 0; i < 6; i++) {
        const faceGeometry = new PARAMETRIC.ParametricGeometry((u, v, target) => {
            parallelepiped(u, v, target, i);
        }, 10, 10);
        const faceMesh = new THREE.Mesh(faceGeometry, material);
        group.add(faceMesh);
    }
    
    group.position.set(
        x + radius * Math.cos(angle),
        y + 1, 
        z + radius * Math.sin(angle));
    obj.add(group);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    group.add(spotLight);
    group.add(targetObject);

    group.userData.rotationSpeed = 0.01; 
    group.name = "Surface2";
    group.userData.spotLight = spotLight;
}

function addSurface3(obj, x, y, z, radius, i) {
    // Piramide quadrangular
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    const group = new THREE.Group();

    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        const faceGeometry = new PARAMETRIC.ParametricGeometry((u, v, target) => {
            quadPyramid(u, v, target, faceIndex);
        }, 10, 10);

        const faceMesh = new THREE.Mesh(faceGeometry, material);
        group.add(faceMesh); 
    }

    group.position.set(
        x + radius * Math.cos(angle),
        y + 1, 
        z + radius * Math.sin(angle));
    obj.add(group);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    group.add(spotLight);
    group.add(targetObject);


    group.userData.rotationSpeed = 0.01; 
    group.name = "Surface3";
    group.userData.spotLight = spotLight;
}

function addSurface4(obj, x, y, z, radius, i) {
    // Cylinder with different radius surface
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(coneCutted,32,32);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);

    mesh.userData.rotationSpeed = 0.01; 
    mesh.name = "Surface4";
    mesh.userData.spotLight = spotLight;
}

function addSurface5(obj, x, y, z, radius, i) {
    // Cone surface
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(cone,32,32);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);

    mesh.userData.rotationSpeed = 0.01;
    mesh.name = "Surface5";
    mesh.userData.spotLight = spotLight;
}

function addSurface6(obj, x, y, z, radius, i) {
    // Prisma Hexagonal
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(hexagonalPrism,10,10);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);

    mesh.userData.rotationSpeed = 0.01; 
    mesh.name = "Surface6";
    mesh.userData.spotLight = spotLight;
}

function addSurface7(obj, x, y, z, radius, i) {
    // Superficie regrada 1 - hiperboloide
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(rulledSurface1, 64, 64);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y + 1, 
        z + radius * Math.sin(angle));
    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);

    mesh.userData.rotationSpeed = 0.01;
    mesh.name = "Surface7";
    mesh.userData.spotLight = spotLight;
}

function addSurface8(obj, x, y, z, radius, i) {
    // Superficie regrada 2 - helicoide
    const segmentAngle = 2 * Math.PI / 8; // Cada segmento é de 45 graus
    const angle = segmentAngle * i; // Calcula o ângulo para a posição i

    // Verde variando a luminosidade
    const hue = 120;                // 120° no modelo HSL para verde
    const saturation = 100;         // 100% de saturação para cores vivas
    const lightness = 30 + 5 * i;   // Varia de 30% a 70% para 8 superfícies
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Matiz e saturação são fixos, apenas a luminosidade varia

    geometry = new PARAMETRIC.ParametricGeometry(rulledSurface2, 64, 64);
    material = new THREE.MeshBasicMaterial({color: color, wireframe: true});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        x + radius * Math.cos(angle),
        y + 1, 
        z + radius * Math.sin(angle));

    obj.add(mesh);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, -3, 0);
    spotLight.angle = Math.PI / 2;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1;
    spotLight.distance = 100;
     
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 10, 0); 
    spotLight.target = targetObject;
    mesh.add(spotLight);
    mesh.add(targetObject);

    mesh.userData.rotationSpeed = 0.01;
    mesh.name = "Surface8";
    mesh.userData.spotLight = spotLight;
}

//E NECESSARIO UM ARRAY COM TODOS OS VERTICES DA FAIXA DE MOBIUS
// A FAIXA E CONSTITUIDA POR TRIANGULOS
// OS VERTICES QUE TEM A FAIXA SAO OS VERTICES DO TRIANGULO
// MAYBE USAR UM BUFFER GEOMETRY PARA ISTO

function createCarrousel(x, y, z){
    'use strict';

    carrousel = new THREE.Object3D();

    // Create groups for better manipulation
    r1Group = new THREE.Object3D();
    r2Group = new THREE.Object3D();
    r3Group = new THREE.Object3D();
    const rsGroup = [r1Group, r2Group, r3Group];

    addMobiusStrip(carrousel, 0, 12, 0);
    addCylinder(carrousel, 0, 0, 0, cylinderRadius, cylinderHeight);

    // Adds rings to each group
    carrousel.innerRing = addRing(r1Group, 0, ringsHeight/2, 0, r1InnerRadius); 
    carrousel.middleRing = addRing(r2Group, 0, ringsHeight/2, 0, r2InnerRadius); 
    carrousel.outerRing = addRing(r3Group, 0, ringsHeight/2, 0, r3InnerRadius); 

    for (let i = 0; i < 3; i++) {
        addSurface1(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 0);
        addSurface2(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 1);
        addSurface3(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 2);
        addSurface4(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 3);
        addSurface5(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 4);
        addSurface6(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 5);
        addSurface7(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 6);
        addSurface8(rsGroup[i], 0, 2.5, 0, rsInnerRadius[i]+(ringsWidth/2), 7);
    }

    // Adds groups to the Carrousel
    carrousel.add(r1Group);
    carrousel.add(r2Group);
    carrousel.add(r3Group);

    scene.add(carrousel);

    carrousel.position.set(x, y, z);
}

function addSkydome(x, y, z) {
    'use strict';

    // Sphere dimentions
    const radius = 20;
    const widthSegments = 60;
    const heighhtSegments = 20;

    let texture = new THREE.TextureLoader().load(imagePath);

    material = new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide});
    geometry = new THREE.SphereGeometry(radius, widthSegments, heighhtSegments);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(10));

    createCarrousel(0, 0, 0);

    addSkydome(0,0,0);
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
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 5, 7.5);
    scene.add(directionalLight);
}

function turnOffDirectionalLight() {
    if (directionalLight) {
        scene.remove(directionalLight);
        directionalLight = null; 
    }
}

function toggleSpotlight(mesh, turnOn) {
    if (mesh.userData.spotLight) {
        mesh.userData.spotLight.intensity = turnOn ? 1 : 0;
    }
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

function updateMaterials() {
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material = materials[currentMaterialKey];
        }
    });
}

function update(delta){
    'use strict';

    if(keyDDown) {}
    
    if (!key1Down) { 
        r1Group.position.y += (2 * delta) * r1Direction;
        if (r1Group.position.y >= upperLimit || r1Group.position.y <= lowerLimit) {
            r1Direction *= -1; // Inverte a direção se atingir os limites
        } 
    }

    if (!key2Down) { 
        r2Group.position.y += (2 * delta) * r2Direction;
        if (r2Group.position.y >= upperLimit || r2Group.position.y <= lowerLimit) {
            r2Direction *= -1;
        }    
    }

    if (!key3Down) { 
        r3Group.position.y += (2 * delta) * r3Direction; 
        if (r3Group.position.y >= upperLimit || r3Group.position.y <= lowerLimit) {
            r3Direction *= -1;
        }
    }

    if (key4Down) { activeCamera = topCamera; }

    if (key5Down) { activeCamera = camera; }

    if (key6Down) { activeCamera = sideCamera; }

    if (keyDDown) { turnOffDirectionalLight(); }
    else if (directionalLight == null) { turnOnDirectionalLight(); }

    if (keyQDown) { currentMaterialKey = 'lambert'; updateMaterials(); }

    if (keyWDown) { currentMaterialKey = 'phong'; updateMaterials(); }

    if (keyEDown) { currentMaterialKey = 'toon'; updateMaterials(); }

    if (keyRDown) { currentMaterialKey = 'normal'; updateMaterials(); }

    if (keyTDown) { currentMaterialKey = 'basic'; updateMaterials(); }

    if (keySDown) { 
        toggleSpotlight(scene.getObjectByName("Surface1"), false); 
        toggleSpotlight(scene.getObjectByName("Surface2"), false);
        toggleSpotlight(scene.getObjectByName("Surface3"), false);
        toggleSpotlight(scene.getObjectByName("Surface4"), false);
        toggleSpotlight(scene.getObjectByName("Surface5"), false);
        toggleSpotlight(scene.getObjectByName("Surface6"), false);
        toggleSpotlight(scene.getObjectByName("Surface7"), false);
        toggleSpotlight(scene.getObjectByName("Surface8"), false);
    }
    else {
        toggleSpotlight(scene.getObjectByName("Surface1"), true);
        toggleSpotlight(scene.getObjectByName("Surface2"), true);
        toggleSpotlight(scene.getObjectByName("Surface3"), true);
        toggleSpotlight(scene.getObjectByName("Surface4"), true);
        toggleSpotlight(scene.getObjectByName("Surface5"), true);
        toggleSpotlight(scene.getObjectByName("Surface6"), true);
        toggleSpotlight(scene.getObjectByName("Surface7"), true);
        toggleSpotlight(scene.getObjectByName("Surface8"), true);
    }

    scene.traverse(function(object) {
        if (object.userData.rotationSpeed) {
            // Rotação constante em torno do eixo Y
            object.rotateY(object.userData.rotationSpeed * delta);
        }
    });

    carrousel.rotateY(0.05 * delta);
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
    turnOnDirectionalLight();

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
        case 68: // 'D'
            keyDDown = !keyDDown;
            break;
        case 81: 
            keyQDown = true;  
            break;
        case 87: 
            keyWDown = true;
            break;
        case 69: 
            keyEDown = true;
            break;
        case 82: 
            keyRDown = true;
            break;
        case 83:
            keySDown = !keySDown;
            break;
        case 84:
            keyTDown = true;
            break;
        
    }

    if (key1Down || key2Down || key3Down || key4Down || key5Down || key6Down || keyQDown || keyWDown || keyEDown || keyRDown) {
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
        case 81: 
            keyQDown = false;  
            break;
        case 87: 
            keyWDown = false;
            break;
        case 69: 
            keyEDown = false;
            break;
        case 82: 
            keyRDown = false;
            break;
        case 84:
            keyTDown = false;
            break;
        

    }
}

init();
animate();
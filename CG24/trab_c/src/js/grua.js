import * as THREE from 'three';

/* ------------------------ GLOBAL VARIABLES ------------------------ */

var scene, renderer;

var geometry, material, mesh;

var craneUpperPart;     // Global variable to hold the upper part of the crane
var carGroup;           // Global variable to hold the car, cable, and claw components
var clawGroup;          // Global variable to hold the claw components

var frontCamera, sideCamera, topCamera, orthoCamera, fixedPerspectiveCamera, clawCamera;
var activeCamera;       // This will keep track of the currently active camera

// Initial positions for the crane parts
var car_placement = 8.5;    
var hook_h = 4;             
var car_h = 8.75;  

var h_base = 2;

var attached_object;

var is_attached = false;

var containerSize = 4;
var wallThickness = 0.5;
var maxLimit = containerSize - (2*wallThickness);

// Status of key variables (verify if the key is pressed)
var key1Down = false;
var key2Down = false;
var key3Down = false;
var key4Down = false;
var key5Down = false;
var key6Down = false;
var key7Down = false;
var keyADown = false;
var keyQDown = false;
var keyWDown = false;
var keySDown = false;
var keyEDown = false;
var keyDDown = false;
var keyRDown = false;
var keyFDown = false;

// Status of allowed crane movements (keys)
var keySOn = true;
var keyWOn = true;
var keyEOn = true;
var keyDOn = true;
var keyROn = true;
var keyFOn = true;

// Wireframe status
var _wireframe = false;

// VSClock
const clock = new THREE.Clock();

var claws = [];

var placedObjects = []; // Array to store the object when theire added to the scene

/* -----------------------------------------------------------------  */


function addCraneBase(obj, x, y, z) {
    'use strict';

    geometry = new THREE.BoxGeometry(3, h_base, 3);
    material = new THREE.MeshBasicMaterial({ color: '#808080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + (h_base / 2), z);
    obj.add(mesh);
    placedObjects.push({vector: new THREE.Vector3(x, y, z), radius: 4, object: obj});
}

function addCraneCabin(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(1, 2, 1);
    material = new THREE.MeshBasicMaterial({ color: '#000080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCraneTower(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(1, 8, 1);
    material = new THREE.MeshBasicMaterial({ color: '#ffd700', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCraneArm(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(13, 1, 1);
    material = new THREE.MeshBasicMaterial({ color: '#ffd700', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCraneCounterWeight(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(2, 3, 3);
    material = new THREE.MeshBasicMaterial({ color: '#000080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCraneCounterArm(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(1, 2, 1);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addCar(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(3, 0.5, 1);
    material = new THREE.MeshBasicMaterial({ color: '#000080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.name="car";
    obj.add(mesh);
}

function addTirant1(obj, x, y, z) {
    'use strict';
    geometry = new THREE.CylinderGeometry(0.3, 0.3, 6.8, 64, 1, false, 0, 360);
    material = new THREE.MeshBasicMaterial({ color: '#808080', wireframe: _wireframe });
    mesh = new THREE.Mesh( geometry, material ); 
    mesh.position.set(x, y, z);
    mesh.rotation.z = 1.3;
    obj.add(mesh);
}

function addTirant2(obj, x, y, z) {
    'use strict';
    geometry = new THREE.CylinderGeometry(0.3, 0.3, 2.8, 64, 1, false, 0, 360);
    material = new THREE.MeshBasicMaterial({ color: '#808080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.z = -1.3;
    obj.add(mesh);
}

function addCable(obj, x, y, z, hook_h, car_h) { 
    'use strict';
    geometry = new THREE.CylinderGeometry(0.3, 0.3, 8.95-hook_h, 64, 1, false, 0, 360);
    material = new THREE.MeshBasicMaterial({ color: '#808080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y+(car_h-hook_h)/2, z);
    mesh.name="cable";
    obj.add(mesh);
}

function addHookMainFrame(obj, x, y, z) {
    'use strict';
    geometry = new THREE.BoxGeometry(1, 1, 1);
    material = new THREE.MeshBasicMaterial({ color: '#000080', wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.name="hook";
    obj.add(mesh);
}

function addHookClaw(obj, x, y, z, rot) {
    'use strict';

    var pivot = new THREE.Object3D();
    geometry = new THREE.BoxGeometry(1, 0.5, 1);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(1, -0.25, 0); 
    pivot.add(mesh);

    geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(1.25, -0.75, 0); 
    pivot.add(mesh);

    pivot.position.set(x, y, z); 
    pivot.rotation.y = rot;

    obj.add(pivot);
    claws.push(pivot);
    return pivot;
} 

function createCrane(x, y, z) {
    'use strict';

    var crane = new THREE.Object3D();
    craneUpperPart = new THREE.Object3D();  // Initialize the upper part group
    carGroup = new THREE.Object3D();        // Initialize the new group for car, cable, and claw
    clawGroup = new THREE.Object3D();       // Initialize the new group for the claws


    //material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    addCraneBase(crane, 0, 0, 0);
    addCraneTower(crane, 0, 5, 0);
    
    // Upper part elements
    addCraneCabin(craneUpperPart, 0, 10, 1);
    addCraneArm(craneUpperPart, 5, 9.5, 0);
    addCraneCounterWeight(craneUpperPart, -2.5, 9.5, 0);
    addCraneCounterArm(craneUpperPart, 0, 11, 0);
    addTirant1(craneUpperPart, 3.75, 10.75, 0);
    addTirant2(craneUpperPart, -1.25, 11.40, 0);

    // Car part elements
    addCar(carGroup, car_placement, car_h, 0);
    addCable(carGroup, car_placement, hook_h, 0, hook_h, car_h);
    
    addHookMainFrame(clawGroup, car_placement, hook_h, 0);

    // Claw part elements
    addHookClaw(clawGroup, car_placement, hook_h, 0, 0);
    addHookClaw(clawGroup, car_placement, hook_h, 0, Math.PI/2);
    addHookClaw(clawGroup, car_placement, hook_h, 0, Math.PI);
    addHookClaw(clawGroup, car_placement, hook_h, 0, 3*Math.PI/2);
    
    carGroup.add(clawGroup)                 // Add the claw group to the hook
    craneUpperPart.add(carGroup);           // Add the Car group to the craneUpperPart
    crane.add(craneUpperPart);              // Add the Crane upper part to the tower

    scene.add(crane);
    
    crane.position.x = x;
    crane.position.y = y;
    crane.position.z = z;
}

function addKey(_name, _color, topPos, leftPos, text) {
    'use strict'
    
    var hudContainer = document.getElementById('hud');
    var squareDiv = document.createElement(_name);
    squareDiv.id = _name;
    squareDiv.classList.add('square');

    squareDiv.style.position = 'absolute';
    squareDiv.style.backgroundColor = _color;
    squareDiv.style.top = topPos + 'px'; 
    squareDiv.style.left = leftPos + 'px'; 

    squareDiv.style.display = 'flex';
    squareDiv.style.alignItems = 'center';
    squareDiv.style.justifyContent = 'center';

    var textNode = document.createTextNode(text);
    var spanElement = document.createElement('span');
    spanElement.appendChild(textNode);
    squareDiv.appendChild(spanElement);
    spanElement.style.fontSize = '25px';
    spanElement.style.fontWeight = 'bold';

    hudContainer.appendChild(squareDiv);

}

function createHub() {
    'use strict';

    addKey('key1','#87CEFA', 200, 400, '1');
    addKey('key2', '#87CEFA', 200, 460, '2');
    addKey('key3', '#87CEFA', 260, 400, '3');
    addKey('key4', '#87CEFA', 260, 460, '4');
    addKey('key5', '#87CEFA', 320, 400, '5');
    addKey('key6', '#87CEFA', 320, 460, '6');
    addKey('key7', '#87CEFA', 380, 430, '7');
    addKey('keyA', '#F08080', 160, 1050, 'A');
    addKey('keyQ', '#F08080', 160, 1110, 'Q');
    addKey('keyS', '#FFD700', 220, 1050, 'S');
    addKey('keyW', '#FFD700', 220, 1110, 'W');
    addKey('keyE', '#DDA0DD', 280, 1050, 'E');
    addKey('keyD', '#DDA0DD', 280, 1110, 'D');
    addKey('keyR', '#F0E68C', 340, 1050, 'R');
    addKey('keyF', '#F0E68C', 340, 1110, 'F');

}

function addContainer(x, y, z) {
    'use strict';

    var container = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: _wireframe });

    // Paredes do contentor
    const wallHeight = 3;
    const wallThickness = 0.5;

    // dimensoes da base
    const dm_x = 4;
    const dm_y = 0.5;
    const dm_z = 4;

    addContainerBase(container, x, y, z, dm_x, dm_y, dm_z);
    placedObjects.push({vector: new THREE.Vector3(x, y, z), radius: dm_z, object: 'container'});
    
    addWall_1(container, x - (dm_x / 2) - (wallThickness / 2), y, z, dm_z, wallHeight, wallThickness);
    addWall_1(container, x + (dm_x / 2) + (wallThickness / 2), y, z, dm_z, wallHeight, wallThickness);          

    addWall_2(container, x, dm_y / 2, z + (dm_z / 2) + (wallThickness / 2), dm_x + wallThickness, wallHeight, wallThickness);      
    addWall_2(container, x, dm_y / 2, z - (dm_z / 2) - (wallThickness / 2), dm_x + wallThickness, wallHeight, wallThickness);       

    scene.add(container);

    container.position.x = x;
    container.position.y = y;
    container.position.z = z;
}

function addContainerBase(obj, x, y, z, dx, dy, dz) {
    'use strict';
    geometry = new THREE.BoxGeometry(dx, dy, dz);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    obj.add(mesh);
}

function addWall_1(obj, x, y, z, dz, wallHeight, wallThickness) { // | |
    'use strict';
    geometry = new THREE.BoxGeometry(wallThickness, wallHeight, dz);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, (wallHeight / 2) - 0.25, z);
    obj.add(mesh);
}

function addWall_2(obj, x, dy, z, dx, wallHeight, wallThickness) { 
    'use strict';
    geometry = new THREE.BoxGeometry(dx + wallThickness, wallHeight, wallThickness); // =
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, (wallHeight / 2) - dy, z);
    obj.add(mesh);
}

function addCargos(x, y, z) {
    'use strict';
    var cargos = new THREE.Object3D();

    var cubo = new THREE.Object3D();
    var dodecaedro = new THREE.Object3D();
    var icosaedro = new THREE.Object3D();
    var torus = new THREE.Object3D();
    var torusKnot = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({ color: '#808080', wireframe: _wireframe });

    // Dimensions
    var radiusD = 1.5;
    var radiusI = 1;
    var detail = 0; 
    var radiusT = 2;
    var tubeT = 0.4;
    var radialSegmentsT = 8;
    var tubularSegmentsT = 6;
    var radiusTK = 0.75;
    var tubeTK = 0.4;
    var radialSegmentsTK = 8;
    var tubularSegmentsTK = 6;
    var p = 2;
    var q = 3;
    
    addCubo(cubo, 0);
    addDodecaedros(dodecaedro, radiusD);
    addIcosaedros(icosaedro, radiusI + radiusI/2, detail);
    addTorus(torus, radiusT + tubeT, tubeT, radialSegmentsT, tubularSegmentsT);
    addTorusKnot(torusKnot, radiusTK + tubeTK, tubeTK, radialSegmentsTK, tubularSegmentsTK, p, q);

    scene.add(cubo);
    scene.add(dodecaedro);
    scene.add(icosaedro);
    scene.add(torus);
    scene.add(torusKnot);
    
    cargos.position.x = x;
    cargos.position.y = y;
    cargos.position.z = z;
}

function addCubo(obj, y) {
    'use strict';
    var dim = getRandomInt(0.1,maxLimit); //4 is the dimension of the container
    geometry = new THREE.BoxGeometry(dim, dim, dim);
    material = new THREE.MeshBasicMaterial({ color: "#3CB371", wireframe: _wireframe }); // Green
    mesh = new THREE.Mesh(geometry, material);
    var pos = randomPosition(dim, y, obj);
    mesh.position.set(pos.x, y, pos.z);
    obj.add(mesh);
}

function addDodecaedros(obj, y) {
    'use strict';
    var radiusD1 = getRandomInt(0.1,maxLimit);  //4 is the dimension of the container
    geometry = new THREE.DodecahedronGeometry(radiusD1, 2);
    material = new THREE.MeshBasicMaterial({ color: "#3CB371", wireframe: _wireframe });
    mesh = new THREE.Mesh(geometry, material);
    var pos = randomPosition(radiusD1, y, obj);
    mesh.position.set(pos.x, y, pos.z);
    obj.add(mesh);
}

function addIcosaedros(obj, y, detail) {
    'use strict';
    var radiusI1 = getRandomInt(0.1,maxLimit); //4 is the dimension of the container
    geometry = new THREE.IcosahedronGeometry(radiusI1, detail);
    material = new THREE.MeshBasicMaterial({ color: '#3CB371', wireframe: _wireframe }); // Green
    mesh = new THREE.Mesh(geometry, material);
    var pos = randomPosition(radiusI1, y, obj);
    mesh.position.set(pos.x, y, pos.z);
    obj.add(mesh);
}

function addTorus(obj, y, tube, radialSegments, tubularSegments) {
    'use strict';
    var radiusT1 = getRandomInt(0.1,maxLimit); //4 is the dimension of the container
    geometry = new THREE.TorusGeometry(radiusT1, tube, radialSegments, tubularSegments);
    material = new THREE.MeshBasicMaterial({ color: '#3CB371', wireframe: _wireframe }); // Green
    mesh = new THREE.Mesh(geometry, material);
    var pos = randomPosition(radiusT1, y, obj);
    mesh.position.set(pos.x, y, pos.z);
    obj.add(mesh);
}

function addTorusKnot(obj, y, tube, radialSegments, tubularSegments, p, q) {
    'use strict';
    var radiusTK1 = getRandomInt(0.1,maxLimit); //4 is the dimension of the container
    geometry = new THREE.TorusKnotGeometry(radiusTK1, tube, radialSegments, tubularSegments, p, q);
    material = new THREE.MeshBasicMaterial({ color: "#3CB371", wireframe: _wireframe }); // Green
    mesh = new THREE.Mesh(geometry, material);
    var pos = randomPosition(radiusTK1, y, obj);
    mesh.position.set(pos.x, y, pos.z);
    obj.add(mesh);
}

function setWireframe() {
    'use strict';
    
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material.wireframe = !_wireframe;
        }
    });
    _wireframe = !_wireframe;
}



function checkCollision(newPos, newRadius) {
    
    const newPosVector = new THREE.Vector3(newPos.x, 0, newPos.z); // Using Vector3 for newPos
    const combinedRadiusSquared = newRadius;

    return placedObjects.some(obj => {
        const distanceSquared = obj.vector.distanceToSquared(newPosVector);
        return distanceSquared <= (combinedRadiusSquared + obj.radius)**2; // Correct comparison using squared values
    });
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }

function randomPosition(radius, y, object) {
    const maxAttempts = 100;
    let attempt = 0;
    let newPos;

    do {
        newPos = {
            x: getRandomInt(-6, 6),
            y: y,
            z: getRandomInt(-6, 6)
        };
        if (!checkCollision(newPos, radius)) {
            placedObjects.push({vector: new THREE.Vector3(newPos.x, y, newPos.z), radius: radius, object: object});
            return newPos;
        }
        attempt++;
    } while (attempt < maxAttempts);

    //Failed to find a non-overlapping position
    return null;
}

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.background = new THREE.Color('Snow');

    scene.add(new THREE.AxesHelper(10));

    addContainer(3, 0, 3);    // Adiciona o contentor
    addCargos(0, 0, 0);       // Adiciona as cargas

    createHub();
    createCrane(0, 0, 0);
}

function createCamera() {
    'use strict';

    // Front Camera
    frontCamera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 1000);
    frontCamera.position.set(0, 5, 200);
    frontCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Side Camera
    sideCamera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 1000);
    sideCamera.position.set(200, 5, 0);
    sideCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Top Camera
    topCamera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 1000);
    topCamera.position.set(0, 200, 0);
    topCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Orthographic Camera
    // Calculate the view size based on desired zoom scale
    var frustumSize = 100; // Smaller size to adjust the scale, matching perspective views
    var aspect = window.innerWidth / window.innerHeight;

    var halfWidth = frustumSize * aspect / 2;
    var halfHeight = frustumSize / 2;
    orthoCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 1, 1000);
    orthoCamera.position.set(0, 200, 0); // Maintain high position to look down
    orthoCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Fixed Perspective Camera
    fixedPerspectiveCamera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 1000);
    fixedPerspectiveCamera.position.set(-100, 100, 100);
    fixedPerspectiveCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Camera da Garra
    clawCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    clawCamera.up.set(0, -1, 0); // Isso faz com que a camera aponte para baixo
}

function onResize() {
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        activeCamera.aspect = window.innerWidth / window.innerHeight;
        activeCamera.updateProjectionMatrix();
    }

}

function onKeyDown(e) {
    'use strict';
    
    const delta = clock.getDelta();

    switch (e.keyCode) {
        case 49: // '1'
            document.getElementById('key1').style.backgroundColor = '#4169E1';
            key1Down = true;
            break;

        case 50: // '2'
            document.getElementById('key2').style.backgroundColor = '#4169E1';
            key2Down = true;
            break;

        case 51: // '3'
            document.getElementById('key3').style.backgroundColor = '#4169E1';
            key3Down = true;
            break;

        case 52: // '4'
            document.getElementById('key4').style.backgroundColor = '#4169E1';
            key4Down = true;
            break;

        case 53: // '5'
            document.getElementById('key5').style.backgroundColor = '#4169E1';
            key5Down = true;
            break;

        case 54: // '6'
            document.getElementById('key6').style.backgroundColor = '#4169E1';
            key6Down = true;
            break;

        case 55: // '7'
            key7Down = true;
            document.getElementById('key7').style.backgroundColor = '#4169E1';
            setWireframe();
            break;    

        case 65: // A - Rotate crane counterclockwise
            document.getElementById('keyA').style.backgroundColor = '#B22222';
            keyADown = true;
            break;

        case 81: // Q - Rotate crane clockwise
            document.getElementById('keyQ').style.backgroundColor = '#B22222';
            keyQDown = true;
            break;

        case 83: // S - moves the car <-
            document.getElementById('keyS').style.backgroundColor = '#FF8C00';
            keySDown = true;
            break;
            
        case 87: // W - move the car ->
            document.getElementById('keyW').style.backgroundColor = '#FF8C00';
            keyWDown = true;
            break;

        case 69: // 'E' - moves clawGroup up
            document.getElementById('keyE').style.backgroundColor = '#FF69B4';
            keyEDown = true;
            break;

        case 68: // 'D' - moves clawGroup down
            document.getElementById('keyD').style.backgroundColor = '#FF69B4';
            keyDDown = true;
            break;
        
        case 82: // 'R' for Open claws
            document.getElementById('keyR').style.backgroundColor = '#FFD700';
            keyRDown = true;
            break;

        case 70: // 'F' for Close claws
            document.getElementById('keyF').style.backgroundColor = '#FFD700';
            keyFDown = true;
            break;
    }
    if (key1Down || key2Down || key3Down || key4Down || key5Down || key6Down || keyADown || keyQDown || keyWDown || keySDown || keyEDown || keyDDown || keyRDown || keyFDown) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function update(delta) {
    'use strict';

    if (key1Down) {
        activeCamera = frontCamera;
    }

    if (key2Down) {
        activeCamera = sideCamera;
    }

    if (key3Down) {
        activeCamera = topCamera;
    }

    if (key4Down) {
        activeCamera = orthoCamera;
    }

    if (key5Down) {
        activeCamera = fixedPerspectiveCamera;
    }

    if (key6Down) {
        activeCamera = clawCamera;
    }

    if (keyADown) {
        craneUpperPart.rotation.y -= (3 * delta); // Adjust rotation step as necessary
    }

    if (keyQDown) {
        craneUpperPart.rotation.y += (3 * delta); // Adjust rotation step as necessary
    }

    if (keySDown) {
        if (keyWOn == false) {
            keyWOn = true;
        }
        if (carGroup.position.z <= -5.5) { // STOP
            keySOn = false;
        }
        else if (keySOn == true) {
            carGroup.position.z -= (3 * delta);
        }
    }

    if (keyWDown) {
        if (keySOn == false) {
            keySOn = true;
        }
        if (carGroup.position.x >= 1.25) {// STOP
            keyWOn = false;
        }
        else if (keyWOn == true){
            carGroup.position.x += (3 * delta); 
        }
    }

    if (keyEDown) {

        if (keyDOn == false) {
            keyDOn = true;
        }
        if (clawGroup.position.y >= 3.5) { // tive de fazer assim para arredondar o valor
            keyEOn = false;
        }
        else if (keyEOn == true) {
            clawGroup.position.y += 2 * delta;
            hook_h += 2 * delta;
            resizeCable();
        }
    }

    if (keyDDown) {
        if (keyEOn == false) {
            keyEOn = true;
        }
        if (clawGroup.position.y <= -1.3) {
            keyDOn = false;
        }
        else if (keyDOn == true) {
            clawGroup.position.y -= 2 * delta;
            hook_h -= 2 * delta;
            resizeCable();
        }
    }

    if (keyRDown) {
        if (keyROn == false) {
            keyROn = true;
        }
        for (let i = 0; i < claws.length; i++) {
            if (claws[i].rotation.z >= 0) {  // Limit rotation to avoid unrealistic movement
                keyROn = false;
                break;
            } else if (keyROn == true) {
                claws[i].rotation.z += 0.05 * delta;
            }
        }
    }

    if (keyFDown) {
        if (keyFOn == false) {
            keyFOn = true;
        }
        for (let i = 0; i < claws.length; i++) {
            if (claws[i].rotation.z <= -0.38) {
                keyFOn = false;
                break;
            } else if (keyFOn == true) {
                claws[i].rotation.z -= 0.05 * delta;
            }
        }
    }
}

function checkHookCollision(hookMainframe) {
    var hookPos = new THREE.Vector3();
    hookMainframe.getWorldPosition(hookPos);
    const hookRadius = 1; 

    return placedObjects.find(obj => {
        const distanceSquared = obj.vector.distanceToSquared(hookPos);
        return distanceSquared < (hookRadius + obj.radius) ** 2;
    });
}

function onKeyUp(e) {
    'use strict';

    switch (e.keyCode) {
        case 49: // '1'
            document.getElementById('key1').style.backgroundColor = '#87CEFA';
            key1Down = false; 
            break;
        case 50: // '2'
            document.getElementById('key2').style.backgroundColor = '#87CEFA';
            key2Down = false; 
            break;
        case 51: // '3'
            document.getElementById('key3').style.backgroundColor = '#87CEFA';
            key3Down = false;
            break;
        case 52: // '4'
            document.getElementById('key4').style.backgroundColor = '#87CEFA';  
            key4Down = false;
            break;
        case 53: // '5'
            document.getElementById('key5').style.backgroundColor = '#87CEFA';
            key5Down = false;
            break;
        case 54: // '6'
            document.getElementById('key6').style.backgroundColor = '#87CEFA';
            key6Down = false;
            break;
        case 55: // '7'
            document.getElementById('key7').style.backgroundColor = '#87CEFA'; 
            key7Down = false; 
            break;    
        case 65: // A
            document.getElementById('keyA').style.backgroundColor = '#F08080';
            keyADown = false;
            break;
        case 81: // Q
            document.getElementById('keyQ').style.backgroundColor = '#F08080';
            keyQDown = false;
            break;
        case 83: // S
            document.getElementById('keyS').style.backgroundColor = '#FFD700';
            keySDown = false;
            break;
        case 87: // W
            document.getElementById('keyW').style.backgroundColor = '#FFD700';
            keyWDown = false;
            break;
        case 69: // E
            document.getElementById('keyE').style.backgroundColor = '#DDA0DD';
            keyEDown = false;
            break;
        case 68: // D
            document.getElementById('keyD').style.backgroundColor = '#DDA0DD';
            keyDDown = false;
            break;
        case 82: // R
            document.getElementById('keyR').style.backgroundColor = '#F0E68C';
            keyRDown = false;
            break;
        case 70: // F   
            document.getElementById('keyF').style.backgroundColor = '#F0E68C';  
            keyFDown = false;
            break;
    }
}

function resizeCable() {
    'use strict';

    var cable = carGroup.getObjectByName("cable");
    var car = carGroup.getObjectByName("car");
    carGroup.remove(cable);
    addCable(carGroup, car.position.x, hook_h, car.position.z, hook_h, car_h);
}

function render() {
    'use strict';

    renderer.render(scene, activeCamera);
}   

function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera();
    activeCamera = frontCamera; // Start with the front camera

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("keyup", onKeyUp);

    animate();
}

function animate() {
    'use strict';
    const delta = clock.getDelta();

    requestAnimationFrame(animate);

    if (activeCamera === clawCamera && clawGroup) {
        var hook = clawGroup.getObjectByName('hook'); 
        if (hook) {
            var hookPos = new THREE.Vector3();
            hook.getWorldPosition(hookPos); // Obtem a posicao mundial do gancho
            clawCamera.position.set(hookPos.x, hookPos.y - 0.5, hookPos.z); // Posiciona a camera acima do gancho
            // Camera a olhar para um ponto diretamente abaixo dela
            clawCamera.lookAt(hookPos.x, hookPos.y - 100, hookPos.z); // '100' eh um valor arbitrario para garantir que a camera olha para baixo
        }
    }

    var collided_object = checkHookCollision(clawGroup.getObjectByName('hook'));
    if (!is_attached) {
        if (collided_object != undefined) {
            var mainframePos = new THREE.Vector3();
            clawGroup.getObjectByName('hook').getWorldPosition(mainframePos);
            if (collided_object.object != undefined && collided_object.object != 'container') {
                clawGroup.attach(collided_object.object);
                is_attached = true;
                attached_object = collided_object;
            }
        }
    }
    else if (is_attached && collided_object != undefined && collided_object.object == 'container') {
        clawGroup.remove(attached_object.object);
        scene.remove(attached_object.object);

        const index = placedObjects.indexOf(attached_object);
        if (index > -1) {
            placedObjects.splice(index, 1);
        }

        is_attached = false;
    }

    update(delta);
    render();
}

init();
animate();

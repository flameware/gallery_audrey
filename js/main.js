var scene,
    camera,
    zoomState,
    animState,
    renderer,
    cameraIndex,
    spotLight,
    canvasVar,
    artBoxArray,
    xhr,
    responseObject,
    newTitle,
    newDesc;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    scene.add(camera);
    zoomState = false;
    animState = false;

    xhr = new XMLHttpRequest();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    //Make Wall
    var wallBox = new THREE.BoxGeometry(1000, 100, 1);
    var wallMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 0.05
    });
    var wallMesh = new THREE.Mesh(wallBox, wallMaterial);
    wallMesh.receiveShadow = true;
    wallMesh.position.y = 20;
    scene.add(wallMesh);

    //Make Floor
    var floorTexture = new THREE.TextureLoader().load("texture/concrete.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(20, 10);
    var floorBox = new THREE.BoxGeometry(1000, 500, 1);
    var floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: floorTexture,
        shininess: 10
    });
    var floorMesh = new THREE.Mesh(floorBox, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2.0;
    floorMesh.position.y = -31;
    floorMesh.position.z = 250;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    //Make Artworks (Frames)
    var artTextureArray = [];
    artBoxArray = [];
    for (var i = 0; i < 13; i++) {
        var artTexture = new THREE.TextureLoader().load("texture/hepburn_" + i + ".png");
        var artBox = new THREE.BoxGeometry(19.2, 23.3, 1);
        var artMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: artTexture,
        });
        var artMesh = new THREE.Mesh(artBox, artMaterial);
        artMesh.position.x = i * 50 - 300;
        artMesh.position.y = 10;
        artMesh.position.z = 3;
        artMesh.castShadow = true;
        scene.add(artMesh);
        artBoxArray.push(artMesh);
    }


    // add ambient lighting
    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    // add a spotlight
    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(artBoxArray[0].position.x, 50, 100);
    spotLight.target = artBoxArray[0];
    spotLight.castShadow = true;
    spotLight.angle = Math.PI / 8;
    spotLight.penumbra = 0.7;
    spotLight.decay = 1;
    spotLight.distance = 200;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    scene.add(spotLight);

    cameraIndex = 0;
    camera.position.set(artBoxArray[0].position.x - 20, 30, 80);
    camera.lookAt(new THREE.Vector3(artBoxArray[0].position.x, 10, 1));

    // load descriptions from json file
    xhr.onload = function() {
        if (xhr.status === 200) {
            responseObject = JSON.parse(xhr.responseText);
            newTitle = '';
            newDesc = '';
            newTitle += responseObject.descriptions[0].title;
            newDesc += responseObject.descriptions[0].text;

            document.getElementById('titleText').innerHTML = newTitle;
            document.getElementById('description').innerHTML = newDesc;
        }
    }

    xhr.open('GET', 'js/description.json', true);
    xhr.send(null);

    var mainbody = document.getElementById('mainbody');

    // create a simple instance
    // by default, it only adds horizontal recognizers
    var mc = new Hammer(mainbody);

    // listen to events...
    mc.on("swipeleft swiperight", function(e) {
        if (!animState) {
            move(e.type);
        }
    });

    mc.on("tap", function(e) {
        if (!animState) {
            zoom();
        }
    })

    function animate() {
        render();
        requestAnimationFrame(animate);
        TWEEN.update();
    }

    function render() {
        renderer.render(scene, camera);
    }
    animate();

}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function move(type) {
    var duration = 1600;
    newTitle = '';
    newDesc = '';

    if (type === "swipeleft") {
        cameraIndex = cameraIndex + 1;
        if (cameraIndex > 12) {
            cameraIndex = 0;
        }
    }
    if (type === "swiperight") {
        cameraIndex = cameraIndex - 1;
        if (cameraIndex < 0) {
            cameraIndex = 12;
        }
    }
    if (type === "tap") {
        zoom();
    }
    animState = true;
    camTween();
    lightTween();

    newTitle = responseObject.descriptions[cameraIndex].title;
    newDesc = responseObject.descriptions[cameraIndex].text;
    document.getElementById('titleText').innerHTML = newTitle;
    document.getElementById('description').innerHTML = newDesc;

    function camTween() {
        var update = function() {
            camera.position.x = current.x;
        }

        var current = { x: camera.position.x };

        if (!zoomState) {
            var camtween = new TWEEN.Tween(current)
                .to({ x: artBoxArray[cameraIndex].position.x - 20 }, duration)
                .easing(TWEEN.Easing.Quintic.Out)
                .onUpdate(update)
                .onComplete(function() {
                    animState = false;
                });
        } else {
            var camtween = new TWEEN.Tween(current)
                .to({ x: artBoxArray[cameraIndex].position.x }, duration)
                .easing(TWEEN.Easing.Quintic.Out)
                .onUpdate(update)
                .onComplete(function() {
                    animState = false;
                });
        }

        camtween.start();
    }

    function lightTween() {
        var update = function() {
            spotLight.position.x = current.x;
        }

        var current = { x: spotLight.position.x };

        var lighttween = new TWEEN.Tween(current)
            .to({ x: artBoxArray[cameraIndex].position.x }, duration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(update);

        lighttween.start();
    }

    spotLight.target = artBoxArray[cameraIndex];
}

function zoom() {
    duration = 400;
    var targetzoom;
    var targetposx;
    var targetposy;

    if (!zoomState) {
        targetzoom = 25;
        targetposx = artBoxArray[cameraIndex].position.x;
        targetposy = artBoxArray[cameraIndex].position.y;
        zoomState = true;
    } else {
        targetzoom = 45;
        targetposx = artBoxArray[cameraIndex].position.x - 20;
        targetposy = artBoxArray[cameraIndex].position.y + 20;
        zoomState = false;
    }
    animState = true;
    zoomTween();

    function zoomTween() {
        var update = function() {
            camera.fov = current.fov;
            camera.position.x = current.x;
            camera.position.y = current.y;
            camera.lookAt(new THREE.Vector3(artBoxArray[cameraIndex].position.x, 10, 1));
            camera.updateProjectionMatrix();
        }

        var current = { fov: camera.fov, x: camera.position.x, y: camera.position.y };

        var zoomtween = new TWEEN.Tween(current)
            .to({ fov: targetzoom, x: targetposx, y: targetposy }, duration)
            .easing(TWEEN.Easing.Quartic.Out)
            .onUpdate(update)
            .onComplete(function() {
                animState = false;
            });

        zoomtween.start();
    }
}

window.addEventListener("load", init);
window.addEventListener("resize", onResize, false);
window.addEventListener("keydown", function (event) {
    if(event.keyCode === 37) {
        move("swiperight");
    } else if(event.keyCode === 39) {
        move("swipeleft");
    } else if(event.keyCode === 38 || event.keyCode === 40) {
        zoom();
    }
}, false);

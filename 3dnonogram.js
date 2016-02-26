//Code for final project of Computer Graphics class - Web 3D Nonogram
//Authors: Guilherme Thurler
//         Vinicius Campos

//----- Global Variables
var scene, camera, renderer; //Three.js variables
var width, height, aspect; //Window variables

var mouse; //Stores whether mouse is pressed
var pressCoord = new THREE.Vector3(); //Stores clicked cube's coordinate
var pressAxis = ""; //Stores multiple cube operations' axis
var lastPress = null; //Stores last cube that was clicked on
var marking = null; //Stores whether the first cube was marked or unmarked
var selectedAxis = null; //Stores which axis is being moved when moving axis

var cube_objects = []; //Stores instances of all cube objects in scene
var cubes = []; //Stores cubes in scene for raycasting
var cubeDictionary = {}; //Associates cube mesh id with instance of Cube class
var axis_objects = []; //Stores instances of all axismover objects in scene
var axis = []; //Stores axismover meshes for raycasting
var axisDictionary = {}; //Associates axismover mesh id with instace of AxisMover class
var num_textures = []; //Array for storing number textures for cube's side as a hint

var solution = []; //Stores solution matrix
var dimensions = []; //Stores grid dimensions
var hints_x = []; //Array for storing hints for x axis, in yz coordinates
var hints_y = []; //Array for storing hints for y axis, in xz coordinates
var hints_z = []; //Array for storing hints for z axis, in xy coordinates

var planeX = null; //Stores plane that allows movement in X axis
var planeY = null; //Stores plane that allows movement in Y axis
var planeZ = null; //Stores plane that allows movement in Z axis

var mousepos = new THREE.Vector2(); //Stores mouse position in normalized coords
var raycaster = new THREE.Raycaster(); //Raycaster for picking
var selectedMode = "none"; //Stores the current control mode - breaking, marking, etc

//----- Global Functions

function createCube(x, y, z){
    //Creates a cube centered at [x,y,z]
    var cube_geometry = new THREE.BoxGeometry(1, 1, 1);
	
	hint_x = hints_x[y][z]; //Read x axis hint
	hint_y = hints_y[x][z]; //Read y axis hint
	hint_z = hints_z[x][y]; //Read z axis hint
    
	//Set one material for each face, with according number texture
    var materials = [
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
        new THREE.MeshBasicMaterial({
            color: 0x9ADBF3
        }),
    ];
    
    if (hint_x !== null){
        materials[0].map = num_textures[hint_x].texture;
        materials[1].map = num_textures[hint_x].texture;
    }
    
    if (hint_y !== null){
        materials[2].map = num_textures[hint_y].texture;
        materials[3].map = num_textures[hint_y].texture;
    }
    
    if (hint_z !== null){
        materials[4].map = num_textures[hint_z].texture;
        materials[5].map = num_textures[hint_z].texture;
    }
    
    var obj = new Cube();

    //Actual cube object
    var cube = new THREE.Mesh(cube_geometry, new THREE.MeshFaceMaterial(materials));
    cube.position.set(x,y,z);
    cubes.push(cube);
    
    //Cube wireframe
    cube_geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    cube_material = new THREE.MeshBasicMaterial();
    var mesh = new THREE.Mesh(cube_geometry, new THREE.MeshFaceMaterial(materials));
    mesh.visible = false;
    mesh.position.set(x,y,z);
    var wireframe = new THREE.BoxHelper(mesh);
    wireframe.material.color.set("black");
    wireframe.position.set(x,y,z);
    
    //Add things to scene
    scene.add(cube);
    scene.add(mesh);
    scene.add(wireframe);
    
    //Store cube in memory
    obj.init(cube,[x,y,z],mesh,wireframe);
    cubeDictionary[cube.id] = obj;
    cube_objects.push(obj);
}

function createAxisMover(axis_n){
    //This creates an instance of the AxisMover class and positions it accordingly in
    //the scene, depending on which axis it moves.

    var axis_obj = new AxisMover();
    
    //Set geometry and proper scale
    var geometry = new THREE.CylinderGeometry(1, 3, 3, 4);
    var transformation = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
    geometry.applyMatrix(transformation);
    
    //Set material for object and wireframe
    var obj_material;
    if (axis_n == "x") obj_material = new THREE.MeshBasicMaterial({color: 0xff0000});
    else if (axis_n == "y") obj_material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    else if (axis_n == "z") obj_material = new THREE.MeshBasicMaterial({color: 0x0000ff});
    var wire_material = new THREE.MeshBasicMaterial({color: 0x00000, wireframe: true});
    
    //Create meshes
    var upperMesh = new THREE.Mesh(geometry, obj_material);
    var lowerMesh = new THREE.Mesh(geometry, obj_material);
    var upperWire = new THREE.Mesh(geometry, wire_material);
    var lowerWire = new THREE.Mesh(geometry, wire_material);
    
    //Position meshes according to axis
    var t = 0;
    if (axis_n == "x"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(-t);
        upperWire.translateX(-t);
        lowerMesh.translateX(-t);
        lowerWire.translateX(-t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(-t);
        upperWire.translateZ(-t);
        lowerMesh.translateZ(-t);
        lowerWire.translateZ(-t);
        
        //Rotate entire object for axis alignment
        upperMesh.rotation.z = Math.PI/2;
        lowerMesh.rotation.z = Math.PI/2;
        upperWire.rotation.z = Math.PI/2;
        lowerWire.rotation.z = Math.PI/2;
        
        //Rotate lower half
        lowerMesh.rotation.y = Math.PI;
        lowerWire.rotation.y = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    else if (axis_n == "y"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(t);
        upperWire.translateX(t);
        lowerMesh.translateX(t);
        lowerWire.translateX(t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(-t);
        upperWire.translateZ(-t);
        lowerMesh.translateZ(-t);
        lowerWire.translateZ(-t);
        
        //Rotate lower half
        lowerMesh.rotation.x = Math.PI;
        lowerWire.rotation.x = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    else if (axis_n == "z"){
        //Translate to location
        t = (dimensions[0]/2) + 0.5;
        upperMesh.translateX(t);
        lowerMesh.translateX(t);
        upperWire.translateX(t);
        lowerWire.translateX(t);
        t = (dimensions[1]/2) + 0.5;
        upperMesh.translateY(t);
        upperWire.translateY(t);
        lowerMesh.translateY(t);
        lowerWire.translateY(t);
        t = (dimensions[2]/2) + 0.5;
        upperMesh.translateZ(t);
        upperWire.translateZ(t);
        lowerMesh.translateZ(t);
        lowerWire.translateZ(t);
        
        //Rotate entire object for axis alignment
        upperMesh.rotation.x = Math.PI/2;
        lowerMesh.rotation.x = Math.PI/2;
        upperWire.rotation.x = Math.PI/2;
        lowerWire.rotation.x = Math.PI/2;
        
        //Rotate lower half
        lowerMesh.rotation.z = Math.PI;
        lowerWire.rotation.z = Math.PI;
        lowerMesh.translateY(0.3);
        lowerWire.translateY(0.3);
    }
    
    //Initiate AxisMover instance
    axis_obj.init(upperMesh,lowerMesh,upperWire,lowerWire,axis_n);
    
    //Add meshes to array
    axis.push(upperMesh);
    axis.push(lowerMesh);
    
    //Add instance of class to array of instances
    axis_objects.push(axis_obj);
    
    //Associate mesh ids to the created class instance
    axisDictionary[upperMesh.id] = axis_obj;
    axisDictionary[lowerMesh.id] = axis_obj;
    
    //Add things to scene
    scene.add(upperMesh);
    scene.add(lowerMesh);
    scene.add(upperWire);
    scene.add(lowerWire);
}

function centralizeGrid(dim){
    //This function is called whenever we need to center the cubes on screen so that
    //the grid's center matches the coordinate system's center.

    //The function accepts as argument an array containing how many cubes are
    //present in each coordinate axis
    offset = [];
    for (i=0; i<dimensions.length; i++){
        offset.push((-dimensions[i]/2)+0.5);
    }
    for (i=0; i<cube_objects.length; i++) cube_objects[i].moveCube(offset);
}

function destroy(obj,cube){
    //This function destroys a cube and the object associated with it
    if(!obj.marked){
        delete cubeDictionary[cube.id];
        obj.deleteCube();
    }
}

function mark(obj, cube){
    //This function [un]marks a cube, depending on its current state
    obj.marked = !(obj.marked);
    for (i = 0; i < 6; i++){
        if (obj.marked) cube.material.materials[i].color.setHex(0xF28B1E);
        else cube.material.materials[i].color.setHex(0x9ADBF3);
    }
}

function delMark(obj,cube){
    //This function [un]markes a cube for deletion, depending on its current state
    if(!obj.marked){
        obj.delMarked = !(obj.delMarked);
        for (i = 0; i < 6; i++){
            if (obj.delMarked) cube.material.materials[i].color.setHex(0x999999);
            else cube.material.materials[i].color.setHex(0x9ADBF3);
        }
    }
}

function genTexture(num){
    //Set texture
    var hint_texture = new THREEx.DynamicTexture(128,128);
    hint_texture.context.font = "bolder 72px Verdana";
    hint_texture.texture.anisotropy = renderer.getMaxAnisotropy();
    if (num == 6 || num == 9) hint_texture.clear('white').drawText(num.toString()+".", undefined, 85, 'black');
    else hint_texture.clear('white').drawText(num.toString(), undefined, 85, 'black');
    hint_texture.texture.needsUpdate = true;
    
    num_textures.push(hint_texture);
}

function readInfo(){
    //3x3x3 example:
    
    //3,3,3
    //#dimension
    //1,0,1
    //0,1,1
    //1,1,0
    //1,1,1
    //1,1,2
    //2,1,1
    //1,2,1
    //#solution
    //0,0,0
    //0,2,0
    //2,0,0
    //2,2,0
    //#hint x
    //1,0,1
    //1,1,3
    //1,2,1
    //#hint y
    //0,0,0
    //0,2,0
    //2,0,0
    //2,2,0
    //#hint z
    
    var xhr = new XMLHttpRequest();
    
    xhr.onload = function(){
        //Split file between \n
        var text = this.responseText;
        text = text.split('\n');
        
        //Read dimensions
        var dim = text[0];
        dim = dim.split(',');
        for (i = 0; i < dim.length; i++){
            dimensions.push(parseInt(dim[i]));
        }
        
        //Initialize solution matrice and hint matrices
        for (i = 0; i < dimensions[0]; i++){
            solution.push([]);
            hints_y.push([]);
            hints_z.push([]);
            for (j = 0; j < dimensions[1]; j++){
                solution[i].push([]);
                hints_x.push([]);
                hints_z[i].push(null);
                for (k = 0; k < dimensions[2]; k++){
                    solution[i][j].push(false);
                    hints_x[j].push(null);
                    hints_y[i].push(null);
                }
            }
        }
        
        //Read solution and apply changes to matrix
        var index = 2;
        var line = null;
        for (index; text[index][0] != '#'; index++){
            console.log("solution");
            line = text[index];
            line = line.split(',');
            solution[parseInt(line[0])][parseInt(line[1])][parseInt(line[2])] = true;
        }
        
        //Read hints for x axis
        index++;
        for (index; text[index][0] != '#'; index++){
            console.log("x");
            line = text[index];
            line = line.split(',');
            hints_x[parseInt(line[0])][parseInt(line[1])] = parseInt(line[2]);
        }
        
        //Read hints for y axis
        index++;
        for (index; text[index][0] != '#'; index++){
            console.log("y");
            line = text[index];
            line = line.split(',');
            hints_y[parseInt(line[0])][parseInt(line[1])] = parseInt(line[2]);
        }
        
        //Read hints for z axis
        index++;
        for (index; text[index][0] != '#'; index++){
            console.log("z");
            line = text[index];
            line = line.split(',');
            hints_z[parseInt(line[0])][parseInt(line[1])] = parseInt(line[2]);
        }
    };
    
    xhr.open('GET', 'levels/sample.txt');
    xhr.send();
}

//----- Main class that stores objects information

function Cube(){
    this.cube = null; //Stores cube mesh
    this.coord = new THREE.Vector3(); //Stores cube center
    this.wireframe_cube = null; //Stores wireframe cube mesh
    this.wireframe = null; //Stores cube wireframe
    this.marked = false; //Stores whether cube is marked or not
    this.delMarked = false; //Stores whether cube is marked for deleting or not
    this.visible = true; //Stores whether cube is visible or not
}

Cube.prototype.init = function(cube, center, wfcube, wireframe){
    //Receives a cube mesh, a 3-coordinate vector, an intermediate cube mesh for the boxhelper and a boxhelper mesh
    this.cube = cube;
    this.coord.x = center[0];
    this.coord.y = center[1];
    this.coord.z = center[2];
    this.wireframe_cube = wfcube;
    this.wireframe = wireframe;
}

Cube.prototype.deleteCube = function(){
    //Remove cube from data structures
    var index = cubes.indexOf(this.cube);
    cubes.splice(index, 1);
    index = cube_objects.indexOf(this)
    cube_objects.splice(index, 1);
    
    //Remove cube and lines from scene
    scene.remove(this.cube);
    scene.remove(this.wireframe_cube);
    scene.remove(this.wireframe);
}

Cube.prototype.moveCube = function(offset){
    //Translates cube by adding the offset to the current position
    this.cube.translateX(offset[0]);
    this.wireframe_cube.translateX(offset[0]);
    this.cube.translateY(offset[1]);
    this.wireframe_cube.translateY(offset[1]);
    this.cube.translateZ(offset[2]);
    this.wireframe_cube.translateZ(offset[2]);
}

Cube.prototype.makeInvisible = function(){
    //Makes cube invisible and removes it from the cubes array
    if (this.visible){
        this.visible = false;
        this.cube.visible = false;
        this.wireframe.material.transparent = true;
        this.wireframe.material.opacity = 0.1;
        var index = cubes.indexOf(this.cube);
        cubes.splice(index, 1);
    }
}

Cube.prototype.makeVisible = function(){
    //Makes cube visible and adds it back to the cubes array
    if (!this.visible){
        this.visible = true;
        this.cube.visible = true;
        this.wireframe.material.opacity = 1;
        cubes.push(this.cube);
    }
}

function AxisMover(){
    this.upperMesh = null;
    this.lowerMesh = null;
    this.upperWire = null;
    this.lowerWire = null;
    this.axis = null;
}

AxisMover.prototype.init = function(upM, lowM, upW, lowW, axi){
    //This functions sets all variables for the AxisMover class
    this.upperMesh = upM;
    this.lowerMesh = lowM;
    this.upperWire = upW;
    this.lowerWire = lowW;
    this.axis = axi;
}

AxisMover.prototype.move = function(axis_n,pos){
    //This function moves the object across its axis
    if (axis_n == "x"){
        this.upperMesh.position.x = pos;
        this.upperWire.position.x = pos;
        this.lowerWire.position.x = pos+0.3;
        this.lowerMesh.position.x = pos+0.3;
    }
    
    else if (axis_n == "y"){
        this.upperMesh.position.y = pos;
        this.upperWire.position.y = pos;
        this.lowerWire.position.y = pos-0.3;
        this.lowerMesh.position.y = pos-0.3;
    }
    
    else if (axis_n == "z"){
        this.upperMesh.position.z = pos;
        this.upperWire.position.z = pos;
        this.lowerWire.position.z = pos-0.3;
        this.lowerMesh.position.z = pos-0.3;
    }
}

AxisMover.prototype.reset = function(){
    //This function resets the object's position back to its original value
    var t = 0;
    if (this.axis == "x"){
        t = (dimensions[0]/2)+0.5
        this.upperMesh.position.setX(-t);
        this.upperWire.position.setX(-t);
        this.lowerMesh.position.setX(-t+0.3);
        this.lowerWire.position.setX(-t+0.3);
    }
    
    else if (this.axis == "y"){
        t = (dimensions[1]/2)+0.5
        this.upperMesh.position.setY(t);
        this.upperWire.position.setY(t);
        this.lowerMesh.position.setY(t-0.3);
        this.lowerWire.position.setY(t-0.3);
    }
    
    else if (this.axis == "z"){
        t = (dimensions[2]/2)+0.5
        this.upperMesh.position.setZ(t);
        this.upperWire.position.setZ(t);
        this.lowerMesh.position.setZ(t-0.3);
        this.lowerWire.position.setZ(t-0.3);
    }
}

//----- Main function calls

init();
animate();

function init(){
    
    //Create scene and set size
    scene = new THREE.Scene();
    
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width/height;
    
    // Create a renderer and add it to the DOM.
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    
    //Set background color to light gray
    renderer.setClearColor(0xf1f1f1, 1);
    
    //Initializes camera
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
    camera.position.z = 15;
    
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 20;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.2;
    controls.keys = [70, 71, 72]; 
    
    //Read input file
	readInfo();
    
    //Create the translation planes wherever
    var material = new THREE.MeshBasicMaterial({visible:false, side: THREE.DoubleSide});
	
	var geometry = new THREE.PlaneBufferGeometry(dimensions[0]+1, 10000);
    planeX = new THREE.Mesh(geometry, material);
    planeX.translateZ(-(dimensions[2]/2)-0.5);
    scene.add(planeX);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[1]+1, 10000);
    planeY = new THREE.Mesh(geometry, material);
    planeY.rotation.z = Math.PI/2;
    planeY.rotation.y = Math.PI/2;
    planeY.translateZ((dimensions[0]/2)+0.5);
    scene.add(planeY);
	
	geometry = new THREE.PlaneBufferGeometry(dimensions[2]+1, 10000);
    planeZ = new THREE.Mesh(geometry, material);
    planeZ.translateY((dimensions[1]/2)+0.5);
    planeZ.rotation.x = Math.PI/2;
    planeZ.rotation.z = Math.PI/2;
    scene.add(planeZ);
    
    //Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    
    //Generate number textures
	var max_dim = Math.max(...dimensions);
    for (i=0; i < max_dim+1; i++){
        genTexture(i);
    }
    
    //Draw 3x3x3 grid and centralize
    for (i=0; i<dimensions[0]; i++){
        for (j=0; j<dimensions[1]; j++){
            for (k=0; k<dimensions[2]; k++){
				createCube(i, j, k);
            }
        }
    }
    centralizeGrid();
    
    createAxisMover("x");
    createAxisMover("y");
    createAxisMover("z");
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.render(scene, camera);
}

//----- Event listeners

function onWindowResize() {
    //Resizes window accordingly
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width/height;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function onMouseMove(event) {
    //Stores mouse position in each cycle and checks for intersections
    //If intersects an object, change color to darker blue / orange
    //In addition, handles mouse button hold event, which insclude deleting and
    //marking multiple cubes, as well as slicing the grid

    event.preventDefault();

    mousepos.x = (event.clientX / width) * 2 - 1;
    mousepos.y = - (event.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mousepos, camera);
    
    if (mouse){
        //Handles mouse hold event - enters if mouse button is pressed
        if (selectedMode == "slicing"){
			//If slicing the grid, we need to update the slicer's position
            var intersections;
            if (selectedAxis.axis == "x"){
				//Get intersection with plane and move object there
                intersections = raycaster.intersectObjects([planeX]);
                if (intersections.length > 0){
                    var pos = intersections[0].point.x;
                    selectedAxis.move("x",pos);
    				//Obtain grid coordinate of said position
                    pos += dimensions[0]/2;
                    pos = Math.floor(pos);
                    pos += 0.15;
                    for (i = 0; i < cube_objects.length; i++){
    					//Make cubes visible/invisible based on grid position
                        if (cube_objects[i].coord.x < pos) cube_objects[i].makeInvisible();
                        else cube_objects[i].makeVisible();
                    }
                }
            }
            else if (selectedAxis.axis == "y"){
			//Get intersection with plane and move object there
                intersections = raycaster.intersectObjects([planeY]);
                if (intersections.length > 0){
                    var pos = intersections[0].point.y;
                    selectedAxis.move("y",pos);
    				//Obtain grid coordinate of said position
                    pos += dimensions[1]/2;
                    pos = Math.floor(pos);
                    pos += 0.15;
                    for (i = 0; i < cube_objects.length; i++){
    					//Make cubes visible/invisible based on grid position
                        if (cube_objects[i].coord.y > pos) cube_objects[i].makeInvisible();
                        else cube_objects[i].makeVisible();
                    }
                }
            }
            else if (selectedAxis.axis == "z"){
			//Get intersection with plane and move object there
                intersections = raycaster.intersectObjects([planeZ]);
                if (intersections.length > 0){
                    var pos = intersections[0].point.z;
                    selectedAxis.move("z",pos);
    				//Obtain grid coordinate of said position
                    pos += dimensions[2]/2;
                    pos = Math.floor(pos);
                    pos += 0.15;
                    for (i = 0; i < cube_objects.length; i++){
    					//Make cubes visible/invisible based on grid position
                        if (cube_objects[i].coord.z > pos) cube_objects[i].makeInvisible();
                        else cube_objects[i].makeVisible();
                    }
                }
            }
        }
        var intersections = raycaster.intersectObjects(cubes);
        if (intersections.length > 0){
            var cube = intersections[0].object;
            var obj = cubeDictionary[cube.id];
            if (obj === lastPress) return; //Mouse still over the same cube
            else lastPress = obj;
            //Multiple cube operations can only happen if cubes belong to the same
            //line - if they share two coordinates
            if (pressAxis === ""){
                //At first, we can move in any axis from the starting cube
                if (obj.coord.x === pressCoord.x && obj.coord.y === pressCoord.y){
                    //If X and Y coordinates match, we are iterating Z
                    pressAxis = "z";
                }
                else if (obj.coord.x === pressCoord.x && obj.coord.z === pressCoord.z){
                    //If X and Z coordinates match, we are iterating Y
                    pressAxis = "y";
                }
                else if (obj.coord.z === pressCoord.z && obj.coord.y === pressCoord.y){
                    //If Y and Z coordinates match, we are iterating X
                    pressAxis = "x";
                }
                else return;
                
                //Mark cubes according to mode
                if (selectedMode == "marking"){
                    if (marking !== obj.marked) mark(obj,cube);
                }
                else if (selectedMode == "multibreak"){
                    if (marking !== obj.delMarked) delMark(obj,cube);
                }
            }
            else{
                //After choosing an axis, we can only do things alongside it
                var valid = false;
                //Check if cube is alognside specified axis, set valid to true if so
                if (pressAxis === "x" && obj.coord.z === pressCoord.z && obj.coord.y === pressCoord.y){
                    valid = true;
                }
                else if (pressAxis === "y" && obj.coord.z === pressCoord.z && obj.coord.x === pressCoord.x){
                    valid = true;
                }
                else if (pressAxis === "z" && obj.coord.x === pressCoord.x && obj.coord.y === pressCoord.y){
                    valid = true;
                }
                
                //Mark cube according to mode
                if (valid && selectedMode == "marking"){
                    if (marking !== obj.marked) mark(obj,cube);
                }
                else if (valid && selectedMode == "multibreak"){
                    if (marking !== obj.delMarked) delMark(obj,cube);
                }
            }
        }
    }

    var intersections = raycaster.intersectObjects(cubes.concat(axis));
    
    //Highlight nearest cube of ray casting
    for (i = 0; i < cube_objects.length; i++){
        for (j = 0; j < 6; j++){
            if (cube_objects[i].marked) cube_objects[i].cube.material.materials[j].color.setHex(0xF28B1E); //Reset to orange if marked
            else if (cube_objects[i].delMarked) cube_objects[i].cube.material.materials[j].color.setHex(0x999999); //Reset to gray if delmarked
            else cube_objects[i].cube.material.materials[j].color.setHex(0x9ADBF3); //Reset to cyan else
        }
    }
    
    for (i = 0; i < axis_objects.length; i++){
		//Set wireframes back to black
        axis_objects[i].upperWire.material.color.setHex(0x000000);
        axis_objects[i].lowerWire.material.color.setHex(0x000000);
    }
    
    if (intersections.length > 0){
        //Only the first intersection matters
        try{
			//Intersects a cube
			for (i = 0; i < 6; i++){
                if (cubeDictionary[intersections[0].object.id].marked){
                    intersections[0].object.material.materials[i].color.setHex(0xBA4900); //Dark orange
                }
                else if (cubeDictionary[intersections[0].object.id].delMarked){
                    intersections[0].object.material.materials[i].color.setHex(0x666666); //Dark gray
                }
                else{
                    intersections[0].object.material.materials[i].color.setHex(0x779EAC); //Dark cyan
                }
			}
        }
        catch(e){
			//Intersects an axis mover - set its wireframe to white
            var obj = axisDictionary[intersections[0].object.id];
            obj.upperWire.material.color.setHex(0xFFFFFF);
            obj.lowerWire.material.color.setHex(0xFFFFFF);
        }
    }
}

function onMouseDown(event) {
    //Changes cube properties depending on current select mode. Clicks that don't intersect cubes do nothing.
    
    event.preventDefault();
	
    if (selectedMode == "slicing") return; //Prevent event when holding down mouse when slicing
    mouse = true;
    raycaster.setFromCamera(mousepos, camera);
    var intersections = raycaster.intersectObjects(cubes.concat(axis));
    
    switch (event.button){
        case 0: //left click
            if (intersections.length > 0){
                try{
					//Intersects a cube
                    var cube = intersections[0].object;
                    var obj = cubeDictionary[cube.id];
                    lastPress = obj; //Stores object for multiple cubes operations
					//Store cube grid coordinates
                    pressCoord.x = obj.coord.x;
                    pressCoord.y = obj.coord.y;
                    pressCoord.z = obj.coord.z;
					//Do action  based on mode
                    if (selectedMode == "breaking"){
                        destroy(obj,cube);
                    }
                    else if (selectedMode == "marking"){
                        mark(obj,cube);
                        marking = obj.marked;
                    }
                    else if (selectedMode == "multibreak"){
                        delMark(obj,cube);
                        marking = obj.delMarked;
                    }
                }
                catch (e){
					//Intersects an axis mover
                    var axismover = intersections[0].object;
                    var obj = axisDictionary[axismover.id];
					//Move back all other axis mover objects to prevent multi slicing
                    for (i = 0; i < axis_objects.length; i++){
                        if (obj === axis_objects[i]) continue;
                        axis_objects[i].reset();
                    }
                    controls.enabled = false;
                    selectedMode = "slicing";
					//Make all cubes visible if changing axis
                    if (selectedAxis !== obj){
                        for (i = 0; i < cube_objects.length; i++){
                            cube_objects[i].makeVisible();
                        }
                    }
                    selectedAxis = obj;
					//Unmark all break marked cubes
					for (i = 0; i < cube_objects.length; i++){
						if (cube_objects[i].delMarked){
							delMark(cube_objects[i],cube_objects[i].cube);
						}
					}
                }
            }
            break;

        case 2: //right click
    }
}

function onMouseUp(event){
    //Mouse up event

    event.preventDefault();
    mouse = false;
    pressAxis = "";
    pressCoord.x = -1;
    pressCoord.y = -1;
    pressCoord.z = -1;
    marking = null;
    if (selectedMode == "slicing"){
        selectedMode = "none";
        selectedAxis = null;
        controls.enabled = true;
    }
}

function onKeyDown(event){
    //Key down eventce
    //Pressing down W or up arrow enables break mode
    //Pressing down D or right arrow enables marking mode
    //Pressing down A or left arrow enables creating mode  
    //Pressing down S or down arrow enables multi break mode  
    
    event.preventDefault();
    if (event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38){
        //'w' or 'W' or 'up arrow'
        if (selectedMode === "none" || selectedMode === "multibreak-done"){
            selectedMode = "breaking";
            controls.enabled = false;
            //Unmark all break marked cubes
            for (i = 0; i < cube_objects.length; i++){
                if (cube_objects[i].delMarked){
                    delMark(cube_objects[i],cube_objects[i].cube);
                }
            }
        }
    }
    else if (event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39){
        //'d' or 'D' or 'right arrow'
        if (selectedMode === "none" || selectedMode === "multibreak-done"){
            selectedMode = "marking"
            controls.enabled = false;
            //Unmark all break marked cubes
            for (i = 0; i < cube_objects.length; i++){
                if (cube_objects[i].delMarked){
                    delMark(cube_objects[i],cube_objects[i].cube);
                }
            }
        }
    }
    else if (event.keyCode == 97 || event.keyCode == 65 || event.keyCode == 37){
        //'a' or 'A' or 'left arrow'
        if (selectedMode === "none" || selectedMode === "multibreak-done"){
            selectedMode = "creating"
            controls.enabled = false;
            //Unmark all break marked cubes
            for (i = 0; i < cube_objects.length; i++){
                if (cube_objects[i].delMarked){
                    delMark(cube_objects[i],cube_objects[i].cube);
                }
            }
        }
    }
    else if (event.keyCode == 83 || event.keyCode == 115 || event.keyCode == 40){
        //'s' or 'S' or 'down arrow'
        if (selectedMode === "none"){
            selectedMode = "multibreak";
            controls.enabled = false;
            return;
        }
        else if (selectedMode === "multibreak-done"){
            //Delete all break marked cubes
            selectedMode = "multibreak-delete";
            for (i = 0; i < cube_objects.length; i++){
                if (cube_objects[i].delMarked){
                    destroy(cube_objects[i],cube_objects[i].cube);
                    i--;
                }
            }
            return;
        }
    }
}

function onKeyUp(event){
    //Key up event
    //Releasing the key that matches the current mode disables it
    //Releasing anything else does not change current mode

    event.preventDefault();
    
    if ((event.keyCode == 119 || event.keyCode == 87 || event.keyCode == 38) && selectedMode == "breaking"){
        //'w' or 'W' or 'up arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
    else if ((event.keyCode == 100 || event.keyCode == 68 || event.keyCode == 39) && selectedMode == "marking"){
        //'d' or 'D' or 'right arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
    else if ((event.keyCode == 97|| event.keyCode == 65 || event.keyCode == 37) && selectedMode == "creating"){
        //'a' or 'A' or 'left arrow'
        selectedMode = "none";
        controls.enabled = true;
    }
    else if ((event.keyCode == 83|| event.keyCode == 115 || event.keyCode == 40) && selectedMode == "multibreak"){
        //'s' or 'S' or 'down arrow'
        selectedMode = "multibreak-done";
    }
    else if (selectedMode == "multibreak-delete"){
        selectedMode = "none";
        controls.enabled = true;
    }
}

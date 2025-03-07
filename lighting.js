// Vertex shader program
// we added a uniform variable, u_Size to pass the desired size to
// webgl

var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
attribute vec4 a_Color;  
varying vec4 v_Color;

// camera stuff
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

attribute vec3 a_Normal;
varying vec3 v_Normal;
varying vec4 v_VertPos;
varying vec3 v_FragPos;

void main() {
  //gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
  gl_PointSize = u_Size;
  v_Color = a_Color;  
  v_VertPos = u_ModelMatrix * a_Position; // vertex position in world coordinates

  v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
  //v_Normal = a_Normal;
}`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec4 v_Color;  
  //uniform bool u_UseVertexColor;
  varying vec3 v_Normal;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  //uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform vec4 u_LightColor;
  uniform vec3 u_camPos;

/*
  // Spotlight variables
  uniform vec3 u_SpotlightDir;  // Spotlight direction
  uniform float u_SpotlightCutoff; // Cutoff angle in radians
  uniform bool u_SpotlightOn;
  uniform vec3 u_spotlightPos;
  uniform float u_spotlightIntensity;
  */
  void main() {
    if(u_whichTexture == 2) {
      gl_FragColor = vec4(v_Normal+1.0/2.0, 1.0); // Use normals 
    } else if (u_whichTexture == 1) {
      gl_FragColor = v_Color;  // Use per-vertex color for cubes
    } else {
      gl_FragColor = u_FragColor; // Use uniform color for other objects
    }

    //vec3 lightVector = vec3(v_VertPos.xyz) - u_lightPos;
    
    vec3 lightVector = u_lightPos;
    vec3 verPosition = v_VertPos.xyz;
    lightVector = lightVector-verPosition;
    float r = length(lightVector);
   
    
    //Distance visualization
    //if(r<1.0) {
      //gl_FragColor = vec4(1,0,0,1); // whatever is reach by the light will be red
    //} else if(r<2.0) {
        //gl_FragColor = vec4(0,1,0,1); // else will be green
    //}
    

    // Light falloff visualization
    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);

    // N dot L 
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    // Reflection
    vec3 R = reflect(-L,N);

    // eye
    vec3 E = normalize(u_camPos-vec3(v_VertPos));

    // Specular
    float specular = pow(max(dot(E,R), 0.0), 10.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL * vec3(u_LightColor);
    // Ambient Light
    vec3 ambient = vec3(gl_FragColor) * 0.2;

    if(u_lightOn) {
      gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
    }

  /* 
    // Apply lighting only if enabled
    if (!u_lightOn) {
        diffuse = vec3(0.0); // If light is off, no diffuse contribution
    }
    // Spotlight Calculation
    vec3 L_spot = normalize(u_spotlightPos - v_VertPos.xyz);
    float spotEffect = dot(L_spot, normalize(u_SpotlightDir)); // i removed - from U_SpotLightDir

    vec3 spotlightDiffuse = vec3(0.0);
    if (spotEffect > cos(radians(u_SpotlightCutoff))) {
        float intensity = pow(max(spotEffect, 0.0), 2.0) * u_spotlightIntensity;
        spotlightDiffuse = vec3(gl_FragColor) * nDotL * vec3(u_LightColor) * intensity;
    }
*/
/*
    // Final Color Calculation
    if (u_SpotlightOn && u_lightOn) {
        gl_FragColor = vec4(diffuse + spotlightDiffuse + ambient, 1.0); 
    } else if (u_SpotlightOn) {
        gl_FragColor = vec4(spotlightDiffuse + ambient, 1.0); 
    } else if (u_lightOn) {
        gl_FragColor = vec4(diffuse + ambient, 1.0); 
    }
    */

}`

// Global variables. They're already defined later but they're beneficial to have global because there is only one
// of each in our program
let canvas;
let gl;
let a_Position;
let g_globalAngle = 0;
let g_magAngle = 0;
let g_yellowAngle = 0;
let g_yellowAnimation = false;

// Animation angle variables
let g_frontLeftLegAngle = 0;
let g_frontRightLegAngle = 0;
let g_backLeftLegAngle = 0;
let g_backRightLegAngle = 0;
let g_neckAngle = 0;
let g_earAngle = 0;
let g_tailAngle = 0;
let g_headAngle = 0;

// Animation on/off variables
let g_frontLeftLegAnimate = false;
let g_frontRightLegAnimate = false;
let g_backLeftLegAnimate = false;
let g_backRightLegAnimate = false;
let g_neckAnimate = false;
let g_headAnimate = false;
let g_earAnimate = false;

// Mouse rotation control variables
let g_mouseXRotation = 0;  // For rotating the animal around X-axis
let g_mouseYRotation = 0;  // For rotating the animal around Y-axis

let u_FragColor;
let a_Color;
let u_UseVertexColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
// let u_Size;

// Normal stuff
let u_whichTexture;
let a_Normal;
let g_normalOn = false;
//let g_lightPos = [0,1,-2];
let g_lightPos = [0.0,0.0,0.0];
let u_lightPos;
let u_lightOn; 
let g_lightOn = false;
let u_LightColor;
let g_LightColor = [1.0, 1.0, 1.0, 1.0]; 
let u_SpotlightOn;
let g_SpotlightOn = false;
let u_SpotlightDir;
let u_SpotlightCutoff;
let u_spotlightPos;
let g_spotlightPos;
let u_spotlightIntensity;


// Camera
let u_camPos;
let g_Camera; 
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_NormalMatrix;


function setUpWebGL() {
  // Retrieve <canvas> element
  // We got rid of the vars because it made a new local variable
  // instead of just using the global one
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // gl will keep track of whats in front of what
  gl.enable(gl.DEPTH_TEST);
  
  // Declare camera here AFTER canvas has been made
  g_Camera = new Camera(canvas);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  console.log(gl.getProgramInfoLog(gl.program));  // Check program linking errors
  const numUniforms = gl.getProgramParameter(gl.program, gl.ACTIVE_UNIFORMS);
for (let i = 0; i < numUniforms; i++) {
    const uniformInfo = gl.getActiveUniform(gl.program, i);
    console.log(`Uniform ${i}: name=${uniformInfo.name}, location=${gl.getUniformLocation(gl.program, uniformInfo.name)}`);
}


gl.useProgram(gl.program);
  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }
  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  
  // Get the storage location of a_Color 
  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
      return;
  }
  console.log("a_Color location:", a_Color);
  
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (!a_Normal) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_camPos = gl.getUniformLocation(gl.program, 'u_camPos');
  if (!u_camPos) {
    console.log('Failed to get the storage location of u_camPos');
    return;
  }

  // Get storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if(!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return false;
  }

  // Get storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if(!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  if (!u_LightColor) {
    console.log('Failed to get the storage location of u_LightColor');
    return;
  }
/*
  u_SpotlightOn= gl.getUniformLocation(gl.program, 'u_SpotlightOn');
  if (!u_SpotlightOn) {
    console.log('Failed to get the storage location of u_SpotlightOn');
    return;
  }

  u_SpotlightDir= gl.getUniformLocation(gl.program, 'u_SpotlightDir');
  if (!u_SpotlightDir) {
    console.log('Failed to get the storage location of u_SpotlightDir');
    return;
  }

  u_SpotlightCutoff= gl.getUniformLocation(gl.program, 'u_SpotlightCutoff');
  if (!u_SpotlightCutoff) {
    console.log('Failed to get the storage location of u_SpotlightCutoff');
    return;
  }

  u_spotlightPos= gl.getUniformLocation(gl.program, 'u_spotlightPos');
  if (!u_spotlightPos) {
    console.log('Failed to get the storage location of u_spotlightPos');
    return;
  }

  u_spotlightIntensity = gl.getUniformLocation(gl.program, 'u_spotlightIntensity');
  if (!u_spotlightIntensity) {
    console.log('Failed to get the storage location of u_spotlightIntensity');
    return;
  }
*/
  /*
  // Uniform to switch between vertex colors and uniform colors
  u_UseVertexColor = gl.getUniformLocation(gl.program, 'u_UseVertexColor');
  if (!u_UseVertexColor) {
    console.log('Failed to get the storage location of u_UseVertexColor');
    return;
  }
  // Get the storage location of u_Size
  // connects u_size variable to local one
  u_Size = gl.getUniformLocation(gl.program, 'u_Size')
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
  */
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y])
}

function renderAllShapes() {
  // Pass projection matrix
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_Camera.projectionMatrix.elements);
  
  // Pass view matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_Camera.viewMatrix.elements);
  
  // Pass normal matrix
  //gl.uniformMatrix4fv(u_normalMatrix, false, g_NormalMatrix.elements);
  
  // Pass the matrix to u_GlobalRotateMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  
  /*
  globalRotMat.rotate(-g_globalVerticalAngle, 1, 0,0); // might have to revert it back to how it was
  // Apply mouse-based rotation (g_mouseXRotation and g_mouseYRotation)
  globalRotMat.rotate(g_mouseXRotation, 1, 0, 0);  // Rotate the animal based on mouse X
  globalRotMat.rotate(g_mouseYRotation, 0, 1, 0);  // Rotate the animal based on mouse Y
  */
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements)

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var identityMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
 /* 
  // Spotlight properties
  let spotlightDirection = [0, -1, 0]; // Pointing downward
  let spotlightCutoff = Math.cos(Math.PI / 6); // 30-degree cutoff

  gl.uniform3f(u_SpotlightDir, spotlightDirection[0], spotlightDirection[1], spotlightDirection[2]);
  gl.uniform1f(u_SpotlightCutoff, spotlightCutoff);

  // Send spotlight stuff
  let spotLightDir = new Vector3();
  spotLightDir[1] = -1;
  spotLightDir.normalize()
  gl.uniform3fv(u_SpotlightDir, spotLightDir.elements); // Spotlight pointing downward
  gl.uniform1f(u_SpotlightCutoff, (20.0 * Math.PI/180)); // Spotlight cone angle
  gl.uniform1f(u_spotlightIntensity, 2.0); // Spotlight intensity
  // Spotlight position 
  g_spotlightPos = [0, 1, 0]; // set like dis for now
  gl.uniform3fv(u_spotlightPos, new Float32Array(g_spotlightPos));

*/

  /*
  // draw body cube
  var body1 = new Cube();
  body1.color = [1.0,0.0,0.0,1.0];
  // These operations happen in REVERSE order
  body1.matrix.translate(-.25, -.75, 0.0);
  body1.matrix.rotate(-5,1,0,0);
  body1.matrix.scale(.5, .3, .5);  
  body1.render();

  // draw a left arm
  var leftArm = new Cube();
  leftArm.color = [1,1,0,1];
  // These operations happen in REVERSE order btw
  leftArm.matrix.setTranslate(0, -0.5, 0.0);
  leftArm.matrix.rotate(-5,1,0,0);
  leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  // We want to save the place where the left arm starts before it gets moved around
  var yellowCoordinatesMat= new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, .7, .5);
  leftArm.matrix.translate(-.5,0,0);
  leftArm.render();

  // Test box
  var box = new Cube();
  box.color = [1,0,1,1];
  console.log("color i want: 1,0,1,1");
  console.log("color i got: " + box.color);
  // Makes it so that box starts where leftarm is, so that way we can start box in the same position and then
  // simply move it to where we want it to be, proportionally to where the left arm is
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0, .65, 0);
  box.matrix.rotate(g_magAngle,0,0,1);
  box.matrix.scale(.3,.3,.3);
  // Moves the box slightly forward so that the boxes don't overlap
  box.matrix.translate(-.5, 0, -0.001);
  box.render();
  let room = new Cube();
  room.color = [0.8,0.8,0.8,1];
  room.matrix.translate(-.5,-.5,-.5);
  room.matrix.scale(8,8,8);
  if(g_normalOn) {
    room.textureNum = 2;
    room.renderNorm();
  } else {
    room.render();
  }
*/
  // Pass light position to GLSL
  gl.uniform3fv(u_lightPos, new Float32Array(g_lightPos));
  // Pass light position to GLSL
  gl.uniform3f(u_camPos, g_Camera.eye.elements[0], g_Camera.eye.elements[1], g_Camera.eye.elements[2]);

  gl.uniform1i(u_lightOn, g_lightOn);

  // Send chosen light color to glsl
  gl.uniform4f(u_LightColor, g_LightColor[0], g_LightColor[1], g_LightColor[2], 1);


  // draw light
  let light = new Cube();
  light.color = [1,.918,0,1];
  light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
  light.matrix.translate(0,.4,0);
  light.matrix.scale(-.1,-.1,-.1);
  light.render();
/*
  // draw spotlight
  let spotLight = new Cube;
  spotLight.color = [1,0,0,1];
  spotLight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  spotLight.matrix.scale(-.1,-.1,-.1);
  spotLight.render();
*/
  let sphere = new Sphere();
  if(g_normalOn) sphere.textureNum = 2;
  sphere.matrix.scale(.5,.5,.5);
  sphere.matrix.translate(.9,-.3,0);
  sphere.render();
/*
  let body = new Cylinder(0.23, .9, 30);  // Radius, height, # of slices
  body.color = [1, 0.9725, 0.9058, 1]
  body.matrix.translate(-.3,0,0);
  body.render();
*/
  let body2 = new Cube();
  body2.color = [1, 0.9725, 0.9058, 1];
  body2.matrix.translate(-.56, -.2, -.001);
  body2.matrix.scale(.5, .3, .9);
  body2.normalMatrix.setInverseOf(body2.matrix).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, body2.normalMatrix.elements);
  if(g_normalOn) {
    body2.textureNum = 2;
    body2.renderNorm();
  } else {
    // reset texture num:
    body2.textureNum = 0;
    body2.render(); 
  }

  let neck = new Cylinder(.16, .5, 30);
  neck.color = [1, 0.9725, 0.9058, 1];
  neck.matrix.translate(-.3, .1, .16);
  neck.matrix.rotate(-90, 1,0,0);
  neck.matrix.translate(0,.25,0);
  neck.matrix.rotate(-g_neckAngle, 1,0,0);
  neck.matrix.translate(0,-.25,0);
  //var neckMatrix = new Matrix4(neck.matrix);
  neck.render();

  let neck2 = new Cube();
  neck2.color = [1, 0.9725, 0.9058, 1];
  neck2.matrix.rotate(-g_neckAngle, 1,0,0);
  neck2.matrix.translate(-.46,0,0);
  neck2.matrix.scale(.32,.6,.35);
  neck2.normalMatrix.setInverseOf(neck2.matrix).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, neck2.normalMatrix.elements);
  if(g_normalOn) {
    neck2.textureNum = 2;
    neck2.renderNorm();
  } else {
    // reset texture num:
    neck2.textureNum = 0;
    neck2.render(); 
  }

  // Head area
  let head = new Cube();
  head.color = [1, 0.9725, 0.9058, 1];
  head.matrix = new Matrix4(neck.matrix);
  head.matrix.translate(0, .4, 0);
  head.matrix.rotate(90, 0, 1, 0);
  head.matrix.rotate(90, 1, 0, 0);
  head.matrix.rotate(90, 0, 0, 1);
  head.matrix.translate(-.19, .36, .13);
  // Head anitmation stuff
  head.matrix.rotate(-g_headAngle, 1,0,0);
  head.matrix.translate(0,.04,0);
  head.matrix.scale(.4,.35,.45);
  head.normalMatrix.setInverseOf(head.matrix).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, head.normalMatrix.elements);

  if(g_normalOn) {
    head.textureNum = 2;
    head.renderNorm();
  } else {
    // reset texture num:
    head.textureNum = 0;
    head.render(); 
  }
  
  let face = new Cube();
  if(g_normalOn) face.textureNum = 2;
  face.color = [.93, 0.94, 0.9, 1];
  face.matrix.translate(-.42, .5, -.3);
  face.matrix = new Matrix4(head.matrix);
  face.matrix.translate(.1,.1,-.37);
  face.matrix.scale(.75,.8,.5);
  face.normalMatrix.setInverseOf(face.matrix).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, face.normalMatrix.elements);
  if(g_normalOn) {
    face.textureNum = 2;
    face.renderNorm();
  } else {
    face.render();
  } 

  let snout = new Cube();
  if(g_normalOn) snout.textureNum = 2;
  snout.color = [0,0,0,1];
  snout.matrix = new Matrix4(face.matrix);
  //snout.matrix.translate(-.32, .57, -.35);
  //snout.matrix.scale(.05,.05,.05);
  snout.matrix.translate(.4, .18, -.1);  // Adjust as needed
  snout.matrix.scale(.15, .15, .15);
  snout.normalMatrix.setInverseOf(snout.matrix).transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, snout.normalMatrix.elements);
  if(g_normalOn) {
    snout.textureNum = 2;
    snout.renderNorm();
  } else {
    snout.render();
  } 

  let leftEar = new Cube();
  if(g_normalOn) leftEar.textureNum = 2;
  leftEar.color = [1, 0.9725, 0.9058, 1];
  leftEar.matrix = new Matrix4(head.matrix);
  leftEar.matrix.translate(0.2, 0.9, .5);
  leftEar.matrix.rotate(-g_earAngle, 1,0,0);
  leftEar.matrix.scale(.15, .3, .1);
  if(g_normalOn) {
    leftEar.textureNum = 2;
    leftEar.renderNorm();
  } else {
    leftEar.render();
  } 

  let RightEar = new Cube();
  if(g_normalOn) RightEar.textureNum = 2;
  RightEar.color = [1, 0.9725, 0.9058, 1];
  RightEar.matrix = new Matrix4(head.matrix);
  RightEar.matrix.translate(0.7, 0.9, .5);
  RightEar.matrix.rotate(-g_earAngle, 1,0,0);
  RightEar.matrix.scale(.15, .3, .1);
  if(g_normalOn) {
    RightEar.textureNum = 2;
    RightEar.renderNorm();
  } else {
    RightEar.render();
  } 
/*
  // Eyes
  let leftEye = new Cylinder(.035, 0.01, 30);
  leftEye.color = [0,0,0,1];
  leftEye.matrix = new Matrix4(head.matrix);
  leftEye.matrix.translate(-.36,.7,-.301);
  leftEye.matrix.scale(2.7,2.7,1);
  leftEye.matrix.translate(.24,-.055, -.09);
  leftEye.render();

  let rightEye = new Cylinder(.035, 0.01, 30);
  rightEye.color = [0,0,0,1];
  rightEye.matrix = new Matrix4(head.matrix);
  rightEye.matrix.translate(-.24,.7,-.301);
  rightEye.matrix.scale(2.7,2.7,1);
  rightEye.matrix.translate(.33,-.055,-.09);
  rightEye.render();
 */
  let leftCornea = new Cylinder(.02, .01, 30);
  leftCornea.color = [0,0,0,1];
  leftCornea.matrix = new Matrix4(head.matrix);
  leftCornea.matrix.translate(-.36, .7, -.5);
  leftCornea.matrix.scale(2.7,2.7,1);
  leftCornea.matrix.translate(.24, -.055, 0.09);
  if(!g_normalOn) {
    leftCornea.render();
  }

  let rightCornea = new Cylinder(.02, .01, 30);
  rightCornea.color = [0,0,0,1];
  rightCornea.matrix = new Matrix4(head.matrix);
  rightCornea.matrix.translate(-.24, .7, -.302);
  rightCornea.matrix.scale(2.7,2.7,1);
  rightCornea.matrix.translate(.33, -.055, -0.1);
  if(!g_normalOn) {
    rightCornea.render();
  }


  // Legs
  // Front top and bottom left leg
  let frontLTLeg = new Cube();
  if(g_normalOn) frontLTLeg.textureNum = 2;
  frontLTLeg.color = [1, 0.9725, 0.9058, 1];
  frontLTLeg.matrix.translate(-.51, -.35, .001);
  frontLTLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    frontLTLeg.textureNum = 2;
    frontLTLeg.renderNorm();
  } else {
    frontLTLeg.render();
  } 

  let frontLBLeg = new Cube();
  if(g_normalOn) frontLBLeg.textureNum = 2;
  frontLBLeg.color = [1, 0.9725, 0.9058, 1];
  frontLBLeg.matrix.translate(-.51, -.59+0.25, .001);
  frontLBLeg.matrix.rotate(-g_frontLeftLegAngle, 1,0,0);
  frontLBLeg.matrix.translate(0,-0.25, 0);
  frontLBLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    frontLBLeg.textureNum = 2;
    frontLBLeg.renderNorm();
  } else {
    frontLBLeg.render();
  } 

  // Front top and bottom right leg
  let frontRTLeg = new Cube();
  if(g_normalOn) frontRTLeg.textureNum = 2;
  frontRTLeg.color = [1, 0.9725, 0.9058, 1];
  frontRTLeg.matrix.translate(-.24, -.35, .001);
  frontRTLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    frontRTLeg.textureNum = 2;
    frontRTLeg.renderNorm();
  } else {
    frontRTLeg.render();
  } 

  let frontRBLeg = new Cube();
  if(g_normalOn) frontRBLeg.textureNum = 2;
  frontRBLeg.color = [1, 0.9725, 0.9058, 1];
  frontRBLeg.matrix.translate(-.24, -.59+0.25, .001);
  frontRBLeg.matrix.rotate(-g_frontRightLegAngle, 1,0,0);
  frontRBLeg.matrix.translate(0,-0.25, 0);
  frontRBLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    frontRBLeg.textureNum = 2;
    frontRBLeg.renderNorm();
  } else {
    frontRBLeg.render();
  } 
  
  // Back top and bottom left leg
  let backLTLeg = new Cube();
  if(g_normalOn) backLTLeg.textureNum = 2;
  backLTLeg.color = [1, 0.9725, 0.9058, 1];
  backLTLeg.matrix.translate(-.51, -.35, .75);
  backLTLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    backLTLeg.textureNum = 2;
    backLTLeg.renderNorm();
  } else {
    backLTLeg.render();
  } 

  let backLBLeg = new Cube();
  if(g_normalOn) backLBLeg.textureNum = 2;
  backLBLeg.color = [1, 0.9725, 0.9058, 1];
  backLBLeg.matrix.translate(-.51, -.59+0.25, .75);
  backLBLeg.matrix.rotate(-g_backLeftLegAngle, 1,0,0);
  backLBLeg.matrix.translate(0,-0.25, 0);
  backLBLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    backLBLeg.textureNum = 2;
    backLBLeg.renderNorm();
  } else {
    backLBLeg.render();
  } 

  // Back top and bottom right leg
  let backRTLeg = new Cube();
  if(g_normalOn) backRTLeg.textureNum = 2;
  backRTLeg.color = [1, 0.9725, 0.9058, 1];
  backRTLeg.matrix.translate(-.24, -.35, .75);
  backRTLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    backRTLeg.textureNum = 2;
    backRTLeg.renderNorm();
  } else {
    backRTLeg.render();
  } 

  let backRBLeg = new Cube();
  if(g_normalOn) backRBLeg.textureNum = 2;
  backRBLeg.color = [1, 0.9725, 0.9058, 1];
  backRBLeg.matrix.translate(-.24, -.59+0.25, .75);
  backRBLeg.matrix.rotate(-g_backRightLegAngle, 1,0,0);
  backRBLeg.matrix.translate(0,-0.25, 0);
  backRBLeg.matrix.scale(.13, .25, .13);
  if(g_normalOn) {
    backRBLeg.textureNum = 2;
    backRBLeg.renderNorm();
  } else {
    backRBLeg.render();
  } 
 /* 
  // Tail
  let tail = new Cylinder(.04,.2, 30);
  tail.color = [1, 0.9725, 0.9058, 1];
  tail.matrix.translate(-.3, .2, .85)
  tail.matrix.rotate(-70, 1,0,0);
  tail.render();
  */
  let tail = new Cube();
  tail.color = [1, 0.9725, 0.9058, 1];
  tail.matrix.translate(-.32,0.1,.9);
  tail.matrix.rotate(-60, 1,0,0);
  tail.matrix.scale(.07,.07,.23);
  tail.render();
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variable which is the color chosen by the user
let g_selectedColor = [1.0,1.0,1.0,1.0];
// Global variable which is the user selected point size
let g_selectedSize=5;
// global variable that's the selected shape type
let g_selectedType=POINT;

function addActionsForHtmlUI() {
  // angle slider events
  document.getElementById('angleSlide').addEventListener('mousemove', function () {g_globalAngle = this.value; renderAllShapes(); })
  document.getElementById('frontLLSlide').addEventListener('mousemove', function () {g_frontLeftLegAngle = this.value; renderAllShapes(); })
  document.getElementById('frontRLSlide').addEventListener('mousemove', function () {g_frontRightLegAngle = this.value; renderAllShapes(); })
  document.getElementById('backLLSlide').addEventListener('mousemove', function () {g_backLeftLegAngle = this.value; renderAllShapes(); })
  document.getElementById('backRLSlide').addEventListener('mousemove', function () {g_backRightLegAngle = this.value; renderAllShapes(); })
  document.getElementById('neckSlide').addEventListener('mousemove', function () {g_neckAngle = this.value; renderAllShapes(); })
  document.getElementById('headSlide').addEventListener('mousemove', function () {g_headAngle = this.value; renderAllShapes(); })
  document.getElementById('earSlide').addEventListener('mousemove', function () {g_earAngle = this.value; renderAllShapes(); })

  // animation button events
  document.getElementById('frontLLAnimateOn').onclick = function () {g_frontLeftLegAnimate = true;}
  document.getElementById('frontLLAnimateOff').onclick = function () {g_frontLeftLegAnimate = false;}
  document.getElementById('frontRLAnimateOn').onclick = function () {g_frontRightLegAnimate = true;}
  document.getElementById('frontRLAnimateOff').onclick = function () {g_frontRightLegAnimate = false;}
  document.getElementById('backLLAnimateOn').onclick = function () {g_backLeftLegAnimate = true;}
  document.getElementById('backLLAnimateOff').onclick = function () {g_backLeftLegAnimate = false;}
  document.getElementById('backRLAnimateOn').onclick = function () {g_backRightLegAnimate = true;}
  document.getElementById('backRLAnimateOff').onclick = function () {g_backRightLegAnimate = false;}
  /*
  document.getElementById('neckAnimateOn').onclick = function () {g_neckAnimate = true;}
  document.getElementById('neckAnimateOff').onclick = function () {g_neckAnimate = false;}
  */
  document.getElementById('headAnimateOn').onclick = function () {g_headAnimate = true;}
  document.getElementById('headAnimateOff').onclick = function () {g_headAnimate = false;}
  document.getElementById('earAnimateOn').onclick = function () {g_earAnimate = true;}
  document.getElementById('earAnimateOff').onclick = function () {g_earAnimate = false;}

  // Normals 
  document.getElementById('normalOn').onclick = function () {g_normalOn = true;}
  document.getElementById('normalOff').onclick = function () {g_normalOn = false;}

  // Light sliders
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[0]=this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[1]=this.value/100; renderAllShapes();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[2]=this.value/100; renderAllShapes();}});
  document.getElementById('lightColor').onclick =  function() { hexToRgb(this.value); }
  // Light buttons 
  document.getElementById('lightOn').onclick = function () {g_lightOn = true;}
  document.getElementById('lightOff').onclick = function () {g_lightOn = false;}
  document.getElementById('SpotlightOn').onclick = function () {g_SpotlightOn = true;}
  document.getElementById('SpotlightOff').onclick = function () {g_SpotlightOn = false;}
}

function main() {

  // Set up canvas and gl variables
  setUpWebGL();

  // Set up GLSL shader program and connect GLSL variables
  connectVariablesToGLSL();
  
  // Set up actions for the html UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  //canvas.onmousedown  = click;
  //canvas.onmousemove  = function(ev) { if(ev.buttons == 1) { click(ev) } };
  
  // When a key is pressed call keydown function
  document.onkeydown = keydown;
/*
  // Mouse rotation control
  canvas.onmousemove  = function(ev) {
    // Convert mouse coordinates to GL coordinates
    let [x, y] = convertCoordinatesEventToGL(ev);

    // Map mouse X to X-axis rotation and mouse Y to Y-axis rotation
    g_mouseXRotation = x * 180;  // Range [-1, 1] to [-180, 180]
    g_mouseYRotation = y * 180;  // Range [-1, 1] to [-180, 180]

    // Optional: Clamp rotation values for limits
    g_mouseXRotation = Math.max(-90, Math.min(90, g_mouseXRotation));
    g_mouseYRotation = Math.max(-90, Math.min(90, g_mouseYRotation));

    // Redraw the animal with the new rotation values
    renderAllShapes();
  };
  */
  // Specify the color for clearing <canvas>
  gl.clearColor(0.678, 0.847, 0.9019, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

// Variables to keep track of fps and ms
var lastFrameTime = performance.now();
var fps = 0;

function tick() {
  // Save the current time
  g_seconds = performance.now()/1000.0-g_startTime; 

  // Debugging purposes
  //console.log(g_seconds);

  let now = performance.now();
  let deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  fps = 1000/deltaTime;

  // Update FPS display
  document.getElementById("fpsCounter").innerText = `FPS: ${fps.toFixed(1)} | Frame Time: ${deltaTime.toFixed(2)} ms`;

  // Update all angles
  updateAnimationAngles();

  // Draw everything
  renderAllShapes();

  // Tell browser to update again
  requestAnimationFrame(tick);
}

function keydown(ev) {
  let speed = 2;
  let angle = 36;
  // W
  if(ev.keyCode == 87) {
    g_Camera.moveForward(speed);
    updateViewMatrix();
    // S
  } else if(ev.keyCode == 83) {
    g_Camera.moveBackwards(speed);
    updateViewMatrix();
    // A
  } else if(ev.keyCode == 65) {
    g_Camera.moveLeft(speed);
    updateViewMatrix();
    // D
  } else if(ev.keyCode == 68) {
    g_Camera.moveRight(speed);
    updateViewMatrix();
    // Q
  }  else if(ev.keyCode == 81) {
    g_Camera.panLeft(angle);
    updateViewMatrix();
    // E
  } else if(ev.keyCode == 69) {
    g_Camera.panRight(angle);
    updateViewMatrix();
  } else if(ev.keyCode == 90) {
    addBlock();
    renderAllShapes();
  } else if(ev.keyCode == 88) {
    deleteBlock();
    renderAllShapes();
  }
}

function updateViewMatrix() {
  g_Camera.viewMatrix.setLookAt(
    g_Camera.eye.elements[0], g_Camera.eye.elements[1], g_Camera.eye.elements[2], 
    g_Camera.at.elements[0], g_Camera.at.elements[1], g_Camera.at.elements[2], 
    g_Camera.up.elements[0], g_Camera.up.elements[1], g_Camera.up.elements[2]
  );

  //console.log("matrix after being updated: " + g_Camera.viewMatrix.elements);
}

function updateAnimationAngles() {
  if(g_frontLeftLegAnimate) {
    g_frontLeftLegAngle = (15*Math.sin(g_seconds));
  }
  if(g_frontRightLegAnimate) {
    g_frontRightLegAngle = (15*Math.sin(g_seconds));
  }
  if(g_backLeftLegAnimate) {
    g_backLeftLegAngle = (15*Math.sin(g_seconds));
  }
  if(g_backRightLegAnimate) {
    g_backRightLegAngle = (15*Math.sin(g_seconds));
  }
  if(g_neckAnimate) {
    g_neckAngle = (15*Math.sin(g_seconds));
  }
  if(g_headAnimate) {
    g_headAngle = (15*Math.sin(g_seconds));
  }
  if(g_earAnimate) {
    g_earAngle = (15*Math.sin(g_seconds));
  }
  g_lightPos[0] = Math.cos(g_seconds);
}

// Array of Points
var g_shapesList = [];

function click(ev) {
  //convert coordinates to correct format
  let [x,y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

// Convert hex color to RGB
function hexToRgb(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;
  g_LightColor = [r, g, b];
  renderAllShapes();
}
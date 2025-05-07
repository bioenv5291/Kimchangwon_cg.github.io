// hw07_cone.js
import {
  resizeAspectRatio,
  setupText,
  updateText,
  Axes,
} from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";
import { Cone } from "./cone.js";
import { Cube } from "../util/cube.js";
import { Arcball } from "../util/arcball.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let lampShader;
let textOverlay;
let textOverlay2;
let textOverlay3;
let textOverlay4;
let textOverlay5;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();
let arcBallMode = "CAMERA";
let shadingMode = "SMOOTH";
let renderingMode = "PHONG";

const cone = new Cone(gl);
const lamp = new Cube(gl);
const axes = new Axes(gl, 1.5);

const cameraPos = vec3.fromValues(0, 0, 3);
const lightPos = vec3.fromValues(1.0, 0.7, 1.0);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);

const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) return;

  main()
    .then((success) => {
      if (!success) {
        console.log("program terminated");
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error("program terminated with error:", error);
    });
});

function setupKeyboardEvents() {
  document.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
      case "a":
        arcBallMode = arcBallMode === "CAMERA" ? "MODEL" : "CAMERA";
        updateText(textOverlay2, `arcball mode: ${arcBallMode}`);
        break;
      case "r":
        arcball.reset();
        modelMatrix = mat4.create();
        arcBallMode = "CAMERA";
        updateText(textOverlay2, `arcball mode: ${arcBallMode}`);
        break;
      case "f":
        shadingMode = "FLAT";
        updateText(textOverlay3, `shading mode: ${shadingMode}`);
        break;
      case "s":
        shadingMode = "SMOOTH";
        updateText(textOverlay3, `shading mode: ${shadingMode}`);
        break;
      case "p":
        renderingMode = "PHONG";
        shader.setFloat("material.shininess", 128.0); // Higher shininess for Phong
        updateText(textOverlay4, `rendering mode: ${renderingMode}`);
        break;
      case "g":
        renderingMode = "GOURAUD";
        shader.setFloat("material.shininess", 32.0); // Lower shininess for Gouraud
        updateText(textOverlay4, `rendering mode: ${renderingMode}`);
        break;
    }
  });
}

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.7, 0.8, 0.9, 1.0);

  return true;
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initLampShader() {
  const vertexShaderSource = await readShaderFile("shLampVert.glsl");
  const fragmentShaderSource = await readShaderFile("shLampFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Update camera/view matrix based on arcball mode
  if (arcBallMode === "CAMERA") {
    viewMatrix = arcball.getViewMatrix();
  } else {
    modelMatrix = arcball.getModelRotMatrix();
    viewMatrix = arcball.getViewCamDistanceMatrix();
  }

  // Draw CONE ========================================================
  shader.use();

  // Set core matrices
  shader.setMat4("u_model", modelMatrix);
  shader.setMat4("u_view", viewMatrix);
  shader.setVec3("u_viewPos", cameraPos);

  // Set shading/rendering modes
  shader.setInt("u_shadingMode", shadingMode === "SMOOTH" ? 1 : 0);
  shader.setInt("u_renderingMode", renderingMode === "PHONG" ? 1 : 0);

  // Update normals based on shading mode
  if (shadingMode === "SMOOTH") {
    cone.copyVertexNormalsToNormals();
  } else {
    cone.copyFaceNormalsToNormals();
  }

  // Set light properties (to both vertex and fragment shaders)
  shader.setVec3("light.position", lightPos);
  shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
  shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
  shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));

  // Set material properties (to both vertex and fragment shaders)
  shader.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
  shader.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
  shader.setFloat(
    "material.shininess",
    renderingMode === "PHONG" ? 128.0 : 32.0
  );

  // Draw the cone
  cone.draw(shader);

  // Draw LAMP ========================================================
  lampShader.use();
  lampShader.setMat4("u_view", viewMatrix);

  // Set lamp transform
  mat4.identity(lampModelMatrix);
  mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
  mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
  lampShader.setMat4("u_model", lampModelMatrix);

  // Draw lamp object
  lamp.draw(lampShader);

  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL initialization failed");
    }

    mat4.translate(viewMatrix, viewMatrix, cameraPos);

    mat4.perspective(
      projMatrix,
      glMatrix.toRadian(60),
      canvas.width / canvas.height,
      0.1,
      100.0
    );

    shader = await initShader();
    lampShader = await initLampShader();

    shader.use();
    shader.setMat4("u_projection", projMatrix);

    // Set material properties
    shader.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
    shader.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
    shader.setFloat("material.shininess", 128.0); // Start with Phong shininess

    // Set light properties
    shader.setVec3("light.position", lightPos);
    shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
    shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
    shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
    shader.setVec3("u_viewPos", cameraPos);

    lampShader.use();
    lampShader.setMat4("u_projection", projMatrix);

    // Set up text overlays
    textOverlay = setupText(canvas, "CONE LIGHTING", 1);
    textOverlay2 = setupText(canvas, `arcball mode: ${arcBallMode}`, 2);
    textOverlay3 = setupText(canvas, `shading mode: ${shadingMode} (f/s)`, 3);
    textOverlay4 = setupText(
      canvas,
      `rendering mode: ${renderingMode} (p/g)`,
      4
    );
    textOverlay5 = setupText(
      canvas,
      "press 'a' to change arcball mode, 'r' to reset",
      5
    );

    setupKeyboardEvents();
    requestAnimationFrame(render);

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("Failed to initialize program");
    return false;
  }
}

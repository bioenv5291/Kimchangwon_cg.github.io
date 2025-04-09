/*-------------------------------------------------------------------------
08_Transformation.js

Solar System Animation with Sun, Earth, and Moon
---------------------------------------------------------------------------*/
import { resizeAspectRatio } from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

let isInitialized = false;
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let axesVAO;
let sunVAO, earthVAO, moonVAO;
let sunTransform = mat4.create();
let earthTransform = mat4.create();
let moonTransform = mat4.create();
let sunRotation = 0;
let earthRotation = 0;
let earthOrbit = 0;
let moonRotation = 0;
let moonOrbit = 0;
let lastTime = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("프로그램을 종료합니다.");
        return;
      }
      isInitialized = true;
      requestAnimationFrame(animate);
    })
    .catch((error) => {
      console.error("프로그램 실행 중 오류 발생:", error);
    });
});

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.3, 0.4, 1.0);

  return true;
}

function setupAxesBuffers(shader) {
  axesVAO = gl.createVertexArray();
  gl.bindVertexArray(axesVAO);

  const axesVertices = new Float32Array([
    -0.8,
    0.0,
    0.8,
    0.0, // x축
    0.0,
    -0.8,
    0.0,
    0.8, // y축
  ]);

  const axesColors = new Float32Array([
    1.0,
    0.3,
    0.0,
    1.0,
    1.0,
    0.3,
    0.0,
    1.0, // x축 색상
    0.0,
    1.0,
    0.5,
    1.0,
    0.0,
    1.0,
    0.5,
    1.0, // y축 색상
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
  shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

function setupSquareBuffers(shader, color) {
  const squareVertices = new Float32Array([
    -0.5,
    0.5, // 좌상단
    -0.5,
    -0.5, // 좌하단
    0.5,
    -0.5, // 우하단
    0.5,
    0.5, // 우상단
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2, // 첫 번째 삼각형
    0,
    2,
    3, // 두 번째 삼각형
  ]);

  const squareColors = new Float32Array([
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
    color[0],
    color[1],
    color[2],
    color[3],
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, squareColors, gl.STATIC_DRAW);
  shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return vao;
}

function updateTransforms(deltaTime) {
  // Update rotation angles based on speed and delta time
  sunRotation += 45 * deltaTime * (Math.PI / 180); // 45 deg/sec in radians
  earthRotation += 180 * deltaTime * (Math.PI / 180); // 180 deg/sec
  earthOrbit += 30 * deltaTime * (Math.PI / 180); // 30 deg/sec
  moonRotation += 180 * deltaTime * (Math.PI / 180); // 180 deg/sec
  moonOrbit += 360 * deltaTime * (Math.PI / 180); // 360 deg/sec

  // Sun transform (center, rotates in place)
  sunTransform = mat4.create();
  mat4.rotate(sunTransform, sunTransform, sunRotation, [0, 0, 1]);
  mat4.scale(sunTransform, sunTransform, [0.2, 0.2, 1]); // Edge length 0.2

  // Earth transform (orbits sun)
  earthTransform = mat4.create();
  mat4.translate(earthTransform, earthTransform, [
    Math.cos(earthOrbit) * 0.7,
    Math.sin(earthOrbit) * 0.7,
    0,
  ]);
  mat4.rotate(earthTransform, earthTransform, earthRotation, [0, 0, 1]);
  mat4.scale(earthTransform, earthTransform, [0.1, 0.1, 1]); // Edge length 0.1

  // Moon transform (orbits earth)
  moonTransform = mat4.create();
  mat4.translate(moonTransform, moonTransform, [
    Math.cos(earthOrbit) * 0.7,
    Math.sin(earthOrbit) * 0.7,
    0,
  ]); // Earth position
  mat4.translate(moonTransform, moonTransform, [
    Math.cos(moonOrbit) * 0.2,
    Math.sin(moonOrbit) * 0.2,
    0,
  ]); // Moon orbit
  mat4.rotate(moonTransform, moonTransform, moonRotation, [0, 0, 1]);
  mat4.scale(moonTransform, moonTransform, [0.05, 0.05, 1]); // Edge length 0.05
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  shader.use();

  // Draw axes
  shader.setMat4("u_transform", mat4.create());
  gl.bindVertexArray(axesVAO);
  gl.drawArrays(gl.LINES, 0, 4);

  // Draw Sun (Red)
  shader.setMat4("u_transform", sunTransform);
  gl.bindVertexArray(sunVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // Draw Earth (Cyan)
  shader.setMat4("u_transform", earthTransform);
  gl.bindVertexArray(earthVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // Draw Moon (Yellow)
  shader.setMat4("u_transform", moonTransform);
  gl.bindVertexArray(moonVAO);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  updateTransforms(deltaTime);
  render();
  requestAnimationFrame(animate);
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL 초기화 실패");
    }

    shader = await initShader();
    setupAxesBuffers(shader);

    // Create separate VAOs for each celestial body with their colors
    sunVAO = setupSquareBuffers(shader, [1.0, 0.0, 0.0, 1.0]); // Red
    earthVAO = setupSquareBuffers(shader, [0.0, 1.0, 1.0, 1.0]); // Cyan
    moonVAO = setupSquareBuffers(shader, [1.0, 1.0, 0.0, 1.0]); // Yellow

    shader.use();
    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}

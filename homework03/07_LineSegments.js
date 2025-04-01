/*-------------------------------------------------------------------------
07_LineSegments.js

1. When first loaded, draws a circle (user can adjust size by dragging)
2. After circle is drawn, calculates its center point
3. Then moves to line drawing state
4. Calculates intersection points between circle and line
5. Displays all data in text overlays
---------------------------------------------------------------------------*/
import {
  resizeAspectRatio,
  setupText,
  updateText,
  Axes,
} from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

// Global variables
let isInitialized = false;
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let lines = [];
let circle = null;
let intersectionPoints = [];
let textOverlay, textOverlay2, textOverlay3;
let axes = new Axes(gl, 0.85);
let appState = "circle"; // 'circle', 'line', 'result'

// DOMContentLoaded event
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

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.7, 0.8, 0.9, 1.0);

  return true;
}

function setupCanvas() {
  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
  return [(x / canvas.width) * 2 - 1, -((y / canvas.height) * 2 - 1)];
}

function setupMouseEvents() {
  function handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (appState === "circle" && !circle) {
      // Start drawing circle
      const [glX, glY] = convertToWebGLCoordinates(x, y);
      circle = {
        center: [glX, glY],
        radius: 0,
        points: [],
      };
      isDrawing = true;
    } else if (appState === "line" && !isDrawing) {
      // Start drawing line
      const [glX, glY] = convertToWebGLCoordinates(x, y);
      startPoint = [glX, glY];
      isDrawing = true;
    }
  }

  function handleMouseMove(event) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const [glX, glY] = convertToWebGLCoordinates(x, y);

    if (appState === "circle" && circle) {
      // Update circle radius while dragging
      const dx = glX - circle.center[0];
      const dy = glY - circle.center[1];
      circle.radius = Math.sqrt(dx * dx + dy * dy);

      // Generate circle points for drawing
      const segments = 64;
      circle.points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (2 * Math.PI * i) / segments;
        const px = circle.center[0] + Math.cos(angle) * circle.radius;
        const py = circle.center[1] + Math.sin(angle) * circle.radius;
        circle.points.push(px, py);
      }
    } else if (appState === "line" && startPoint) {
      // Update temporary line end point
      tempEndPoint = [glX, glY];
    }

    render();
  }

  function handleMouseUp() {
    if (!isDrawing) return;

    if (appState === "circle" && circle) {
      // Finalize circle
      isDrawing = false;
      appState = "line";
      updateText(
        textOverlay,
        `Circle: Center (${circle.center[0].toFixed(
          2
        )}, ${circle.center[1].toFixed(2)}), Radius: ${circle.radius.toFixed(
          2
        )}`
      );
    } else if (appState === "line" && startPoint && tempEndPoint) {
      // Finalize line and calculate intersections
      lines.push([...startPoint, ...tempEndPoint]);
      isDrawing = false;
      startPoint = null;
      tempEndPoint = null;

      // Calculate intersections
      intersectionPoints = findCircleLineIntersection(
        circle.center[0],
        circle.center[1],
        circle.radius,
        lines[0][0],
        lines[0][1],
        lines[0][2],
        lines[0][3]
      );

      appState = "result";
      updateText(
        textOverlay2,
        `Line: (${lines[0][0].toFixed(2)}, ${lines[0][1].toFixed(
          2
        )}) to (${lines[0][2].toFixed(2)}, ${lines[0][3].toFixed(2)})`
      );

      if (intersectionPoints.length === 0) {
        updateText(textOverlay3, "No intersection points");
      } else {
        updateText(
          textOverlay3,
          `Intersections: ${intersectionPoints
            .map((p) => `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`)
            .join(", ")}`
        );
      }
    }

    render();
  }

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
}

function findCircleLineIntersection(cx, cy, r, x1, y1, x2, y2) {
  // Vector from point 1 to point 2
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Vector from point 1 to circle center
  const fx = x1 - cx;
  const fy = y1 - cy;

  // Quadratic coefficients
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  let discriminant = b * b - 4 * a * c;

  const intersections = [];

  if (discriminant < 0) {
    return []; // No intersection
  }

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    intersections.push([x1 + t1 * dx, y1 + t1 * dy]);
  }

  if (t2 >= 0 && t2 <= 1 && Math.abs(t1 - t2) > 1e-6) {
    intersections.push([x1 + t2 * dx, y1 + t2 * dy]);
  }

  console.log("intersections:", intersections);

  return intersections;
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  shader.use();

  // Draw circle if exists
  if (circle) {
    shader.setVec4("u_color", [0.0, 0.8, 0.0, 1.0]); // Green
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(circle.points),
      gl.STATIC_DRAW
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINE_LOOP, 0, circle.points.length / 2);
  }

  // Draw saved lines
  for (let line of lines) {
    shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]); // Red
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, 2);
  }

  // Draw temporary line
  if (isDrawing && startPoint && tempEndPoint) {
    shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // Gray
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([...startPoint, ...tempEndPoint]),
      gl.STATIC_DRAW
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, 2);
  }

  // Draw intersection points
  if (intersectionPoints.length > 0) {
    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Yellow

    // Create a unit square template
    const size = 0.02;
    const unitSquare = [-size, -size, size, -size, size, size, -size, size];

    // Draw each intersection point as a separate square
    for (const point of intersectionPoints) {
      // Translate the unit square to the intersection point
      const squareVertices = unitSquare.map((coord, index) => {
        return index % 2 === 0 ? coord + point[0] : coord + point[1];
      });

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(squareVertices),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // 4 vertices per square
    }
  }

  // Draw axes
  axes.draw(mat4.create(), mat4.create());
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
    setupCanvas();
    setupBuffers(shader);
    shader.use();

    // Initialize text overlays
    textOverlay = setupText(canvas, "", 1);
    textOverlay2 = setupText(canvas, "", 2);
    textOverlay3 = setupText(canvas, "", 3);

    setupMouseEvents();
    render();

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}

import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { SquarePyramid } from './squarePyramid.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 

const cameraCircleRadius = 3.0;
const cameraXZSpeed = 90.0; // deg/sec
const cameraYSpeed  = 45.0; // deg/sec

const pyramid = new SquarePyramid(gl);
const axes = new Axes(gl, 1.8);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
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
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0;
    const elapsedTime = (currentTime - startTime) / 1000.0;
    lastFrameTime = currentTime;

    // 사각뿔은 고정: 모델 행렬 = 단위 행렬
    mat4.identity(modelMatrix);

    // 카메라 위치 계산
    const angleXZ = glMatrix.toRadian(cameraXZSpeed * elapsedTime);
    const angleY  = glMatrix.toRadian(cameraYSpeed * elapsedTime);

    const camX = cameraCircleRadius * Math.sin(angleXZ);
    const camZ = cameraCircleRadius * Math.cos(angleXZ);
    const camY = 5.0 * Math.sin(angleY) + 5.0;

    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ),
        vec3.fromValues(0, 0, 0), // 사각뿔 중심을 바라봄
        vec3.fromValues(0, 1, 0)
    );

    // 화면 초기화
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // 사각뿔 그리기
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    // 좌표축 그리기
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    if (!initWebGL()) return false;

    shader = await initShader();

    mat4.perspective(
        projMatrix,
        glMatrix.toRadian(60),
        canvas.width / canvas.height,
        0.1,
        100.0
    );

    startTime = lastFrameTime = Date.now();
    requestAnimationFrame(render);

    return true;
}

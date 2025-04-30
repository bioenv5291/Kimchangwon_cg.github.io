import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { RegularOctahedron } from './regularOctahedron.js';
import { Arcball } from '../util/arcball.js';
import { loadTexture } from '../util/texture.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();

const axes = new Axes(gl, 1.5); // xyz 축 드림
gl.enable(gl.DEPTH_TEST);

const texture = loadTexture(gl, true, './sunrise.jpg'); // 텍스처 로드
const octahedron = new RegularOctahedron(gl); // 정팔면체 객체 생성

// Arcball: 초기 거리 5, 회전 민감도 2, 줘몬 민감도 0.0005
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => {
        if (!success) return;
        isInitialized = true;
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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const viewMatrix = arcball.getViewMatrix(); // 카메라 회전

    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);

    octahedron.draw(shader);  // 정팔면체 렌더링
    axes.draw(viewMatrix, projMatrix); // xyz 축 렌더링

    requestAnimationFrame(render);
}

async function main() {
    if (!initWebGL()) return false;
    
    shader = await initShader();

    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -3));
    mat4.perspective(
        projMatrix,
        glMatrix.toRadian(60),
        canvas.width / canvas.height,
        0.1,
        100.0
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);

    requestAnimationFrame(render);
    return true;
}

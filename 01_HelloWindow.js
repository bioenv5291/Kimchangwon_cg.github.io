// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1, 0, 0, 1.0);



// Start rendering
render();


// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
    // Draw something here

    // 1️⃣ Scissor Test 활성화
    gl.enable(gl.SCISSOR_TEST);

    const w = canvas.width / 2;
    const h = canvas.height / 2;

    // 2️⃣ 좌하단 (파랑)
    gl.scissor(0, 0, w, h);
    gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 3️⃣ 우하단 (노랑)
    gl.scissor(w, 0, w, h);
    gl.clearColor(1, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 4️⃣ 좌상단 (빨강)
    gl.scissor(0, h, w, h);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 5️⃣ 우상단 (초록)
    gl.scissor(w, h, w, h);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 6️⃣ Scissor Test 비활성화 (다른 그리기 작업 방해 방지)
    gl.disable(gl.SCISSOR_TEST);

}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const size = Math.min(window.innerWidth,window.innerHeight)
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, size, size);
    render();
});


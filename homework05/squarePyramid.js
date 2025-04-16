export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // 정점 좌표 (5개)
        this.vertices = new Float32Array([
            -0.5, 0.0,  0.5,  // v0
             0.5, 0.0,  0.5,  // v1
             0.5, 0.0, -0.5,  // v2
            -0.5, 0.0, -0.5,  // v3
             0.0, 1.0,  0.0   // v4 (apex)
        ]);

        // 각 정점의 색상 (옵션 또는 기본)
        this.colors = new Float32Array([
            1, 0, 0, 1,  // red
            0, 1, 0, 1,  // green
            0, 0, 1, 1,  // blue
            1, 1, 0, 1,  // yellow
            1, 0, 1, 1   // magenta
        ]);

        // 법선 벡터 (간단히 측면 별로 올려도 되지만 여기선 평면 기준)
        this.normals = new Float32Array([
            0, -1, 0,  // v0
            0, -1, 0,  // v1
            0, -1, 0,  // v2
            0, -1, 0,  // v3
            0, 1, 0    // v4 (상단 꼭지점은 위쪽)
        ]);

        // 텍스처 좌표 (간단한 샘플)
        this.texCoords = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,
            0.5, 0.5
        ]);

        // 인덱스 (triangle 6개)
        this.indices = new Uint16Array([
            0, 1, 2,  2, 3, 0,      // base (2 triangles)
            0, 1, 4,                // side 1
            1, 2, 4,                // side 2
            2, 3, 4,                // side 3
            3, 0, 4                 // side 4
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texcoord

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}

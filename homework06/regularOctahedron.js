export class RegularOctahedron {
    constructor(gl) {
        this.gl = gl;
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const sqrt2over2 = Math.sqrt(2) / 2;

        // 6 vertices (4 around xz-plane, 1 top, 1 bottom)
        this.vertices = new Float32Array([
            0.5, 0.0, -0.5,  // v0
           -0.5, 0.0, -0.5,  // v1
           -0.5, 0.0,  0.5,  // v2
            0.5, 0.0,  0.5,  // v3
            0.0,  sqrt2over2,  0.0,  // v4 (top)
            0.0, -sqrt2over2,  0.0   // v5 (bottom)
        ]);

        // Normals (simplified per-vertex normals)
        this.normals = new Float32Array([
            0, 0, 1,   // v0
           -1, 0, 0,   // v1
            0, 0, -1,  // v2
            1, 0, 0,   // v3
            0, 1, 0,   // v4 (top)
            0, -1, 0   // v5 (bottom)
        ]);

        // Flat colors for testing (optional)
        this.colors = new Float32Array([
            1, 0, 0, 1,  // red
            0, 1, 0, 1,  // green
            0, 0, 1, 1,  // blue
            1, 1, 0, 1,  // yellow
            1, 0, 1, 1,  // magenta
            0, 1, 1, 1   // cyan
        ]);

        // Texture coordinates adjusted to match whiteboard layout
        this.texCoords = new Float32Array([
            0.75, 0.75,  // v0 (top right)
            0.25, 0.75,  // v1 (top left)
            0.25, 0.25,  // v2 (bottom left)
            0.75, 0.25,  // v3 (bottom right)
            0.5, 1.0,    // v4 (top center)
            0.5, 0.0     // v5 (bottom center)
        ]);

        // Indices for 8 triangular faces
        this.indices = new Uint16Array([
            0, 1, 4,  // top front-left
            1, 2, 4,  // top back-left
            2, 3, 4,  // top back-right
            3, 0, 4,  // top front-right
            1, 0, 5,  // bottom front-left
            2, 1, 5,  // bottom back-left
            3, 2, 5,  // bottom back-right
            0, 3, 5   // bottom front-right
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

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);

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
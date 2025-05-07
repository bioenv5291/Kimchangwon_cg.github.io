export class Cone {
  /**
   * @param {WebGLRenderingContext} gl         - WebGL rendering context
   * @param {number} segments                 - Number of segments around the base (default 32)
   * @param {object} options
   *        options.color : [r, g, b, a] color array (default [0.8, 0.8, 0.8, 1.0])
   */
  constructor(gl, segments = 32, options = {}) {
    this.gl = gl;

    // VAO, VBO, EBO creation
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();

    // Parameters
    const radius = 0.5; // Base radius
    const height = 1.0; // Total height
    const baseY = -0.5; // Base y-coordinate
    const apexY = baseY + height; // Apex y-coordinate
    this.segments = segments;

    // Angle step between segments
    const angleStep = (2 * Math.PI) / segments;

    // Temporary arrays for data
    const positions = [];
    const normals = [];
    const colors = [];
    const texCoords = [];
    const indices = [];

    // Color from options or default
    const defaultColor = [0.8, 0.8, 0.8, 1.0];
    const colorOption = options.color || defaultColor;

    // Apex vertex (index 0)
    positions.push(0.0, apexY, 0.0);
    normals.push(0.0, 1.0, 0.0); // Temporary, will be recalculated
    colors.push(...colorOption);
    texCoords.push(0.5, 1.0); // Center top for texture

    // Base vertices (indices 1 to segments+1)
    for (let i = 0; i <= segments; i++) {
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      positions.push(x, baseY, z);

      // Calculate normal for side faces (will be normalized later)
      const sideNormal = [x, radius / height, z];
      normals.push(...sideNormal);

      colors.push(...colorOption);
      texCoords.push(i / segments, 0.0); // Around the base for texture
    }

    // Indices for side faces (triangles from apex to base)
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, (i % segments) + 1);
    }

    // Convert to typed arrays
    this.vertices = new Float32Array(positions);
    this.normals = new Float32Array(normals);
    this.colors = new Float32Array(colors);
    this.texCoords = new Float32Array(texCoords);
    this.indices = new Uint16Array(indices);

    // Backup normals for flat/smooth shading
    this.faceNormals = new Float32Array(this.normals);
    this.vertexNormals = new Float32Array(this.normals);
    this.computeVertexNormals();
    this.computeFaceNormals();

    // Initialize WebGL buffers
    this.initBuffers();
  }

  /**
   * Compute smooth shading normals (vertex normals)
   */
  // In the Cone class constructor, modify the normal calculation:
  computeVertexNormals() {
    // For cone, vertex normals are the same as the side vectors
    for (let i = 0; i < this.vertexNormals.length; i += 3) {
      const x = this.vertexNormals[i];
      const y = this.vertexNormals[i + 1];
      const z = this.vertexNormals[i + 2];

      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        this.vertexNormals[i] = x / len;
        this.vertexNormals[i + 1] = y / len;
        this.vertexNormals[i + 2] = z / len;
      }
    }

    // Special case for apex vertex
    if (this.vertexNormals.length >= 3) {
      // Average the normals of all connected faces for the apex
      let nx = 0,
        ny = 0,
        nz = 0;
      for (let i = 1; i <= this.segments; i++) {
        nx += this.vertexNormals[i * 3];
        ny += this.vertexNormals[i * 3 + 1];
        nz += this.vertexNormals[i * 3 + 2];
      }
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        this.vertexNormals[0] = nx / len;
        this.vertexNormals[1] = ny / len;
        this.vertexNormals[2] = nz / len;
      }
    }
  }

  /**
   * Compute flat shading normals (face normals)
   */
  computeFaceNormals() {
    // For each triangle face, compute the face normal
    for (let i = 0; i < this.indices.length; i += 3) {
      const idx0 = this.indices[i] * 3;
      const idx1 = this.indices[i + 1] * 3;
      const idx2 = this.indices[i + 2] * 3;

      // Get triangle vertices
      const v0 = [
        this.vertices[idx0],
        this.vertices[idx0 + 1],
        this.vertices[idx0 + 2],
      ];
      const v1 = [
        this.vertices[idx1],
        this.vertices[idx1 + 1],
        this.vertices[idx1 + 2],
      ];
      const v2 = [
        this.vertices[idx2],
        this.vertices[idx2 + 1],
        this.vertices[idx2 + 2],
      ];

      // Compute two edges
      const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

      // Cross product to get face normal
      const nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
      const ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
      const nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        // Assign this normal to all three vertices of the face
        for (let j = 0; j < 3; j++) {
          const idx = this.indices[i + j] * 3;
          this.faceNormals[idx] = nx / len;
          this.faceNormals[idx + 1] = ny / len;
          this.faceNormals[idx + 2] = nz / len;
        }
      }
    }
  }

  // Copy face normals to current normals
  copyFaceNormalsToNormals() {
    this.normals.set(this.faceNormals);
    this.updateNormals();
  }

  // Copy vertex normals to current normals
  copyVertexNormalsToNormals() {
    this.normals.set(this.vertexNormals);
    this.updateNormals();
  }

  /**
   * Initialize WebGL buffers
   */
  initBuffers() {
    const gl = this.gl;

    // Calculate buffer sizes
    const vSize = this.vertices.byteLength;
    const nSize = this.normals.byteLength;
    const cSize = this.colors.byteLength;
    const tSize = this.texCoords.byteLength;
    const totalSize = vSize + nSize + cSize + tSize;

    // Set up VAO
    gl.bindVertexArray(this.vao);

    // Set up VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);

    // Fill buffer with data
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

    // Set up EBO
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    // Set up vertex attributes
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // positions
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normals
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // colors
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoords

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    // Clean up
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Update normals in GPU buffer
   */
  updateNormals() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const vSize = this.vertices.byteLength;
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /**
   * Draw the cone
   * @param {Shader} shader - Shader to use for rendering
   */
  draw(shader) {
    const gl = this.gl;
    shader.use();
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  /**
   * Clean up resources
   */
  delete() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    gl.deleteVertexArray(this.vao);
  }
}

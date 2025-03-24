#version 300 es

layout (location = 0) in vec3 aPos;

uniform float verticalMove1;
uniform float verticalMove2;

void main() {
    gl_Position = vec4(aPos[0]+verticalMove1, aPos[1] +verticalMove2, aPos[2], 1.0);
} 
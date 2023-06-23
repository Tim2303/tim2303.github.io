#version 300 es

precision highp float;

uniform mat4 matrWVP;

in vec4 in_pos;

out vec3 pos;
out vec3 color;

void main() {
    gl_Position = matrWVP * in_pos;
    color = vec3(in_pos.x, in_pos.y, in_pos.z) * 0.8;

    pos = vec3(gl_Position.x, gl_Position.y, gl_Position.z);
}
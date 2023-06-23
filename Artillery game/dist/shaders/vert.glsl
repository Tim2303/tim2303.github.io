#version 300 es

precision highp float;

layout(location = 0) in vec3 in_pos;
layout(location = 1) in vec4 in_color;
layout(location = 2) in vec3 in_normal;

out vec4 i_color;
out vec3 DrawPos;
out vec3 DrawNormal;

uniform mat4 MatrWVP;
uniform mat4 MatrWInv;
uniform mat4 MatrW;
uniform float Time;

void main() {
    gl_Position = MatrWVP * vec4(in_pos, 1);
    i_color = in_color;
}
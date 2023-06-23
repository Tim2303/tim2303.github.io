#version 300 es

precision highp float;

in vec4 i_color;
out vec4 o_color;

void main() {
    o_color = i_color;
}
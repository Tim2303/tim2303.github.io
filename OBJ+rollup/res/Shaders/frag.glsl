#version 300 es

precision highp float;

out vec4 o_color;
in vec3 color;

void main() {
    o_color = vec4(vec3(length(color.xyz)) / 1.0 + color.xyz / 1.0, 1);
}
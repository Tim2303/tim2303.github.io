#version 300 es
precision highp float;
in highp vec4 InPos;
void main() {
    gl_Position = InPos;
}

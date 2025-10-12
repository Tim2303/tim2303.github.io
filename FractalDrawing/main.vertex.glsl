#version 300 es

precision highp float;

// Position on canvas.
in vec4 in_pos;
// Current time.
uniform float time;
// Mouse support.
uniform float MouseX, MouseY;
// Mouse wheel.
uniform float scale_s;

// Out parameters.
out float time_vert;
out vec2 MousePos;
out vec4 pos;
out float scale;

void main(void) {
    gl_Position = in_pos;
    pos = in_pos;
    time_vert = time;
    MousePos = vec2(MouseX, MouseY);
    scale = scale_s;
}

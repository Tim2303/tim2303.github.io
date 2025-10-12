#version 300 es
precision highp float;

in vec2 v_pos;
out vec4 fragColor;

uniform float u_time;
uniform float u_scale;
uniform vec2  u_offset;
uniform int   u_mode;
uniform vec2  u_julia_c;

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

float mandelbrot(vec2 c) {
    vec2 z = vec2(0.0);
    float i;
    for (i = 0.0; i < 300.0; i++) {
        z = cmul(z, z) + c;
        if (dot(z,z) > 4.0) break;
    }
    return i;
}

float julia(vec2 z, vec2 c) {
    float i;
    for (i = 0.0; i < 300.0; i++) {
        z = cmul(z, z) + c;
        if (dot(z,z) > 4.0) break;
    }
    return i;
}

void main() {
    vec2 uv = v_pos * u_scale + u_offset;

    float n = (u_mode == 0) ? mandelbrot(uv) : julia(uv, u_julia_c);
    float t = n / 300.0;

    // Цветовая схема — сине-зелёная
    vec3 col = mix(vec3(0.0, 0.05, 0.1), vec3(0.0, 0.8, 1.0), pow(t, 0.6));
    col *= smoothstep(0.0, 1.0, t);
    fragColor = vec4(col, 1.0);
}

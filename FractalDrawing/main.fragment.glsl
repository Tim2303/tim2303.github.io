#version 300 es

precision highp float;

in vec4 pos;
in float time_vert;
in vec2 MousePos;
in float scale;

out vec4 o_color;

// Functions
vec2 CmplSet(float A, float B) {
    vec2 z = vec2(A, B);

    return z;
}

vec2 CmplAddCmpl(vec2 Z1, vec2 Z2) {
    vec2 z = vec2(Z1.x + Z2.x, Z1.y + Z2.y);

    return z;
}

vec2 CmplMulCmpl(vec2 Z1, vec2 Z2) {
    vec2 z = vec2(Z1.x * Z2.x - Z1.y * Z2.y, Z1.x * Z2.y + Z1.y * Z2.x);

    return z;
}

float CmplNorm(vec2 Z) {
    float z = sqrt(Z.x * Z.x + Z.y * Z.y);

    return z;
}

float CmplNorm2(vec2 Z) {
    float z = Z.x * Z.x + Z.y * Z.y;

    return z;
}

float Mandelbrot(vec2 Z0) {
    float n = 0.0;
    vec2 Z = Z0;

    while(n < 255.0 && CmplNorm(Z) < 2.0) {
        Z = CmplAddCmpl(CmplMulCmpl(Z, Z), Z0);
        n++;
    }

    return n;
}

void main() {
    // Count scale factor and time for shining.
    float x = 2.0 / pow(10.0, scale * 0.0000004);
    float timer = abs(sin(time_vert)) / 10.0;
    float x0 = -x + (MousePos.x - 500.0) / scale * 100.0, x1 = x + (MousePos.x - 500.0) / scale * 100.0;
    float y0 = -x + (MousePos.y - 500.0) / -scale * 100.0, y1 = x + (MousePos.y - 500.0) / -scale * 100.0;
    // Count position in frame.
    vec2 Z = CmplSet(x0 + gl_FragCoord.x * (x1 - x0) / 1000.0, y0 + gl_FragCoord.y * (y1 - y0) / 1000.0);
    // Count color.
    float n = Mandelbrot(Z) / 255.0;

    // Result color.
    o_color = vec4(timer * n / 2.0, n / 8.0, timer * n * 15.0, 1.0);
}
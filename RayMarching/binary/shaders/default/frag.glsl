#version 300 es
precision highp float;

/* Out values */
out vec4 OutColor;

/* Uniform values */
uniform vec4 CameraLocGlobalTime;
uniform vec4 ProjSizeDistFarDeltaTime;
uniform vec4 CamDirFrameW;
uniform vec4 CamUpFrameH;
uniform vec4 CamRightSmth;

/* Defines */
#define GlobalTime CameraLocGlobalTime.w
#define DeltaTime ProjSizeDistFarDeltaTime.w

#define CamLoc CameraLocGlobalTime.xyz
#define CamDir CamDirFrameW.xyz
#define CamUp CamUpFrameH.xyz
#define CamRight CamRightSmth.xyz

#define FrameW CamDirFrameW.w
#define FrameH CamUpFrameH.w

#define ProjDist ProjSizeDistFarDeltaTime.x
#define ProjSize ProjSizeDistFarDeltaTime.y
#define ProjFarClip ProjSizeDistFarDeltaTime.z

/*
* Signed distance functions
*/
float sdSphere(in vec3 p, in vec3 c, float r) {
    return length(p - c) - r;
}
float sdBox(in vec3 p, in vec3 c, vec3 b) {
    vec3 q = abs(p - c) - b;
    return length(max(q, 0.0f)) + min(max(q.x, max(q.y, q.z)), 0.0f);
}
float sdRoundBox(in vec3 p, in vec3 c, vec3 b, float r) {
    vec3 q = abs(p - c) - b + r;
    return length(max(q, 0.0f)) + min(max(q.x, max(q.y, q.z)), 0.0f) - r;
}
float sdBoxFrame(in vec3 p, in vec3 c, vec3 b, float e) {
    vec3 pc = abs(p - c) - b, q = abs(pc + e) - e;
    return min(min(length(max(vec3(pc.x, q.y, q.z), 0.0f)) + min(max(pc.x, max(q.y, q.z)), 0.0f), length(max(vec3(q.x, pc.y, q.z), 0.0f)) + min(max(q.x, max(pc.y, q.z)), 0.0f)), length(max(vec3(q.x, q.y, pc.z), 0.0f)) + min(max(q.x, max(q.y, pc.z)), 0.0f));
}
float sdTorus(in vec3 p, in vec3 c, vec2 t) {
    vec2 q = vec2(length(p.xz - c.xz) - t.x, p.y - c.y);
    return length(q) - t.y;
}
float sdCappedTorus(in vec3 p, in vec3 c, vec2 sc, float ra, float rb) {
    vec3 pc = vec3(abs(p.x - c.x), p.y - c.y, p.z - c.z);
    float k = (sc.y * pc.x > sc.x * pc.y) ? dot(pc.xy, sc) : length(pc.xy);
    return sqrt(dot(pc, pc) + ra * ra - 2.0f * ra * k) - rb;
}
float sdPlane(in vec3 p, vec4 n) {
    return abs(dot(p, n.xyz) + n.w);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5f + 0.5f * (a - b) / k, 0.0f, 1.0f);
    return mix(a, b, h) - k * h * (1.0f - h);
}

/* Shading */
vec3 Shade(vec3 P, vec3 N) {
    vec3 L = normalize(vec3(1, 2, 3));
    vec3 LC = vec3(1);
    vec3 color = vec3(0.0f, 0.25f, 0.37f);
    vec3 V = normalize(P - vec3(1000));

  // Ambient
    color = vec3(0.1f); // Ka.xyz
    N = faceforward(N, V, N);

    vec3 diff = vec3(0.3f); // KdTrans.xyz

//   // Texture.
//     vec4 tc = texture(Tex[0], DrawTexCoord * ivec2(1, -1));
//     diff *= tc.rgb;
//     if(tc.a <= 0.1f)
//         discard;
//     return tc.rgb;

  // Diffuse
    color += max(0.0f, dot(N, L)) * diff;

  // Specular
    vec3 R = reflect(V, N);
    color += pow(max(0.0f, dot(R, L)), 50.0f) * vec3(0.5f) * LC; // KsPh.w, KsPh.xyz
    return color;
}

/* Ray marching algorithm */
float arr[5];
float map_the_world(in vec3 p) {
    float displacement = sin(5.0f * p.x + sin(GlobalTime * 2.0f) * 3.0f) *
        sin(5.0f * p.y - cos(GlobalTime * 1.5f) * 4.0f) *
        sin(5.0f * p.z + cos(GlobalTime * 3.0f) * 2.0f) * 0.1f;

    arr[0] = sdSphere(p, vec3(0, sin(GlobalTime) * 5.0f, 0), 1.0f) + displacement;
    arr[1] = sdRoundBox(p, vec3(0.0f), vec3(2.0f), 0.5f);
    arr[2] = sdTorus(p, vec3(0, 3, 0), vec2(10, 1));
    arr[3] = sdPlane(p, vec4(0, 1, 0, 0));

    float minimum = arr[0];
    int i = 3;
    while(i > 0) {
        minimum = smin(minimum, arr[i], 0.5f);
        i--;
    }
    return minimum;
    /* smin(sphere_0, smin(plane_0, box_0, 0.5f), 0.5f) */
}

vec3 calculate_normal(in vec3 p) {
    const vec3 small_step = vec3(0.001f, 0.0f, 0.0f);

    float gradient_x = map_the_world(p + small_step.xyy) - map_the_world(p - small_step.xyy);
    float gradient_y = map_the_world(p + small_step.yxy) - map_the_world(p - small_step.yxy);
    float gradient_z = map_the_world(p + small_step.yyx) - map_the_world(p - small_step.yyx);

    vec3 normal = vec3(gradient_x, gradient_y, gradient_z);

    return normalize(normal);
}

vec3 ray_march(in vec3 ro, in vec3 rd) {
    float total_distance_traveled = 0.0f;
    const int NUMBER_OF_STEPS = 500;
    const float MINIMUM_HIT_DISTANCE = 0.001f;
    const float MAXIMUM_TRACE_DISTANCE = 200.0f;

    for(int i = 0; i < NUMBER_OF_STEPS; ++i) {
        vec3 current_position = ro + total_distance_traveled * rd;

        float distance_to_closest = map_the_world(current_position);

        if(distance_to_closest < MINIMUM_HIT_DISTANCE) {
            vec3 normal = calculate_normal(current_position);
            // vec3 light_position = normalize(vec3(2.0f, 5.0f, 3.0f));
            // float diffuse_intensity = max(0.0f, dot(normal, light_position));

            return Shade(current_position, normal); // vec3(1.0f, 0.0f, 0.0f) * diffuse_intensity;
        }

        if(total_distance_traveled > MAXIMUM_TRACE_DISTANCE) {
            break;
        }
        total_distance_traveled += distance_to_closest;
    }

    return vec3(0.25f, 0, 1);
}

/* Main draw function */
float CWd = 1.f;
float CRd = 10.f;
void main() {
    if(abs(gl_FragCoord.x - FrameW * .5f) < CWd && abs(gl_FragCoord.y - FrameH * .5f) < CRd ||
        abs(gl_FragCoord.x - FrameW * .5f) < CRd && abs(gl_FragCoord.y - FrameH * .5f) < CWd) {
        OutColor = vec4(1);
        return;
    }

    float Wp = ProjSize, Hp = ProjSize;
    if(FrameW > FrameH) {
        Wp *= FrameW / FrameH;
    } else {
        Hp *= FrameH / FrameW;
    }

    vec3 A = CamDir * ProjDist;
    vec3 B = CamRight * ((gl_FragCoord.x + .5f - FrameW * .5f) * Wp / FrameW);
    vec3 C = CamUp * ((.5f + gl_FragCoord.y - FrameH * .5f) * Hp / FrameH);
    vec3 X = A + B + C;

    OutColor = vec4(ray_march(CamLoc + X, normalize(X)), 1.f);
}

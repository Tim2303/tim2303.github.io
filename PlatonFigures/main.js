// import math from files.
import {mat4, vec3, camera} from "./res/Utils/math.js";
import {Prim} from "./res/Utils/prim.js";
import * as coords from "./res/Utils/coords.js";
import * as timer from "./res/Utils/timer.js";

// Load and compile shader code.
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS, )) {
        alert("Error load shader" + gl.getShaderInfoLog(shader));
    }

    return shader;
}

// Read shader from file by URL.
async function fetchShader(shaderURL) {
    try {
        const response = await fetch(shaderURL);
        const text = await response.text();

        return text;
    } catch(err) {
        console.error(err);
    }
}

// Main output function.
export function initGL(str, resFig) {
    const canvas = document.getElementById(str);
    const gl = canvas.getContext("webgl2");

    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let vsPr = fetchShader("./res/Shaders/vert.glsl");
    let fsPr = fetchShader("./res/Shaders/frag.glsl");

    // Check if shader is loaded.
    Promise.all([vsPr, fsPr]).then((res) => {
        let vs = res[0];
        let fs = res[1];

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const vertexSh = loadShader(gl, gl.VERTEX_SHADER, vs);
        const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, fs);
    
        const program = gl.createProgram();

        gl.attachShader(program, vertexSh);
        gl.attachShader(program, fragmentSh);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("Link error " + gl.getProgramInfoLog(program));
        }

        // Camera setting.
        let Cam = camera();
        Cam.set(vec3(1, 2, 4), vec3(0, 0, 0), vec3(0, 1, 0));
        Cam.setProj(0.1, 0.1, 1000);

        // Primitive setting.
        let curPrim = new Prim(gl, program, resFig[str[0]][0], resFig[str[0]][2], resFig[str[0]][1], resFig[str[0]][3], gl.TRIANGLE_STRIP, [-1]);

        // Uniform location.
        const matrLoc = gl.getUniformLocation(program, "matrWVP");

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);

        const beginTime = Date.now();
    
        const draw = () => {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);

            const timeFromStart = Date.now() - beginTime;
            const tMatrWVP = mat4().setRotate(Math.sin(timeFromStart / 1000), vec3().set(0, 1, 0)).mul(Cam.matrVP);
            gl.uniformMatrix4fv(matrLoc, false, new Float32Array(tMatrWVP.toArray()));

            gl.useProgram(program);
            curPrim.draw(gl, program);
            window.requestAnimationFrame(draw);
        }
        draw();
    })
}
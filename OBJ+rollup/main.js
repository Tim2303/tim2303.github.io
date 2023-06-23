// Import utilities from files.
import {mat4, vec3, camera} from "./res/Utils/math.js";
import {Prim} from "./res/Utils/prim.js";
import {createObject} from "./res/Utils/coords.js";
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

// Read text from file by URL.
async function fetchResource(resURL) {
    try {
        const response = await fetch(resURL);
        const text = await response.text();

        return text;
    } catch(err) {
        console.error(err);
    }
}

function loadResourcesPrm() {
    let vsPr = fetchResource("./res/Shaders/vert.glsl");
    let fsPr = fetchResource("./res/Shaders/frag.glsl");
    let Mi28_Pr = fetchResource("./res/Utils/Objects/Mi-28.obj");
    let cowPr = fetchResource("./res/Utils/Objects/cow.obj");

    return [vsPr, fsPr, Mi28_Pr, cowPr];
}

// Main output function.
export function initGL(str) {
    const canvas = document.getElementById(str);
    const gl = canvas.getContext("webgl2");

    // Check if shader is loaded.
    Promise.all(loadResourcesPrm()).then((res) => {
        // Load shaders.
        const vertexSh = loadShader(gl, gl.VERTEX_SHADER, res[0]);
        const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, res[1]);

        // First color clear, enable webGL functions.
        gl.clearColor(0.3, 0.3, 0.3, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        const program = gl.createProgram();

        gl.attachShader(program, vertexSh);
        gl.attachShader(program, fragmentSh);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(program));
        }

        // Camera settings.
        let Camera = camera();
        Camera.set(vec3(1, 2, 4), vec3(0, 0, 0), vec3(0, 1, 0));
        Camera.setProj(0.1, 0.1, 1000);

        // Uniform location.
        const matrLoc = gl.getUniformLocation(program, "matrWVP");

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);

        // Primitive setting.
        let objArray = [];
        for (let i = 2; i < res.length; i++) {
            let textObj = createObject(res[i]);
            objArray.push(new Prim(gl, program, textObj[0], textObj[1], gl.TRIANGLE, [-1]));
        }

        const beginTime = Date.now();

        const draw = () => {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const timeFromStart = Date.now() - beginTime;

            gl.useProgram(program);

            let matr1 = mat4().setRotate(Math.sin(timeFromStart / 1000), vec3().set(0, 1, 0)).scale(2.0, 2.0, 2.0).translate(2, 0, 0);
            let matr2 = mat4().setRotate(Math.cos(timeFromStart / 1000), vec3().set(0, 1, 0)).scale(0.1, 0.1, 0.1).translate(-1, 0, 0);

            objArray[0].draw(gl, Camera, matrLoc, matr1); // Mi-28
            objArray[1].draw(gl, Camera, matrLoc, matr2); // Cow

            window.requestAnimationFrame(draw);
        }
        draw();
    })
}
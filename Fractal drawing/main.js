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
export function initGL() {
    const canvas = document.getElementById("MyCan");
    const gl = canvas.getContext("webgl2");

    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let vsPr = fetchShader("./main.vertex.glsl");
    let fsPr = fetchShader("./main.fragment.glsl");

    let scale_m = 0.0001;

    Promise.all([vsPr, fsPr]).then(
        (res) => {
            let vs = res[0];
            let fs = res[1];

            const vertexSh = loadShader(gl, gl.VERTEX_SHADER, vs);
            const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, fs);
        
            const program = gl.createProgram();
        
            gl.attachShader(program, vertexSh);
            gl.attachShader(program, fragmentSh);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                alert("Link error" + gl.getProgramInfoLog(program));
            }

            // Uniform location.
            const posLoc = gl.getAttribLocation(program, "in_pos");
            const timeLoc = gl.getUniformLocation(program, "time");
            const mouseXLoc = gl.getUniformLocation(program, "MouseX");
            const mouseYLoc = gl.getUniformLocation(program, "MouseY");
            const scaleLoc = gl.getUniformLocation(program, "scale_s");

            const posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        
            const pos = [-1, 1, 0, 1, 1, 1, 1, 1, -1, -1, 0, 1,
                -1, -1, 0, 1, 1, 1, 1, 1, 1, -1, 0, 1];
        
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
            gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posLoc);
        
            gl.useProgram(program);

            const beginTime = Date.now();

            const draw = () => {
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);            
                gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(posLoc);
                gl.useProgram(program);

                // Mouse listener.
                canvas.addEventListener("mousemove", (e) => {
                    gl.uniform1f(mouseXLoc, e.clientX);
                    gl.uniform1f(mouseYLoc, e.clientY);
                });
                canvas.addEventListener("wheel", (e) => {
                    scale_m -= e.deltaY;
                });

                const timeFromStart = Date.now() - beginTime;
                gl.uniform1f(scaleLoc, scale_m);
                gl.uniform1f(timeLoc, (timeFromStart) / 1000.0);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);

                window.requestAnimationFrame(draw);
            };

            draw();
        }
    )
}

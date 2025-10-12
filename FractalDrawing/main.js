function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

async function fetchShader(url) {
    const response = await fetch(url);
    return await response.text();
}

export async function initGL() {
    const canvas = document.getElementById("MyCan");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 not supported");
        return;
    }

    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const [vsSrc, fsSrc] = await Promise.all([
        fetchShader("./main.vertex.glsl"),
        fetchShader("./main.fragment.glsl")
    ]);

    const vertexSh = loadShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, fsSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertexSh);
    gl.attachShader(program, fragmentSh);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Uniform locations
    const posLoc = gl.getAttribLocation(program, "in_pos");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const scaleLoc = gl.getUniformLocation(program, "u_scale");
    const offsetLoc = gl.getUniformLocation(program, "u_offset");
    const modeLoc = gl.getUniformLocation(program, "u_mode");
    const juliaCLoc = gl.getUniformLocation(program, "u_julia_c");

    // Fullscreen quad
    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        1,  1
    ]);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // Camera state
    let scale = 2.5;
    let offsetX = -0.5;
    let offsetY = 0.0;
    let mode = 0; // 0 = Mandelbrot, 1 = Julia

    let dragging = false;
    let lastX, lastY;

    // === Перемещение мышью ===
    canvas.addEventListener("mousedown", e => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    canvas.addEventListener("mouseup", () => dragging = false);
    canvas.addEventListener("mouseleave", () => dragging = false);

    canvas.addEventListener("mousemove", e => {
        if (mode === 1 && !dragging) {
            // В режиме Julia перемещение мыши меняет параметр C
            const rect = canvas.getBoundingClientRect();
            juliaC.x = (e.clientX - rect.left) / canvas.width * 2.0 - 1.0;
            juliaC.y = (e.clientY - rect.top) / canvas.height * 2.0 - 1.0;
        }
        if (dragging) {
            const dx = (e.clientX - lastX) / canvas.width * scale;
            const dy = (e.clientY - lastY) / canvas.height * scale;
            offsetX -= dx;
            offsetY += dy;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    // === Зум к курсору ===
    canvas.addEventListener("wheel", e => {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / canvas.width) * 2.0 - 1.0;
        const my = ((e.clientY - rect.top) / canvas.height) * 2.0 - 1.0;

        const beforeX = mx * scale + offsetX;
        const beforeY = -my * scale + offsetY;

        const zoom = Math.exp(e.deltaY * -0.001);
        scale *= zoom;

        const afterX = mx * scale + offsetX;
        const afterY = -my * scale + offsetY;

        offsetX += beforeX - afterX;
        offsetY += beforeY - afterY;
    });

    // === Меню переключения фракталов ===
    document.getElementById("mandelbrotBtn").addEventListener("click", () => {
        mode = 0;
        offsetX = -0.5;
        offsetY = 0.0;
        scale = 2.5;
    });

    document.getElementById("juliaBtn").addEventListener("click", () => {
        mode = 1;
        offsetX = 0.0;
        offsetY = 0.0;
        scale = 1.8;
    });

    // === Рендер ===
    const start = performance.now();
    function draw() {
        const time = (performance.now() - start) / 1000.0;

        gl.uniform1f(timeLoc, time);
        gl.uniform1f(scaleLoc, scale);
        gl.uniform2f(offsetLoc, offsetX, offsetY);
        gl.uniform1i(modeLoc, mode);

        const juliaCx = 0.25 + 0.18 * Math.sin(time * 0.3);
        const juliaCy = 0.25 + 0.18 * Math.cos(time * 0.4);
        gl.uniform2f(juliaCLoc, juliaCx, juliaCy);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(draw);
    }

    draw();
}

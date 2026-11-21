// Create all primitives function
export function createFigures() {

    // Cube positions.
    let sqrt22 = Math.sqrt(2) / 2;
    const cubeVertexPositions = new Float32Array([
        -sqrt22, -sqrt22, sqrt22,  //0
        sqrt22, -sqrt22, sqrt22,   //1
        -sqrt22, sqrt22, sqrt22,   //2
        sqrt22, sqrt22, sqrt22,    //3
        -sqrt22, -sqrt22, -sqrt22, //4
        sqrt22, -sqrt22, -sqrt22,  //5
        -sqrt22, sqrt22, -sqrt22,  //6
        sqrt22, sqrt22, -sqrt22,   //7
    ]);
    const cubeVertexIndices = new Uint16Array([
        //Top
        7, 6, 2, 2, 3, 7,
        //Bottom
        0, 4, 5, 5, 1, 0,
        //Left
        0, 2, 6, 6, 4, 0,
        //Right
        7, 3, 1, 1, 5, 7,
        //Front
        3, 2, 0, 0, 1, 3,
        //Back
        4, 6, 7, 7, 5, 4
    ]);

    // Tetrahedron positions.
    const tetrVertexPositions = new Float32Array([
        0,                 1,                 0,      // 0
        -Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3), // 1
        -Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3),  // 2
        Math.sqrt(8 / 9),  -1 / 3,  0                 // 3
    ]);
    const tetrVertexIndices = new Uint16Array([
        //Front
        0, 1, 2,
        //Bottom
        3, 2, 1,
        //Left
        2, 3, 0,
        //Right
        1, 0, 3
    ]);

    // Octahedron positions.
    const octaVertexPositions = new Float32Array([
        1,  0, 0, // 0
        -1, 0, 0, // 1
        0,  1, 0, // 2
        0, -1, 0, // 3
        0,  0, 1, // 4
        0,  0, -1 // 5
    ]);
    const octaVertexIndices = new Uint16Array([
        // Up-front
        0, 5, 2,
        // Down-front
        3, 5, 0,
        // Down-left
        4, 0, 2,
        // Up-right
        3, 0, 4,
        // Up-back
        1, 4, 2,
        // Down-back
        3, 4, 1,
        // Up-left
        5, 1, 2,
        // Down-left
        3, 1, 5
    ]);

    // Dodecahedron positions.
    const phi = (1 + Math.sqrt(5)) / 2;
    const c = 1 / Math.sqrt(3);   // norm to 1R-sphere
    const p = c * phi;               // phi / sqrt(3)
    const q = c / phi;               // 1 / (phi * sqrt(3))

    const dodeVertexPositions = new Float32Array([
        c,  c,  c, //  0
        c,  c, -c, //  1
        c, -c,  c, //  2
        c, -c, -c, //  3
        -c,  c,  c, //  4
        -c,  c, -c, //  5
        -c, -c,  c, //  6
        -c, -c, -c, //  7
        0,  q,  p, //  8
        0,  q, -p, //  9
        0, -q,  p, // 10
        0, -q, -p, // 11
        q,  p,  0, // 12
        q, -p,  0, // 13
        -q,  p,  0, // 14
        -q, -p,  0, // 15
        p,  0,  q, // 16
        p,  0, -q, // 17
        -p,  0,  q, // 18
        -p,  0, -q  // 19
    ]);
    
    // Rotate with upper vertex on centered top
    {
        const cosT = 1 / Math.sqrt(3);
        const sinT = Math.sqrt(2 / 3);
        const kx = -Math.SQRT1_2, kz = Math.SQRT1_2;
        for (let i = 0; i < dodeVertexPositions.length; i += 3) {
            const x = dodeVertexPositions[i];
            const y = dodeVertexPositions[i + 1];
            const z = dodeVertexPositions[i + 2];
            const dot = kx * x + kz * z;     // k * v
            const cx = -kz * y;              // (k X v).x
            const cy = kz * x - kx * z;      // (k X v).y
            const cz = kx * y;               // (k X v).z
            const f = dot * (1 - cosT);
            dodeVertexPositions[i]     = x * cosT + cx * sinT + kx * f;
            dodeVertexPositions[i + 1] = y * cosT + cy * sinT;
            dodeVertexPositions[i + 2] = z * cosT + cz * sinT + kz * f;
        }
    }

    const dodeVertexIndices = new Uint16Array([
        8, 10, 2,    8, 2, 16,    8, 16, 0,     // side 1
        8, 4, 18,    8, 18, 6,    8, 6, 10,     // side 2
        9, 1, 17,    9, 17, 3,    9, 3, 11,     // side 3
        9, 11, 7,    9, 7, 19,    9, 19, 5,     // side 4
        16, 17, 1,   16, 1, 12,   16, 12, 0,    // side 5
        16, 2, 13,   16, 13, 3,   16, 3, 17,    // side 6
        18, 4, 14,   18, 14, 5,   18, 5, 19,    // side 7
        18, 19, 7,   18, 7, 15,   18, 15, 6,    // side 8
        12, 14, 4,   12, 4, 8,    12, 8, 0,     // side 9
        12, 1, 9,    12, 9, 5,    12, 5, 14,    // side 10
        13, 2, 10,   13, 10, 6,   13, 6, 15,    // side 11
        13, 15, 7,   13, 7, 11,   13, 11, 3     // side 12
    ]);

    ///Helpful numbers for ikosahedron.
    const sqrt5 = Math.sqrt(5);
    const div1sqrt5 = 1 / sqrt5;
    const sqrt01mul5subsqr5 = Math.sqrt(0.1 * (5 - sqrt5));
    const sqrt01mul5addsqr5 = Math.sqrt(0.1 * (5 + sqrt5));

    // Ikosahedron positions.
    const ikosVertexPositions = new Float32Array([
        0, 1, 0,                                           // 0
        0, div1sqrt5, 2 / sqrt5,                           // 1
        -sqrt01mul5addsqr5, div1sqrt5, 0.5 - 0.1 * sqrt5,  // 2
        -sqrt01mul5subsqr5, div1sqrt5, -0.5 - 0.1 * sqrt5, // 3
        sqrt01mul5subsqr5, div1sqrt5, -0.5 - 0.1 * sqrt5,  // 4
        sqrt01mul5addsqr5, div1sqrt5, 0.5 - 0.1 * sqrt5,   // 5
        -sqrt01mul5subsqr5, -div1sqrt5, 0.5 + 0.5 / sqrt5, // 6
        -sqrt01mul5addsqr5, -div1sqrt5, 0.1 * sqrt5 - 0.5, // 7
        0, -div1sqrt5, -2 / sqrt5,                         // 8
        sqrt01mul5addsqr5, -div1sqrt5, 0.1 * sqrt5 - 0.5,  // 9
        sqrt01mul5subsqr5, -div1sqrt5, 0.5 + 0.5 / sqrt5,  // 10
        0, -1, 0
    ]);
    const ikosVertexIndices = new Uint16Array([
        2, 1, 0, 3, 2, 0,
        4, 3, 0, 5, 4, 0,
        1, 5, 0, 6, 10, 1,
        6, 1, 2, 7, 6, 2,
        7, 2, 3, 8, 7, 3,
        8, 3, 4, 9, 8, 4,
        9, 4, 5, 10, 9, 5,
        10, 5, 1, 9, 10, 11,
        8, 9, 11, 7, 8, 11,
        6, 7, 11, 10, 6, 11
    ]);

    return [
        [tetrVertexPositions, tetrVertexIndices, 4, 12],  // Tetrahedron positions.
        [octaVertexPositions, octaVertexIndices, 6, 24],  // Octahedron positions.
        [cubeVertexPositions, cubeVertexIndices, 8, 36],  // Cube positions.
        [dodeVertexPositions, dodeVertexIndices, 20, 108], // Dodecahedron positions.
        [ikosVertexPositions, ikosVertexIndices, 11, 60]  // Icosahedron positions.
    ];
} 


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

    // Dodecahedron positions - ///TODO
    const dodeVertexPositions = new Float32Array([
        1,  0, 0, // 0
        -1, 0, 0, // 1
        0,  1, 0, // 2
        0, -1, 0, // 3
        0,  0, 1, // 4
        0,  0, -1 // 5
    ]);
    const dodeVertexIndices = new Uint16Array([
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

    return [[tetrVertexPositions, tetrVertexIndices, 4, 12], //Tetrahedron positions.
            [octaVertexPositions, octaVertexIndices, 6, 24], //Octahedron positions.  
            [cubeVertexPositions, cubeVertexIndices, 8, 36], //Cube positions.
            [dodeVertexPositions, dodeVertexIndices, 6, 24], //Dodecahedron positions. 
            [ikosVertexPositions, ikosVertexIndices, 11, 60] //Ikosahedron positions.
        ];
} 

// const icostarIB = [
//     1, 2, 3, 2, 3, 4, 3, 4, 5, 4, 5, 1, 5, 1, 2,
  
//     6, 7, 8, 7, 8, 9, 8, 9, 10, 9, 10, 6, 10, 6, 7,
  
//     0, 1, 3, 0, 2, 4, 0, 3, 5, 0, 4, 1, 0, 5, 2,
  
//     11, 6, 8, 11, 7, 9, 11, 8, 10, 11, 9, 6, 11, 10, 7,
  
//     1, 2, 10, 2, 3, 6, 3, 4, 7, 4, 5, 8, 5, 1, 9,
  
//     6, 7, 1, 7, 8, 2, 8, 9, 3, 9, 10, 4, 10, 6, 5,
  
//     1, 5, 6, 2, 1, 7, 3, 2, 8, 4, 3, 9, 5, 4, 10,
  
//     6, 10, 2, 7, 6, 3, 8, 7, 4, 9, 8, 5, 10, 9, 1
//   ];

// import math from files.
import {mat4, vec3, camera} from "./math.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////
export class Vertex {
    constructor() {
        this.P = []; // Position
        this.T = []; // Texture coordinates
        this.N = []; // Normals
        this.C = []; // Color
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
export class Prim {
    constructor(gl, prog, V, I, type, texArray) {
        this.V = V;             // Vertex array
        this.vA = 0;            // OpenGL vertex array Id
        this.vBufId = 0;        // OpenGL vertex buffer Id
        this.iBufId = 0;        // OpenGL index buffer Id
        this.numOfElements = 0; // Number of elements
        this.type = type;       // webGL draw type 
        this.tex = texArray;    // Texture array
        this.trans = mat4(); // Additional transformation matrix

        if (V != undefined) {
            this.vBufId = gl.createBuffer();
            this.vA = gl.createVertexArray();
            const vSize = V.BYTES_PER_ELEMENT;

            gl.bindVertexArray(this.vA);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vBufId);
            gl.bufferData(gl.ARRAY_BUFFER, V.length * vSize * 4, gl.STATIC_DRAW);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, V);

            const posLoc = gl.getAttribLocation(prog, "in_pos");
            const texLoc = gl.getAttribLocation(prog, "in_tex");
            const normLoc = gl.getAttribLocation(prog, "in_n");
            const colLoc = gl.getAttribLocation(prog, "in_col");

            gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posLoc);
            // gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 12);
            // gl.enableVertexAttribArray(texLoc);
            // gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 20);
            // gl.enableVertexAttribArray(normLoc);
            // gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 32);
            // gl.enableVertexAttribArray(colLoc);

            gl.bindVertexArray(null);
        }

        if (I != undefined) {
            this.iBufId = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBufId);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I.length * 4, gl.STATIC_DRAW);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, I);
            this.numOfElements = I.length;
        } else {
            this.numOfElements = V.length;
        }
    }

    draw(gl, camera, matrLoc, matrix) {
        let matrWVP = matrix.mul(camera.matrVP);
        gl.uniformMatrix4fv(matrLoc, false, new Float32Array(matrWVP.toArray()));

        if (this.vBufId != 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vBufId);
        }
        gl.bindVertexArray(this.vA);

        if (this.iBufId != 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBufId);
            gl.drawElements(gl.TRIANGLES, this.numOfElements, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(this.type, 0, this.numOfElements);
        }

        for (let i = 0; i < this.tex.length; i++) {
            if (this.tex[i] != -1) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, tex[i]);
            }
        }
    }
}

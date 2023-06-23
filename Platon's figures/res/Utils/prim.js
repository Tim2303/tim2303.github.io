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
    constructor(gl, prog, V, numOfV, I, numOfI, type, texArray) {
        this.V = V;
        this.vA = 0; // OpenGL vertex array Id
        this.vBufId = 0; // OpenGL vertex buffer Id
        this.iBufId = 0; // OpenGL index buffer Id
        this.numOfElements = 0; // Number of elements
        this.tex = texArray;
        this.type = type;
        this.trans = mat4(); // Additional transformation matrix

        if (V != undefined && numOfV != 0) {
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

        if (I != undefined && numOfI != 0) {
            this.iBufId = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBufId);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I.length * 4, gl.STATIC_DRAW);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, I);
            this.numOfElements = numOfI;
        } else {
            this.numOfElements = numOfV;
        }
        this.angle = 0;
    }

    draw(gl, prog, world) {
        // let modelViewLoc = gl.getUniformLocation(prog, "ModelViewP");
        // camera.set(new vec3(10), new vec3(0, 0, 0), new vec3(0, 1, 0));
        // camera.setProj(0.1, 0.1, 1080);
        // camera.setSize(1600, 1600);
        // let modelView = camera.matrVP.rotateV(
        //     (this.angle += 1),
        //     new vec3(1, 1, 1)
        // );
        // let size = 0.05;
        // gl.cullFace(gl.BACK);
        // gl.uniformMatrix4fv(
        //     modelViewLoc,
        //     false,
        //     new Float32Array(modelView.toArray())
        // );

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

/* Buffers implementation */
import { gl } from "./gl";

export class _buffer {
  id: WebGLBuffer = 0;
  type: number = 0;
  size: number = 0;

  constructor(type: number, size: number) {
    let res = gl.createBuffer();
    if (!res) return;

    (this.id = res), (this.size = size), (this.type = type);
    gl.bindBuffer(this.type, this.id);
    gl.bufferData(this.type, size, gl.STATIC_DRAW);
  }

  update(data: Float32Array, offset: number, size: number) {
    gl.bindBuffer(this.type, this.id);
    gl.bufferSubData(this.type, offset, data, 0, size);
  }

  apply(prg: WebGLProgram) {
    gl.bindBuffer(this.type, this.id);
  }

  free() {
    gl.deleteBuffer(this.id);
    this.id = 0;
    this.size = 0;
  }
}

export class _vertBuffer extends _buffer {
  numOfVert: number = 0;

  constructor(vert: Float32Array, vertSize: number) {
    super(gl.ARRAY_BUFFER, vert.length);
    this.numOfVert = vert.length / vertSize;
    gl.bufferData(gl.ARRAY_BUFFER, vert, gl.STATIC_DRAW);
  }

  free() {
    super.free();
    this.numOfVert = 0;
  }
}

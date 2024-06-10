/* Camera implementation */
import { _mat4, _vec3 } from "./matr4.js";
export { _mat4, _vec3 };

export class _camera {
  // Projection
  projSize: number;
  projDist: number;
  projFarClip: number;
  // Local size data
  frameW: number;
  frameH: number;
  // Matrices
  matrView: _mat4;
  matrProj: _mat4;
  matrVP: _mat4;
  // Camera world parameters
  loc: _vec3;
  at: _vec3;
  dir: _vec3;
  up: _vec3;
  right: _vec3;

  constructor() {
    // Projection properties
    this.projSize = 0.1; // Project plane fit square
    this.projDist = 0.1; // Distance to project plane from viewer (near)
    this.projFarClip = 2000; // Distance to project far clip plane (far)

    // Local size data
    this.frameW = 30; // Frame width
    this.frameH = 30; // Frame height

    // Matrices
    this.matrView = new _mat4(); // View coordinate system matrix
    this.matrProj = new _mat4(); // Projection coordinate system matrix
    this.matrVP = new _mat4(); // View and projection matrix precalculate value

    // Set camera default settings
    this.loc = new _vec3(); // Camera location
    this.at = new _vec3(); // Camera destination
    this.dir = new _vec3(); // Camera Direction
    this.up = new _vec3(); // Camera UP direction
    this.right = new _vec3(); // Camera RIGHT direction
    this.setDef();
  } // End of 'constructor' function

  set(loc: _vec3, at: _vec3, up: _vec3) {
    this.matrView.setView(loc, at, up);
    this.loc = loc;
    this.at = at;
    this.dir.set(
      -this.matrView.a[0][2],
      -this.matrView.a[1][2],
      -this.matrView.a[2][2]
    );
    this.up.set(
      this.matrView.a[0][1],
      this.matrView.a[1][1],
      this.matrView.a[2][1]
    );
    this.right.set(
      this.matrView.a[0][0],
      this.matrView.a[1][0],
      this.matrView.a[2][0]
    );
    this.matrVP = this.matrView.mul(this.matrProj);
  }
  setProj(projSize: number, projDist: number, projFarClip: number) {
    let rx = projSize,
      ry = projSize;
    this.projDist = projDist;
    this.projSize = projSize;
    this.projFarClip = projFarClip;

    // Correct aspect ratio
    if (this.frameW > this.frameH) rx *= this.frameW / this.frameH;
    else ry *= this.frameH / this.frameW;

    this.matrProj.setFrustum(
      -rx / 2.0,
      rx / 2.0,
      -ry / 2.0,
      ry / 2.0,
      projDist,
      projFarClip
    );
    this.matrVP = this.matrView.mul(this.matrProj);
  }
  setSize(frameW: number, frameH: number) {
    if (this.frameW == frameW && this.frameH == frameH) {
      return;
    }
    this.frameW = frameW < 1 ? 1 : frameW;
    this.frameH = frameH < 1 ? 1 : frameH;
    this.setProj(this.projSize, this.projDist, this.projFarClip);
  }
  setDef() {
    this.loc.set(0, 10, -20);
    this.at.set(0, 0, 0);
    this.dir.set(0, 0, 1);
    this.up.set(0, 1, 0);
    this.right.set(1, 0, 0);

    this.projDist = 0.1;
    this.projSize = 0.1;
    this.projFarClip = 1000;

    this.frameW = 1920;
    this.frameH = 1080;

    this.set(this.loc, this.at, this.up);
    this.setProj(this.projSize, this.projDist, this.projFarClip);
    this.setSize(this.frameW, this.frameH);
  }
}

/* END OF 'camera.js' FILE */

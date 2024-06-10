/* Matrix 4x4 implementation */
import { _vec3 } from "./vec3.js";
export { _vec3 };

/* PI math constant */
const PI = 3.14159265358979323846;

/* Degrees to radians conversion */
const Degree2Radian = (alpha: number) => {
  return alpha * (PI / 180.0);
};
/* Radians to degrees conversion */
const Radian2Degree = (alpha: number) => {
  return alpha * (180.0 / PI);
};

export class _mat4 {
  a: Array<Array<number>> = [];

  constructor(arr: number[] | void) {
    if (arr == null || arr.length != 16) {
      this.a = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    } else {
      this.a = [
        [arr[0], arr[1], arr[2], arr[3]],
        [arr[4], arr[5], arr[6], arr[7]],
        [arr[8], arr[9], arr[10], arr[11]],
        [arr[12], arr[13], arr[14], arr[15]],
      ];
    }
  }

  /* Multiply function */
  mul(matr: _mat4) {
    return new _mat4([
      this.a[0][0] * matr.a[0][0] +
        this.a[0][1] * matr.a[1][0] +
        this.a[0][2] * matr.a[2][0] +
        this.a[0][3] * matr.a[3][0],
      this.a[0][0] * matr.a[0][1] +
        this.a[0][1] * matr.a[1][1] +
        this.a[0][2] * matr.a[2][1] +
        this.a[0][3] * matr.a[3][1],
      this.a[0][0] * matr.a[0][2] +
        this.a[0][1] * matr.a[1][2] +
        this.a[0][2] * matr.a[2][2] +
        this.a[0][3] * matr.a[3][2],
      this.a[0][0] * matr.a[0][3] +
        this.a[0][1] * matr.a[1][3] +
        this.a[0][2] * matr.a[2][3] +
        this.a[0][3] * matr.a[3][3],

      this.a[1][0] * matr.a[0][0] +
        this.a[1][1] * matr.a[1][0] +
        this.a[1][2] * matr.a[2][0] +
        this.a[1][3] * matr.a[3][0],
      this.a[1][0] * matr.a[0][1] +
        this.a[1][1] * matr.a[1][1] +
        this.a[1][2] * matr.a[2][1] +
        this.a[1][3] * matr.a[3][1],
      this.a[1][0] * matr.a[0][2] +
        this.a[1][1] * matr.a[1][2] +
        this.a[1][2] * matr.a[2][2] +
        this.a[1][3] * matr.a[3][2],
      this.a[1][0] * matr.a[0][3] +
        this.a[1][1] * matr.a[1][3] +
        this.a[1][2] * matr.a[2][3] +
        this.a[1][3] * matr.a[3][3],

      this.a[2][0] * matr.a[0][0] +
        this.a[2][1] * matr.a[1][0] +
        this.a[2][2] * matr.a[2][0] +
        this.a[2][3] * matr.a[3][0],
      this.a[2][0] * matr.a[0][1] +
        this.a[2][1] * matr.a[1][1] +
        this.a[2][2] * matr.a[2][1] +
        this.a[2][3] * matr.a[3][1],
      this.a[2][0] * matr.a[0][2] +
        this.a[2][1] * matr.a[1][2] +
        this.a[2][2] * matr.a[2][2] +
        this.a[2][3] * matr.a[3][2],
      this.a[2][0] * matr.a[0][3] +
        this.a[2][1] * matr.a[1][3] +
        this.a[2][2] * matr.a[2][3] +
        this.a[2][3] * matr.a[3][3],

      this.a[3][0] * matr.a[0][0] +
        this.a[3][1] * matr.a[1][0] +
        this.a[3][2] * matr.a[2][0] +
        this.a[3][3] * matr.a[3][0],
      this.a[3][0] * matr.a[0][1] +
        this.a[3][1] * matr.a[1][1] +
        this.a[3][2] * matr.a[2][1] +
        this.a[3][3] * matr.a[3][1],
      this.a[3][0] * matr.a[0][2] +
        this.a[3][1] * matr.a[1][2] +
        this.a[3][2] * matr.a[2][2] +
        this.a[3][3] * matr.a[3][2],
      this.a[3][0] * matr.a[0][3] +
        this.a[3][1] * matr.a[1][3] +
        this.a[3][2] * matr.a[2][3] +
        this.a[3][3] * matr.a[3][3],
    ]);
  }

  /* Simple functions */
  setTranslate(vec: _vec3) {
    this.a = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [vec.x, vec.y, vec.z, 1],
    ];
    return this;
  }
  translate(vec: _vec3) {
    return this.mul(new _mat4().setTranslate(vec));
  }
  setScale(vec: _vec3) {
    this.a = [
      [vec.x, 0, 0, 0],
      [0, vec.y, 0, 0],
      [0, 0, vec.z, 0],
      [0, 0, 0, 1],
    ];
    return this;
  }
  scale(vec: _vec3) {
    return this.mul(new _mat4().setScale(vec));
  }
  setRotate(angle: number, vec: _vec3) {
    const a = Degree2Radian(angle),
      sin = Math.sin(a),
      cos = Math.cos(a),
      n = vec.normalize();

    this.a = [
      [
        cos + n.x * n.x * (1 - cos),
        n.x * n.y * (1 - cos) + n.z * sin,
        n.x * n.z * (1 - cos) - n.y * sin,
        0,
      ],
      [
        n.y * n.x * (1 - cos) - n.z * sin,
        cos + n.y * n.y * (1 - cos),
        n.y * n.z * (1 - cos) + n.x * sin,
        0,
      ],
      [
        n.z * n.x * (1 - cos) + n.y * sin,
        n.z * n.y * (1 - cos) - n.x * sin,
        cos + n.z * n.z * (1 - cos),
        0,
      ],
      [0, 0, 0, 1],
    ];
    return this;
  }
  rotate(angle: number, vec: _vec3) {
    return this.mul(new _mat4().setRotate(angle, vec));
  }
  transpose() {
    let nm = new _mat4();

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        nm.a[i][j] = this.a[j][i];
      }
    }
    return nm;
  }

  /* Determinant 3x3 */
  determ3x3(arr: number[]) {
    return (
      arr[0] * arr[4] * arr[8] -
      arr[0] * arr[5] * arr[7] -
      arr[1] * arr[3] * arr[8] +
      arr[1] * arr[5] * arr[6] +
      arr[2] * arr[3] * arr[7] -
      arr[2] * arr[4] * arr[6]
    );
  }
  determ() {
    let det =
      this.a[0][0] *
        this.determ3x3([
          this.a[1][1],
          this.a[1][2],
          this.a[1][3],
          this.a[2][1],
          this.a[2][2],
          this.a[2][3],
          this.a[3][1],
          this.a[3][2],
          this.a[3][3],
        ]) -
      this.a[0][1] *
        this.determ3x3([
          this.a[1][0],
          this.a[1][2],
          this.a[1][3],
          this.a[2][0],
          this.a[2][2],
          this.a[2][3],
          this.a[3][0],
          this.a[3][2],
          this.a[3][3],
        ]) +
      this.a[0][2] *
        this.determ3x3([
          this.a[1][0],
          this.a[1][1],
          this.a[1][3],
          this.a[2][0],
          this.a[2][1],
          this.a[2][3],
          this.a[3][0],
          this.a[3][1],
          this.a[3][3],
        ]) -
      this.a[0][3] *
        this.determ3x3([
          this.a[1][0],
          this.a[1][1],
          this.a[1][2],
          this.a[2][0],
          this.a[2][1],
          this.a[2][2],
          this.a[3][0],
          this.a[3][1],
          this.a[3][2],
        ]);
    return det;
  }

  /* Matrix addons */
  inverse() {
    let det = this.determ();
    if (det == 0) {
      return new _mat4();
    }

    let r = new _mat4();

    /* Build adjoint matrix */
    r.a[0][0] =
      this.determ3x3([
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[1][0] =
      -this.determ3x3([
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[2][0] =
      this.determ3x3([
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3],
      ]) / det;
    r.a[3][0] =
      -this.determ3x3([
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2],
      ]) / det;

    r.a[0][1] =
      -this.determ3x3([
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[1][1] =
      this.determ3x3([
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[2][1] =
      -this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3],
      ]) / det;
    r.a[3][1] =
      this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2],
      ]) / det;

    r.a[0][2] =
      this.determ3x3([
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[1][2] =
      -this.determ3x3([
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3],
      ]) / det;
    r.a[2][2] =
      this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3],
      ]) / det;
    r.a[3][2] =
      -this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2],
      ]) / det;

    r.a[0][3] =
      -this.determ3x3([
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
      ]) / det;
    r.a[1][3] =
      this.determ3x3([
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
      ]) / det;
    r.a[2][3] =
      -this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
      ]) / det;
    r.a[3][3] =
      this.determ3x3([
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
      ]) / det;

    return r;
  }
  setIdentity() {
    this.a = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  /* World-view matrixes */
  setView(loc: _vec3, at: _vec3, up: _vec3) {
    const Dir = at.sub(loc).normalize(),
      Right = Dir.cross(up).normalize(),
      Up = Right.cross(Dir).normalize();
    this.a = [
      [Right.x, Up.x, -Dir.x, 0],
      [Right.y, Up.y, -Dir.y, 0],
      [Right.z, Up.z, -Dir.z, 0],
      [-loc.dot(Right), -loc.dot(Up), loc.dot(Dir), 1],
    ];
    return this;
  }
  view(Loc: _vec3, At: _vec3, Up1: _vec3) {
    return this.mul(new _mat4().setView(Loc, At, Up1));
  }
  setOrtho(
    Left: number,
    Right: number,
    Bottom: number,
    Top: number,
    Near: number,
    Far: number
  ) {
    this.a = [
      [2 / (Right - Left), 0, 0, 0],
      [0, 2 / (Top - Bottom), 0, 0],
      [0, 0, -2 / (Far - Near), 0],
      [
        -(Right + Left) / (Right - Left),
        -(Top + Bottom) / (Top - Bottom),
        -(Far + Near) / (Far - Near),
        1,
      ],
    ];
    return this;
  }
  ortho(
    Left: number,
    Right: number,
    Bottom: number,
    Top: number,
    Near: number,
    Far: number
  ) {
    return this.mul(new _mat4().setOrtho(Left, Right, Bottom, Top, Near, Far));
  }
  setFrustum(
    Left: number,
    Right: number,
    Bottom: number,
    Top: number,
    Near: number,
    Far: number
  ) {
    this.a = [
      [(2 * Near) / (Right - Left), 0, 0, 0],
      [0, (2 * Near) / (Top - Bottom), 0, 0],
      [
        (Right + Left) / (Right - Left),
        (Top + Bottom) / (Top - Bottom),
        -(Far + Near) / (Far - Near),
        -1,
      ],
      [0, 0, (-2 * Near * Far) / (Far - Near), 0],
    ];
    return this;
  }
  frustum(
    Left: number,
    Right: number,
    Bottom: number,
    Top: number,
    Near: number,
    Far: number
  ) {
    return this.mul(
      new _mat4().setFrustum(Left, Right, Bottom, Top, Near, Far)
    );
  }

  /* Transform functions */
  transform(vec: _vec3) {
    const w =
      vec.x * this.a[0][3] +
      vec.y * this.a[1][3] +
      vec.z * this.a[2][3] +
      this.a[3][3];
    return new _vec3([
      vec.x * this.a[0][0] +
        vec.y * this.a[1][0] +
        vec.z * this.a[2][0] +
        this.a[3][0] / w,
      vec.x * this.a[0][1] +
        vec.y * this.a[1][1] +
        vec.z * this.a[2][1] +
        this.a[3][1] / w,
      vec.x * this.a[0][2] +
        vec.y * this.a[1][2] +
        vec.z * this.a[2][2] +
        this.a[3][2] / w,
    ]);
  }
  transformVector(vec: _vec3) {
    return new _vec3([
      vec.x * this.a[0][0] + vec.y * this.a[1][0] + vec.z * this.a[2][0],
      vec.x * this.a[0][1] + vec.y * this.a[1][1] + vec.z * this.a[2][1],
      vec.x * this.a[0][2] + vec.y * this.a[1][2] + vec.z * this.a[2][2],
    ]);
  }
  transformPoint(vec: _vec3) {
    return new _vec3([
      vec.x * this.a[0][0] +
        vec.y * this.a[1][0] +
        vec.z * this.a[2][0] +
        this.a[3][0],
      vec.x * this.a[0][1] +
        vec.y * this.a[1][1] +
        vec.z * this.a[2][1] +
        this.a[3][1],
      vec.x * this.a[0][2] +
        vec.y * this.a[1][2] +
        vec.z * this.a[2][2] +
        this.a[3][2],
    ]);
  }
}

/* END OF 'matr4.js' FILE */

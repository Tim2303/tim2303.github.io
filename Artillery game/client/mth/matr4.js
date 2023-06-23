/* FILE NAME: matr4.js
 * PROGRAMMER: AG2
 * LAST UPDATE: 06.06.2023
 * PURPOSE: 3D math matrix implementation module.
 */

import { vec3 } from "./vec3.js";
export { vec3 };

/***
 * Useful constants and functions
 ***/

/* PI math constant */
const PI = 3.14159265358979323846;

/* Degrees to radians conversion */
const Degree2Radian = (alpha) => {
  return alpha * (PI / 180.0);
};
/* Radians to degrees conversion */
const Radian2Degree = (alpha) => {
  return alpha * (180.0 / PI);
};

/* Sinus math operation (in radians) */
const sin = (alpha) => {
  return Math.sin(alpha);
};
/* Cosinus math operation (in radians) */
const cos = (alpha) => {
  return Math.cos(alpha);
};

/***
 * Matrix module
 ***/

/* Matrix representation type */
class _mat4 {
  addMethod(obj, name, func) {
    var old = obj[name];

    obj[name] = (...args) => {
      if (func.length == args.length) {
        return func.apply(obj, args);
      } else if (typeof old == "function") {
        return old.apply(obj, args);
      }
    };
  }

  constructor(a = null) {
    if (a == null) {
      this.a = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];
    } else if (typeof a == "object" && a.length == 4) {
      this.a = a;
    } else {
      this.a = a.a;
    }
    this.addMethod(this, "setTranslate", (dx, dy, dz) => {
      this.a = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [dx, dy, dz, 1],
      ];
      return this;
    });
    this.addMethod(this, "setTranslate", (v) => {
      return this.setTranslate(v.x, v.y, v.z);
    });
    this.addMethod(this, "translate", (dx, dy, dz) => {
      this.mul([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [dx, dy, dz, 1],
      ]);
      return this;
    });
    this.addMethod(this, "translate", (v) => {
      return this.translate(v.x, v.y, v.z);
    });

    /* Scale functions */
    this.addMethod(this, "setScale", (sx, sy, sz) => {
      this.m = [
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1],
      ];
      return this;
    });
    this.addMethod(this, "setScale", (v) => {
      if (typeof v == "object") {
        return this.setScale(v.x, v.y, v.z);
      }
      return this.setScale(v, v, v);
    });
    this.addMethod(this, "scale", (sx, sy, sz) => {
      this.mul([
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1],
      ]);
      return this;
    });
    this.addMethod(this, "scale", (v) => {
      if (typeof v == "object") {
        return this.scale(v.x, v.y, v.z);
      }
      return this.scale(v, v, v);
    });
  } // End of 'constructor' function

  setRotate(AngleInDegree, R) {
    let a = AngleInDegree * Math.PI,
      sine = Math.sin(a),
      cosine = Math.cos(a);
    let x = 0,
      y = 0,
      z = 1;
    if (typeof R == "object") {
      if (R.length == 3) {
        x = R[0];
        y = R[1];
        z = R[2];
      } else {
        x = R.x;
        y = R.y;
        z = R.z;
      }
    }
    // Vector normalize
    let len = x * x + y * y + z * z;
    if (len != 0 && len != 1) {
      len = Math.sqrt(len);
      x /= len;
      y /= len;
      z /= len;
    }
    this.a[0][0] = cosine + x * x * (1 - cosine);
    this.a[0][1] = x * y * (1 - cosine) + z * sine;
    this.a[0][2] = x * z * (1 - cosine) - y * sine;
    this.a[0][3] = 0;
    this.a[1][0] = y * x * (1 - cosine) - z * sine;
    this.a[1][1] = cosine + y * y * (1 - cosine);
    this.a[1][2] = y * z * (1 - cosine) + x * sine;
    this.a[1][3] = 0;
    this.a[2][0] = z * x * (1 - cosine) + y * sine;
    this.a[2][1] = z * y * (1 - cosine) - x * sine;
    this.a[2][2] = cosine + z * z * (1 - cosine);
    this.a[2][3] = 0;
    this.a[3][0] = 0;
    this.a[3][1] = 0;
    this.a[3][2] = 0;
    this.a[3][3] = 1;
    return this;
  }

  rotate(AngleInDegree, R) {
    return this.mul(mat4().setRotate(AngleInDegree, R));
  }

  transpose() {
    let r = [[], [], [], []];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[i][j] = this.a[j][i];
      }
    }
    return mat4(r);
  }

  mul(a) {
    let matr;
    if (a.length == 4) {
      matr = a;
    } else {
      matr = a.a;
    }
    this.a = [
      [
        this.a[0][0] * matr[0][0] +
          this.a[0][1] * matr[1][0] +
          this.a[0][2] * matr[2][0] +
          this.a[0][3] * matr[3][0],
        this.a[0][0] * matr[0][1] +
          this.a[0][1] * matr[1][1] +
          this.a[0][2] * matr[2][1] +
          this.a[0][3] * matr[3][1],
        this.a[0][0] * matr[0][2] +
          this.a[0][1] * matr[1][2] +
          this.a[0][2] * matr[2][2] +
          this.a[0][3] * matr[3][2],
        this.a[0][0] * matr[0][3] +
          this.a[0][1] * matr[1][3] +
          this.a[0][2] * matr[2][3] +
          this.a[0][3] * matr[3][3],
      ],
      [
        this.a[1][0] * matr[0][0] +
          this.a[1][1] * matr[1][0] +
          this.a[1][2] * matr[2][0] +
          this.a[1][3] * matr[3][0],
        this.a[1][0] * matr[0][1] +
          this.a[1][1] * matr[1][1] +
          this.a[1][2] * matr[2][1] +
          this.a[1][3] * matr[3][1],
        this.a[1][0] * matr[0][2] +
          this.a[1][1] * matr[1][2] +
          this.a[1][2] * matr[2][2] +
          this.a[1][3] * matr[3][2],
        this.a[1][0] * matr[0][3] +
          this.a[1][1] * matr[1][3] +
          this.a[1][2] * matr[2][3] +
          this.a[1][3] * matr[3][3],
      ],
      [
        this.a[2][0] * matr[0][0] +
          this.a[2][1] * matr[1][0] +
          this.a[2][2] * matr[2][0] +
          this.a[2][3] * matr[3][0],
        this.a[2][0] * matr[0][1] +
          this.a[2][1] * matr[1][1] +
          this.a[2][2] * matr[2][1] +
          this.a[2][3] * matr[3][1],
        this.a[2][0] * matr[0][2] +
          this.a[2][1] * matr[1][2] +
          this.a[2][2] * matr[2][2] +
          this.a[2][3] * matr[3][2],
        this.a[2][0] * matr[0][3] +
          this.a[2][1] * matr[1][3] +
          this.a[2][2] * matr[2][3] +
          this.a[2][3] * matr[3][3],
      ],
      [
        this.a[3][0] * matr[0][0] +
          this.a[3][1] * matr[1][0] +
          this.a[3][2] * matr[2][0] +
          this.a[3][3] * matr[3][0],
        this.a[3][0] * matr[0][1] +
          this.a[3][1] * matr[1][1] +
          this.a[3][2] * matr[2][1] +
          this.a[3][3] * matr[3][1],
        this.a[3][0] * matr[0][2] +
          this.a[3][1] * matr[1][2] +
          this.a[3][2] * matr[2][2] +
          this.a[3][3] * matr[3][2],
        this.a[3][0] * matr[0][3] +
          this.a[3][1] * matr[1][3] +
          this.a[3][2] * matr[2][3] +
          this.a[3][3] * matr[3][3],
      ],
    ];
    return this;
  }

  determ3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33) {
    return (
      A11 * A22 * A33 -
      A11 * A23 * A32 -
      A12 * A21 * A33 +
      A12 * A23 * A31 +
      A13 * A21 * A32 -
      A13 * A22 * A31
    );
  }

  determ() {
    let det =
      this.a[0][0] *
        this.determ3x3(
          this.a[1][1],
          this.a[1][2],
          this.a[1][3],
          this.a[2][1],
          this.a[2][2],
          this.a[2][3],
          this.a[3][1],
          this.a[3][2],
          this.a[3][3]
        ) -
      this.a[0][1] *
        this.determ3x3(
          this.a[1][0],
          this.a[1][2],
          this.a[1][3],
          this.a[2][0],
          this.a[2][2],
          this.a[2][3],
          this.a[3][0],
          this.a[3][2],
          this.a[3][3]
        ) +
      this.a[0][2] *
        this.determ3x3(
          this.a[1][0],
          this.a[1][1],
          this.a[1][3],
          this.a[2][0],
          this.a[2][1],
          this.a[2][3],
          this.a[3][0],
          this.a[3][1],
          this.a[3][3]
        ) -
      this.a[0][3] *
        this.determ3x3(
          this.a[1][0],
          this.a[1][1],
          this.a[1][2],
          this.a[2][0],
          this.a[2][1],
          this.a[2][2],
          this.a[3][0],
          this.a[3][1],
          this.a[3][2]
        );

    return det;
  }

  inverse() {
    let r = [[], [], [], []];
    let det = this.determ();

    if (det == 0) {
      let a = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ];

      return mat4(a);
    }

    /* Build adjoint matrix */
    r[0][0] =
      this.determ3x3(
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[1][0] =
      -this.determ3x3(
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[2][0] =
      this.determ3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;
    r[3][0] =
      -this.determ3x3(
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r[0][1] =
      -this.determ3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[1][1] =
      this.determ3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[2][1] =
      -this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;
    r[3][1] =
      this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r[0][2] =
      this.determ3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[3][1],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[1][2] =
      -this.determ3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[3][0],
        this.a[3][2],
        this.a[3][3]
      ) / det;
    r[2][2] =
      this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[3][0],
        this.a[3][1],
        this.a[3][3]
      ) / det;
    r[3][2] =
      -this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[3][0],
        this.a[3][1],
        this.a[3][2]
      ) / det;

    r[0][3] =
      -this.determ3x3(
        this.a[0][1],
        this.a[0][2],
        this.a[0][3],
        this.a[1][1],
        this.a[1][2],
        this.a[1][3],
        this.a[2][1],
        this.a[2][2],
        this.a[2][3]
      ) / det;

    r[1][3] =
      this.determ3x3(
        this.a[0][0],
        this.a[0][2],
        this.a[0][3],
        this.a[1][0],
        this.a[1][2],
        this.a[1][3],
        this.a[2][0],
        this.a[2][2],
        this.a[2][3]
      ) / det;
    r[2][3] =
      -this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][3],
        this.a[1][0],
        this.a[1][1],
        this.a[1][3],
        this.a[2][0],
        this.a[2][1],
        this.a[2][3]
      ) / det;
    r[3][3] =
      this.determ3x3(
        this.a[0][0],
        this.a[0][1],
        this.a[0][2],
        this.a[1][0],
        this.a[1][1],
        this.a[1][2],
        this.a[2][0],
        this.a[2][1],
        this.a[2][2]
      ) / det;
    this.m = r;
    return this;
  }

  setIdentity() {
    this.a = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    return this;
  }

  setView(Loc, At, Up1) {
    let Dir = At.sub(Loc).normalize(),
      Right = Dir.cross(Up1).normalize(),
      Up = Right.cross(Dir).normalize();
    this.a = [
      [Right.x, Up.x, -Dir.x, 0],
      [Right.y, Up.y, -Dir.y, 0],
      [Right.z, Up.z, -Dir.z, 0],
      [-Loc.dot(Right), -Loc.dot(Up), Loc.dot(Dir), 1],
    ];
    return this;
  }

  setOrtho(Left, Right, Bottom, Top, Near, Far) {
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

  setFrustum(Left, Right, Bottom, Top, Near, Far) {
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

  view(Loc, At, Up1) {
    return this.mul(mat4().setView(Loc, At, Up1));
  }

  ortho(Left, Right, Bottom, Top, Near, Far) {
    return this.mul(mat4().setOrtho(Left, Right, Bottom, Top, Near, Far));
  }

  frustum(Left, Right, Bottom, Top, Near, Far) {
    return this.mul(mat4().setFrustum(Left, Right, Bottom, Top, Near, Far));
  }

  transform(V) {
    let w =
      V.x * this.m[0][3] +
      V.y * this.m[1][3] +
      V.z * this.m[2][3] +
      this.m[3][3];

    return vec3(
      (V.x * this.m[0][0] +
        V.y * this.m[1][0] +
        V.z * this.m[2][0] +
        this.m[3][0]) /
        w,
      (V.x * this.m[0][1] +
        V.y * this.m[1][1] +
        V.z * this.m[2][1] +
        this.m[3][1]) /
        w,
      (V.x * this.m[0][2] +
        V.y * this.m[1][2] +
        V.z * this.m[2][2] +
        this.m[3][2]) /
        w
    );
  }

  transformVector(V) {
    return vec3(
      V.x * this.a[0][0] + V.y * this.a[1][0] + V.z * this.a[2][0],
      V.x * this.a[0][1] + V.y * this.a[1][1] + V.z * this.a[2][1],
      V.x * this.a[0][2] + V.y * this.a[1][2] + V.z * this.a[2][2]
    );
  }

  transformPoint(V) {
    return vec3(
      V.x * this.a[0][0] +
        V.y * this.a[1][0] +
        V.z * this.a[2][0] +
        this.a[3][0],
      V.x * this.a[0][1] +
        V.y * this.a[1][1] +
        V.z * this.a[2][1] +
        this.a[3][1],
      V.x * this.a[0][2] +
        V.y * this.a[1][2] +
        V.z * this.a[2][2] +
        this.a[3][2]
    );
  }

  toArray() {
    return [].concat(...this.a);
  } // End of 'toArray' function
}

export function mat4(...args) {
  return new _mat4(...args);
}

// Multiply two matrixes function
export function MatrMulMatr2(m1, m2) {
  return mat4(m1).mul(m2);
}

/* END OF 'matr4.js' FILE */

/* FILE NAME: vec3.js
 * PROGRAMMER: AG2
 * LAST UPDATE: 03.06.2023
 * PURPOSE: 3D math vector implementation module.
 */

/***
 * Vector with 3 components module
 ***/

/* Vector/point representation type */
class _vec3 {
  constructor(x, y, z) {
    if (x == undefined) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    } else if (typeof x == "object") {
      if (x.length == 3) {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2];
      } else {
        this.x = x.x;
        this.y = x.y;
        this.z = x.z;
      }
    } else {
      if (y == undefined && z == undefined) {
        this.x = x;
        this.y = x;
        this.z = x;
      } else {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    }
  }

  /* Set vector function */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  /* Add two vectors function */
  add(vec) {
    return vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
  }
  /* Sub two vectors function */
  sub(vec) {
    return vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
  }
  /* Multiplu vector by a number function */
  mulNum(n) {
    return vec3(this.x * n, this.y * n, this.z * n);
  }
  /* Divise vector by a number function */
  divNum(n) {
    return vec3(this.x / n, this.y / n, this.z / n);
  }
  /* Negative vector function */
  negative() {
    return vec3(-this.x, -this.y, -this.z);
  }
  /* Dot productof vectors function */
  dot(vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }
  /* Cross product of vectors function */
  cross(vec) {
    return vec3(
      this.y * vec.z - this.z * vec.y,
      -(this.x * vec.z - this.z * vec.x),
      this.x * vec.y - this.y * vec.x
    );
  }
  /* Count lenght of vector function */
  len() {
    let length = this.dot(this);

    if (length == 1 || length == 0) {
      return length;
    }
    return Math.sqrt(length);
  }
  /* Normalize vector function */
  normalize() {
    let length = this.dot(this);

    if (length == 1 || length == 0) {
      return vec3(this);
    }
    length = Math.sqrt(length);
    return vec3(this.x / length, this.y / length, this.z / length);
  }
  /* Transform point of vector function */
  transform(mat) {
    return vec3(
      this.x * mat.a[0][0] +
        this.y * mat.a[1][0] +
        this.z * mat.a[2][0] +
        mat.a[3][0],
      this.x * mat.a[0][1] +
        this.y * mat.a[1][1] +
        this.z * mat.a[2][1] +
        mat.a[3][1],
      this.x * mat.a[0][2] +
        this.y * mat.a[1][2] +
        this.z * mat.a[2][2] +
        mat[3][3]
    );
  }
  /* Transform vector function */
  transform(mat) {
    return vec3(
      this.x * mat.a[0][0] + this.y * mat.a[1][0] + this.z * mat.a[2][0],
      this.x * mat.a[0][1] + this.y * mat.a[1][1] + this.z * mat.a[2][1],
      this.x * mat.a[0][2] + this.y * mat.a[1][2] + this.z * mat.a[2][2]
    );
  }
  /* Vector by matrix multiplication (with homogenious devide) function */
  vecMulMatr(mat) {
    let w =
      this.x * mat.a[0][3] +
      this.y * mat.a[1][3] +
      this.z * mat.a[2][3] +
      mat.a[3][3];

    return vec3(
      (this.x * mat.a[0][0] +
        this.y * mat.a[1][0] +
        this.z * mat.a[2][0] +
        mat.a[3][0]) /
        w,
      (this.x * mat.a[0][1] +
        this.y * mat.a[1][1] +
        this.z * mat.a[2][1] +
        mat.a[3][1]) /
        w,
      (this.x * mat.a[0][2] +
        this.y * mat.a[1][2] +
        this.z * mat.a[2][2] +
        mat.a[3][2]) /
        w
    );
  }
  /* Reset vector to array functions */
  toArray() {
    return [this.x, this.y, this.z];
  }
}

export function vec3(...args) {
  return new _vec3(...args);
}
/*
let v1 = new vec3(0, 0, 0);
let v2 = new vec3(5, 6, 7);
let v3 = new vec3(8, 9, 10);
let v4 = new vec3(11, 12, 13);
let v5 = new vec3(14, 15, 16);
let v6 = new vec3(17, 18, 19);

console.log(v1.dot(v2));
console.log(v1.sub(v2));
console.log(v6.negative());
console.log(v1.divNum(2));
console.log(v1.len());
console.log(v3.normalize());
*/

/* END OF 'vec3.js' FILE */

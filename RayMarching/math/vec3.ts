/* 3D vector implementation */
export class _vec3 {
  x: number;
  y: number;
  z: number;

  constructor(arr: number[] | void) {
    if (arr == undefined || arr.length != 3) {
      (this.x = 0), (this.y = 0), (this.z = 0);
    } else {
      (this.x = arr[0]), (this.y = arr[1]), (this.z = arr[2]);
    }
  }

  /* Simple functions */
  set(a: number, b: number, c: number) {
    (this.x = a), (this.y = b), (this.z = c);
  }
  add(b: _vec3) {
    return new _vec3([this.x + b.x, this.y + b.y, this.z + b.z]);
  }
  addEq(b: _vec3) {
    (this.x += b.x), (this.y += b.y), (this.z += b.z);
    return this;
  }
  sub(b: _vec3) {
    return new _vec3([this.x - b.x, this.y - b.y, this.z - b.z]);
  }
  mulNum(n: number) {
    return new _vec3([this.x * n, this.y * n, this.z * n]);
  }
  divNum(n: number) {
    return new _vec3([this.x / n, this.y / n, this.z / n]);
  }
  negative() {
    return new _vec3([-this.x, -this.y, -this.z]);
  }
  dot(b: _vec3) {
    return this.x * b.x + this.y * b.y + this.z * b.z;
  }
  cross(b: _vec3) {
    return new _vec3([
      this.y * b.z - this.z * b.y,
      -(this.x * b.z - this.z * b.x),
      this.x * b.y - this.y * b.x,
    ]);
  }
  len() {
    const length = this.dot(this);
    if (length == 1 || length == 0) {
      return length;
    }
    return Math.sqrt(length);
  }
  normalize() {
    let length = this.dot(this);
    if (length == 1 || length == 0) {
      return this;
    }
    length = Math.sqrt(length);
    return new _vec3([this.x / length, this.y / length, this.z / length]);
  }

  /* Make array */
  toArray() {
    return [this.x, this.y, this.z];
  }
}

/* END OF 'vec3.ts' FILE */

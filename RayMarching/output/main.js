var XXX = (function (exports) {
    'use strict';

    /* 3D vector implementation */
    class _vec3 {
        x;
        y;
        z;
        constructor(arr) {
            if (arr == undefined || arr.length != 3) {
                (this.x = 0), (this.y = 0), (this.z = 0);
            }
            else {
                (this.x = arr[0]), (this.y = arr[1]), (this.z = arr[2]);
            }
        }
        /* Simple functions */
        set(a, b, c) {
            (this.x = a), (this.y = b), (this.z = c);
        }
        add(b) {
            return new _vec3([this.x + b.x, this.y + b.y, this.z + b.z]);
        }
        addEq(b) {
            (this.x += b.x), (this.y += b.y), (this.z += b.z);
            return this;
        }
        sub(b) {
            return new _vec3([this.x - b.x, this.y - b.y, this.z - b.z]);
        }
        mulNum(n) {
            return new _vec3([this.x * n, this.y * n, this.z * n]);
        }
        divNum(n) {
            return new _vec3([this.x / n, this.y / n, this.z / n]);
        }
        negative() {
            return new _vec3([-this.x, -this.y, -this.z]);
        }
        dot(b) {
            return this.x * b.x + this.y * b.y + this.z * b.z;
        }
        cross(b) {
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

    /* Matrix 4x4 implementation */
    /* PI math constant */
    const PI = 3.14159265358979323846;
    /* Degrees to radians conversion */
    const Degree2Radian = (alpha) => {
        return alpha * (PI / 180.0);
    };
    class _mat4 {
        a = [];
        constructor(arr) {
            if (arr == null || arr.length != 16) {
                this.a = [
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1],
                ];
            }
            else {
                this.a = [
                    [arr[0], arr[1], arr[2], arr[3]],
                    [arr[4], arr[5], arr[6], arr[7]],
                    [arr[8], arr[9], arr[10], arr[11]],
                    [arr[12], arr[13], arr[14], arr[15]],
                ];
            }
        }
        /* Multiply function */
        mul(matr) {
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
        setTranslate(vec) {
            this.a = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [vec.x, vec.y, vec.z, 1],
            ];
            return this;
        }
        translate(vec) {
            return this.mul(new _mat4().setTranslate(vec));
        }
        setScale(vec) {
            this.a = [
                [vec.x, 0, 0, 0],
                [0, vec.y, 0, 0],
                [0, 0, vec.z, 0],
                [0, 0, 0, 1],
            ];
            return this;
        }
        scale(vec) {
            return this.mul(new _mat4().setScale(vec));
        }
        setRotate(angle, vec) {
            const a = Degree2Radian(angle), sin = Math.sin(a), cos = Math.cos(a), n = vec.normalize();
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
        rotate(angle, vec) {
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
        determ3x3(arr) {
            return (arr[0] * arr[4] * arr[8] -
                arr[0] * arr[5] * arr[7] -
                arr[1] * arr[3] * arr[8] +
                arr[1] * arr[5] * arr[6] +
                arr[2] * arr[3] * arr[7] -
                arr[2] * arr[4] * arr[6]);
        }
        determ() {
            let det = this.a[0][0] *
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
        setView(loc, at, up) {
            const Dir = at.sub(loc).normalize(), Right = Dir.cross(up).normalize(), Up = Right.cross(Dir).normalize();
            this.a = [
                [Right.x, Up.x, -Dir.x, 0],
                [Right.y, Up.y, -Dir.y, 0],
                [Right.z, Up.z, -Dir.z, 0],
                [-loc.dot(Right), -loc.dot(Up), loc.dot(Dir), 1],
            ];
            return this;
        }
        view(Loc, At, Up1) {
            return this.mul(new _mat4().setView(Loc, At, Up1));
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
        ortho(Left, Right, Bottom, Top, Near, Far) {
            return this.mul(new _mat4().setOrtho(Left, Right, Bottom, Top, Near, Far));
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
        frustum(Left, Right, Bottom, Top, Near, Far) {
            return this.mul(new _mat4().setFrustum(Left, Right, Bottom, Top, Near, Far));
        }
        /* Transform functions */
        transform(vec) {
            const w = vec.x * this.a[0][3] +
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
        transformVector(vec) {
            return new _vec3([
                vec.x * this.a[0][0] + vec.y * this.a[1][0] + vec.z * this.a[2][0],
                vec.x * this.a[0][1] + vec.y * this.a[1][1] + vec.z * this.a[2][1],
                vec.x * this.a[0][2] + vec.y * this.a[1][2] + vec.z * this.a[2][2],
            ]);
        }
        transformPoint(vec) {
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

    /* Camera implementation */
    class _camera {
        // Projection
        projSize;
        projDist;
        projFarClip;
        // Local size data
        frameW;
        frameH;
        // Matrices
        matrView;
        matrProj;
        matrVP;
        // Camera world parameters
        loc;
        at;
        dir;
        up;
        right;
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
        set(loc, at, up) {
            this.matrView.setView(loc, at, up);
            this.loc = loc;
            this.at = at;
            this.dir.set(-this.matrView.a[0][2], -this.matrView.a[1][2], -this.matrView.a[2][2]);
            this.up.set(this.matrView.a[0][1], this.matrView.a[1][1], this.matrView.a[2][1]);
            this.right.set(this.matrView.a[0][0], this.matrView.a[1][0], this.matrView.a[2][0]);
            this.matrVP = this.matrView.mul(this.matrProj);
        }
        setProj(projSize, projDist, projFarClip) {
            let rx = projSize, ry = projSize;
            this.projDist = projDist;
            this.projSize = projSize;
            this.projFarClip = projFarClip;
            // Correct aspect ratio
            if (this.frameW > this.frameH)
                rx *= this.frameW / this.frameH;
            else
                ry *= this.frameH / this.frameW;
            this.matrProj.setFrustum(-rx / 2.0, rx / 2.0, -ry / 2.0, ry / 2.0, projDist, projFarClip);
            this.matrVP = this.matrView.mul(this.matrProj);
        }
        setSize(frameW, frameH) {
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

    /* Timer implementation */
    class _timer {
        // Private
        startTime = 0;
        oldTime = 0;
        oldTimeFPS = 0;
        pauseTime = 0;
        frameCounter = 0;
        // Public
        isPause = false;
        FPS = 60;
        globalTime = 0;
        globalDeltaTime = 0;
        deltaTime = 0;
        averageDeltaTime = 0;
        time = 0;
        // Special
        tmpAvTime = 0;
        cnt = 0;
        Init() {
            this.startTime = this.oldTime = this.oldTimeFPS = new Date().getTime();
        }
        response() {
            const now = new Date().getTime();
            this.globalTime = (now - this.startTime) / 1000.0;
            this.globalDeltaTime = (now - this.oldTime) / 1000.0;
            if (this.isPause) {
                this.deltaTime = 0;
                this.pauseTime += (now - this.oldTime) / 1000.0;
            }
            else {
                this.deltaTime = this.globalDeltaTime;
                this.time = (now - this.pauseTime - this.startTime) / 1000.0;
            }
            this.frameCounter++;
            if (now - this.oldTimeFPS > 1000.0) {
                this.FPS = (this.frameCounter * 1000.0) / (now - this.oldTimeFPS);
                this.oldTimeFPS = now;
                this.frameCounter = 0;
            }
            this.oldTime = now;
            (this.tmpAvTime += this.globalDeltaTime), this.cnt++;
            if (this.cnt > 100) {
                this.averageDeltaTime = this.tmpAvTime / this.cnt;
                this.tmpAvTime = this.cnt = 0;
            }
        }
    }
    /* END OF 'timer.ts' FILE */

    /* Input module implementation */
    var VK;
    (function (VK) {
        VK[VK["LBUTTON"] = 0] = "LBUTTON";
        VK[VK["MBUTTON"] = 1] = "MBUTTON";
        VK[VK["RBUTTON"] = 2] = "RBUTTON";
        VK[VK["SHIFT"] = 16] = "SHIFT";
        VK[VK["CONTROL"] = 17] = "CONTROL";
        VK[VK["MENU"] = 18] = "MENU";
        VK[VK["ESCAPE"] = 27] = "ESCAPE";
        VK[VK["LEFT"] = 37] = "LEFT";
        VK[VK["UP"] = 38] = "UP";
        VK[VK["RIGHT"] = 39] = "RIGHT";
        VK[VK["DOWN"] = 40] = "DOWN";
        VK[VK["W"] = 87] = "W";
        VK[VK["A"] = 65] = "A";
        VK[VK["S"] = 83] = "S";
        VK[VK["D"] = 68] = "D";
        VK[VK["SPACE"] = 32] = "SPACE";
    })(VK || (VK = {}));
    class _input {
        mX = 0;
        mY = 0;
        mdX = 0;
        mdY = 0;
        mdZ = 0;
        keysOld = [];
        keys = [];
        keysClick = [];
        keysEvent = [];
        mXEvent = 0;
        mYEvent = 0;
        mdXEvent = 0;
        mdYEvent = 0;
        mdZEvent = 0;
        constructor() {
            this.mXEvent =
                this.mYEvent =
                    this.mdXEvent =
                        this.mdYEvent =
                            this.mdZEvent =
                                0;
            this.mX = this.mY = this.mdX = this.mdY = this.mdZ = 0;
            for (let i = 0; i < 256; i++)
                this.keysEvent[i] =
                    this.keysOld[i] =
                        this.keys[i] =
                            this.keysClick[i] =
                                false;
        }
        response() {
            this.mX = this.mXEvent;
            this.mY = this.mYEvent;
            this.mdX = this.mdXEvent;
            this.mdY = this.mdYEvent;
            this.mdZ = this.mdZEvent;
            for (let i = 0; i < 256; i++)
                this.keys[i] = this.keysEvent[i];
            for (let i = 0; i < 256; i++)
                this.keysClick[i] = this.keys[i] && !this.keysOld[i];
            for (let i = 0; i < 256; i++)
                this.keysOld[i] = this.keys[i];
            this.mdXEvent = this.mdYEvent = this.mdZEvent = 0;
        }
        onKeyDown = (e) => {
            this.keysEvent[e.keyCode] = true;
        };
        onKeyUp = (e) => {
            this.keysEvent[e.keyCode] = false;
        };
        onMouseDown = (e) => {
            this.keysEvent[e.button] = true;
        };
        onMouseUp = (e) => {
            this.keysEvent[e.button] = false;
        };
        onMouseMove = (e) => {
            this.mXEvent = e.x;
            this.mdXEvent += e.movementX;
            this.mYEvent = e.y;
            this.mdYEvent += e.movementY;
        };
        onMouseWheel = (e) => {
            this.mdZEvent -= e.deltaY;
        };
    }

    /* Shader manager implementation */
    class _shader {
        progID = 0;
        name = "NONE";
        constructor(str, id) {
            this.name = str;
            this.progID = id;
        }
    }
    class _shaderManager {
        shaders = [];
        shadersNum = 0;
        async Load(fileName, gl) {
            const shdsName = ["vert", "frag"];
            const shdsType = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
            let shdsID = [];
            for (let i = 0; i < shdsName.length; i++) {
                const buf = "../binary/shaders/" +
                    fileName +
                    "/" +
                    shdsName[i] +
                    ".glsl" +
                    "?nocache" +
                    new Date().getTime();
                const data = await (await fetch(buf)).text();
                let res = gl.createShader(shdsType[i]);
                if (!res)
                    return;
                shdsID[i] = res;
                gl.shaderSource(shdsID[i], data);
                gl.compileShader(shdsID[i]);
                if (!gl.getShaderParameter(shdsID[i], gl.COMPILE_STATUS)) {
                    console.log(buf + ":" + "\n" + gl.getShaderInfoLog(shdsID[i]));
                }
            }
            const program = gl.createProgram();
            if (!program)
                return;
            for (let i = 0; i < shdsName.length; i++)
                gl.attachShader(program, shdsID[i]);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log(gl.getProgramInfoLog(program));
            }
            this.shaders[this.shadersNum] = new _shader(fileName, program);
        }
        async add(fileName, gl) {
            for (let i = 0; i < this.shadersNum; i++)
                if (this.shaders[i].name == fileName)
                    return await i;
            await this.Load(fileName, gl);
            return await this.shadersNum++;
        }
        get(index) {
            if (index < 0 || index >= this.shadersNum) {
                return this.shaders[0];
            }
            else {
                return this.shaders[index];
            }
        }
    }

    let gl;
    let canvas;
    function setGL(document) {
        canvas = document.querySelector("#glcanvas");
        if (!canvas)
            return;
        gl = canvas.getContext("webgl2");
        return gl;
    }

    /* Buffers implementation */
    class _buffer {
        id = 0;
        type = 0;
        size = 0;
        constructor(type, size) {
            let res = gl.createBuffer();
            if (!res)
                return;
            (this.id = res), (this.size = size), (this.type = type);
            gl.bindBuffer(this.type, this.id);
            gl.bufferData(this.type, size, gl.STATIC_DRAW);
        }
        update(data, offset, size) {
            gl.bindBuffer(this.type, this.id);
            gl.bufferSubData(this.type, offset, data, 0, size);
        }
        apply(prg) {
            gl.bindBuffer(this.type, this.id);
        }
        free() {
            gl.deleteBuffer(this.id);
            this.id = 0;
            this.size = 0;
        }
    }
    class _vertBuffer extends _buffer {
        numOfVert = 0;
        constructor(vert, vertSize) {
            super(gl.ARRAY_BUFFER, vert.length);
            this.numOfVert = vert.length / vertSize;
            gl.bufferData(gl.ARRAY_BUFFER, vert, gl.STATIC_DRAW);
        }
        free() {
            super.free();
            this.numOfVert = 0;
        }
    }

    /* Render implementation */
    class _render {
        cam = new _camera();
        timer = new _timer();
        shdManager = new _shaderManager();
        mainShd = 0;
        vertexBuffer;
        // Temporary uniforms
        cameraLocGlobalTime = 0;
        projSizeDistFarDeltaTime = 0;
        cameraDirectionFrameW = 0;
        cameraUpFrameH = 0;
        cameraRightSmth = 0;
        async init() {
            gl.clearColor(0.3, 0.47, 0.8, 1.0);
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            this.cam.set(new _vec3([20, 10, 0]), new _vec3([0, 0, 0]), new _vec3([0, 1, 0]));
            this.timer.Init();
            this.mainShd = await this.shdManager.add("default", gl);
            let prg = this.shdManager.get(this.mainShd);
            this.vertexBuffer = new _vertBuffer(new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]), 2);
            this.cameraLocGlobalTime = gl.getUniformLocation(prg.progID, "CameraLocGlobalTime");
            this.projSizeDistFarDeltaTime = gl.getUniformLocation(prg.progID, "ProjSizeDistFarDeltaTime");
            this.cameraDirectionFrameW = gl.getUniformLocation(prg.progID, "CamDirFrameW");
            this.cameraUpFrameH = gl.getUniformLocation(prg.progID, "CamUpFrameH");
            this.cameraRightSmth = gl.getUniformLocation(prg.progID, "CamRightSmth");
        }
        frameStart() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.timer.response();
            this.setUniforms();
        }
        frameEnd() {
            let prg = this.shdManager.get(this.mainShd);
            this.setPositionAttribute(prg, this.vertexBuffer);
            gl.useProgram(prg.progID);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        setPositionAttribute(prg, buffer) {
            if (buffer === undefined)
                return;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.id);
            let loc = gl.getAttribLocation(prg.progID, "InPos");
            if (loc !== -1) {
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(loc);
            }
        }
        setUniforms() {
            // Camera location - global time
            const Cam = this.cam;
            if (this.cameraLocGlobalTime != null) {
                gl.uniform4f(this.cameraLocGlobalTime, Cam.loc.x, Cam.loc.y, Cam.loc.z, this.timer.globalTime);
            }
            // Projection size/dist/farclip - delta time
            if (this.projSizeDistFarDeltaTime != null) {
                gl.uniform4f(this.projSizeDistFarDeltaTime, Cam.projSize, Cam.projDist, Cam.projFarClip, this.timer.deltaTime);
            }
            // Camera direction - frame width
            if (this.cameraDirectionFrameW != null) {
                gl.uniform4f(this.cameraDirectionFrameW, Cam.dir.x, Cam.dir.y, Cam.dir.z, Cam.frameW);
            }
            // Camera up - frame height
            if (this.cameraUpFrameH != null) {
                gl.uniform4f(this.cameraUpFrameH, Cam.up.x, Cam.up.y, Cam.up.z, Cam.frameH);
            }
            // Camera right - smth
            if (this.cameraRightSmth != null) {
                gl.uniform4f(this.cameraRightSmth, Cam.right.x, Cam.right.y, Cam.right.z, 1);
            }
        }
    }

    /* Control implementation */
    const coeff = 7;
    const turbo = 150;
    const totalUp = new _vec3([0, 1, 0]);
    class _control {
        cameraChange(input, render) {
            const delta = render.timer.globalDeltaTime;
            const cam = render.cam;
            const smth = turbo * delta * Number(input.keys[VK.SHIFT]);
            const accel = smth == 0 ? 1 : smth;
            let x = cam.dir
                .normalize()
                .mulNum((Number(input.keys[VK.W]) - Number(input.keys[VK.S])) *
                delta *
                coeff *
                accel);
            let z = cam.right
                .normalize()
                .mulNum((Number(input.keys[VK.D]) - Number(input.keys[VK.A])) *
                delta *
                coeff *
                accel);
            let y = totalUp.mulNum((Number(input.keys[VK.SPACE]) - Number(input.keys[VK.CONTROL])) *
                delta *
                coeff *
                accel);
            const res = x.add(y).add(z);
            const newLoc = cam.loc.add(res);
            const angleY = -input.mdY * render.timer.globalDeltaTime * coeff;
            const angleX = -input.mdX * render.timer.globalDeltaTime * coeff;
            const matr = new _mat4().rotate(angleY, cam.right).rotate(angleX, totalUp);
            let newAt = cam.at.add(res);
            newAt = matr.transformVector(newAt.sub(newLoc)).add(newLoc);
            render.cam.set(newLoc, newAt, totalUp);
        }
    }

    /* Animation implementation */
    class _anim {
        renderContext = new _render();
        input = new _input();
        controller = new _control();
        isCursorHidden = false;
        async init() {
            await this.renderContext.init();
        }
        response() {
            this.input.response();
            if (this.isCursorHidden) {
                this.controller.cameraChange(this.input, this.renderContext);
            }
            if (this.input.keysClick[VK.LBUTTON]) {
                console.log(`You clicked in canvas!{${this.input.mX};${this.input.mY}}`);
            }
            if (this.input.keysClick[VK.LBUTTON] && !this.isCursorHidden) {
                if (!document.pointerLockElement) {
                    canvas.requestPointerLock();
                    this.isCursorHidden = true;
                }
            }
            if (this.input.keysClick[VK.ESCAPE] && this.isCursorHidden) {
                this.isCursorHidden = false;
            }
            const { width, height } = canvas.getBoundingClientRect();
            this.renderContext.cam.setSize(width, height);
            this.renderContext.frameStart();
            this.renderContext.frameEnd();
        }
    }

    /* Render */
    let anim = new _anim();
    /* Main program function */
    async function main() {
        if (setGL(document) === null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        await anim.init();
        /* Input callbacks */
        window.addEventListener("keydown", anim.input.onKeyDown);
        window.addEventListener("keyup", anim.input.onKeyUp);
        canvas.addEventListener("mousedown", anim.input.onMouseDown);
        canvas.addEventListener("mouseup", anim.input.onMouseUp);
        canvas.addEventListener("mousemove", anim.input.onMouseMove);
        canvas.addEventListener("wheel", anim.input.onMouseWheel);
        /**/
        const sliderEl = document.getElementById("range");
        const sliderValue = document.querySelector(".value");
        if (sliderEl !== null && sliderValue !== null) {
            sliderEl.addEventListener("input", (event = 0) => {
                let tempSliderValue;
                if (event.target !== null) {
                    tempSliderValue = event.target.value;
                }
                sliderValue.textContent = tempSliderValue;
                sliderEl.style.background = `linear-gradient(to right, #f50 ${tempSliderValue * 10}%, #ccc ${tempSliderValue}%)`;
                const frame = document.getElementById("glcanvas");
                if (frame !== null) {
                    frame.style.filter = `blur(${tempSliderValue}px)`;
                }
            });
        }
        const renderScene = () => {
            anim.response();
            window.requestAnimationFrame(renderScene);
        };
        renderScene();
    }
    /* Load listener - start render */
    window.addEventListener("load", () => {
        main();
    });

    exports.main = main;

    return exports;

})({});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbWF0aC92ZWMzLnRzIiwiLi4vbWF0aC9tYXRyNC50cyIsIi4uL21hdGgvY2FtZXJhLnRzIiwiLi4vbWF0aC90aW1lci50cyIsIi4uL21hdGgvaW5wdXQudHMiLCIuLi9yZW5kZXIvc2hhZGVyLnRzIiwiLi4vcmVuZGVyL2dsLnRzIiwiLi4vcmVuZGVyL2J1ZmZlci50cyIsIi4uL3JlbmRlci9yZW5kZXIudHMiLCIuLi9yZW5kZXIvY29udHJvbC50cyIsIi4uL3JlbmRlci9hbmltLnRzIiwiLi4vbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiR0wuY2FudmFzIiwibWFpbkdMLnNldEdMIiwibWFpbkdMLmNhbnZhcyJdLCJtYXBwaW5ncyI6Ijs7O0lBQUE7VUFDYSxLQUFLLENBQUE7SUFDaEIsSUFBQSxDQUFDLENBQVM7SUFDVixJQUFBLENBQUMsQ0FBUztJQUNWLElBQUEsQ0FBQyxDQUFTO0lBRVYsSUFBQSxXQUFBLENBQVksR0FBb0IsRUFBQTtZQUM5QixJQUFJLEdBQUcsSUFBSSxTQUFTLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUMxQztpQkFBTTtJQUNMLFlBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pEO1NBQ0Y7O0lBR0QsSUFBQSxHQUFHLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUE7WUFDakMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzFDO0lBQ0QsSUFBQSxHQUFHLENBQUMsQ0FBUSxFQUFBO0lBQ1YsUUFBQSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlEO0lBQ0QsSUFBQSxLQUFLLENBQUMsQ0FBUSxFQUFBO0lBQ1osUUFBQSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsUUFBQSxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0QsSUFBQSxHQUFHLENBQUMsQ0FBUSxFQUFBO0lBQ1YsUUFBQSxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlEO0lBQ0QsSUFBQSxNQUFNLENBQUMsQ0FBUyxFQUFBO1lBQ2QsT0FBTyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLFlBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTdCLFlBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLFlBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3QixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLFlBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFN0IsWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLFlBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlCLFNBQUEsQ0FBQyxDQUFDO1NBQ0o7O0lBR0QsSUFBQSxZQUFZLENBQUMsR0FBVSxFQUFBO1lBQ3JCLElBQUksQ0FBQyxDQUFDLEdBQUc7SUFDUCxZQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ1osWUFBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNaLFlBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDWixZQUFBLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3pCLENBQUM7SUFDRixRQUFBLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDRCxJQUFBLFNBQVMsQ0FBQyxHQUFVLEVBQUE7SUFDbEIsUUFBQSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNoRDtJQUNELElBQUEsUUFBUSxDQUFDLEdBQVUsRUFBQTtZQUNqQixJQUFJLENBQUMsQ0FBQyxHQUFHO2dCQUNQLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEIsWUFBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNiLENBQUM7SUFDRixRQUFBLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDRCxJQUFBLEtBQUssQ0FBQyxHQUFVLEVBQUE7SUFDZCxRQUFBLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsU0FBUyxDQUFDLEtBQWEsRUFBRSxHQUFVLEVBQUE7SUFDakMsUUFBQSxNQUFNLENBQUMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQzVCLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUNqQixHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDakIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUV0QixJQUFJLENBQUMsQ0FBQyxHQUFHO0lBQ1AsWUFBQTtJQUNFLGdCQUFBLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUMzQixnQkFBQSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztJQUNqQyxnQkFBQSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztvQkFDakMsQ0FBQztJQUNGLGFBQUE7SUFDRCxZQUFBO0lBQ0UsZ0JBQUEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUc7SUFDakMsZ0JBQUEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQzNCLGdCQUFBLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO29CQUNqQyxDQUFDO0lBQ0YsYUFBQTtJQUNELFlBQUE7SUFDRSxnQkFBQSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztJQUNqQyxnQkFBQSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztJQUNqQyxnQkFBQSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7b0JBQzNCLENBQUM7SUFDRixhQUFBO0lBQ0QsWUFBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNiLENBQUM7SUFDRixRQUFBLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLENBQUMsS0FBYSxFQUFFLEdBQVUsRUFBQTtJQUM5QixRQUFBLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNwRDtRQUNELFNBQVMsR0FBQTtJQUNQLFFBQUEsSUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUVyQixRQUFBLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUIsWUFBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFCLGdCQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDM0I7YUFDRjtJQUNELFFBQUEsT0FBTyxFQUFFLENBQUM7U0FDWDs7SUFHRCxJQUFBLFNBQVMsQ0FBQyxHQUFhLEVBQUE7SUFDckIsUUFBQSxRQUNFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4QixZQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4QixZQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4QixZQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4QixZQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4QixZQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUN4QjtTQUNIO1FBQ0QsTUFBTSxHQUFBO1lBQ0osSUFBSSxHQUFHLEdBQ0wsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNiLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDYixDQUFDO0lBQ0osWUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDVixJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ2Isb0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixvQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLG9CQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osb0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixvQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLG9CQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osb0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixvQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLG9CQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNiLENBQUM7SUFDSixZQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNWLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDYixvQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLG9CQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osb0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixvQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLG9CQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osb0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixvQkFBQSxJQUFJLENBQUMsQ0FB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SSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNiLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDYixDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ1gsUUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDZCxnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUVYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ2QsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNiLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDWCxRQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDYixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ2QsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNiLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDWCxRQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDYixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUVYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNiLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDYixDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ1gsUUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDZCxnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNiLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDYixDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ1gsUUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDZCxnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUVYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ2QsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNiLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDWCxRQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDYixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNYLFFBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ2QsZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNiLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDWCxRQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDYixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWixnQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNaLGdCQUFBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osZ0JBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUVYLFFB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

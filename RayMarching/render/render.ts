/* Render implementation */
import { _vec3, _mat4, _camera, _timer, VK } from "../math/math.js";
import { _shaderManager, _shader } from "./shader.js";
import { _buffer, _vertBuffer } from "./buffer.js";
import { gl } from "./gl.js";

export class _render {
  cam: _camera = new _camera();
  timer: _timer = new _timer();

  shdManager: _shaderManager = new _shaderManager();
  mainShd: number = 0;

  vertexBuffer: _buffer | undefined;

  // Temporary uniforms
  cameraLocGlobalTime: WebGLUniformLocation | null = 0;
  projSizeDistFarDeltaTime: WebGLUniformLocation | null = 0;
  cameraDirectionFrameW: WebGLUniformLocation | null = 0;
  cameraUpFrameH: WebGLUniformLocation | null = 0;
  cameraRightSmth: WebGLUniformLocation | null = 0;

  async init() {
    gl.clearColor(0.3, 0.47, 0.8, 1.0);
    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    this.cam.set(
      new _vec3([20, 10, 0]),
      new _vec3([0, 0, 0]),
      new _vec3([0, 1, 0])
    );

    this.timer.Init();
    this.mainShd = await this.shdManager.add("default", gl);
    let prg = this.shdManager.get(this.mainShd);

    this.vertexBuffer = new _vertBuffer(
      new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]),
      2
    );

    this.cameraLocGlobalTime = gl.getUniformLocation(
      prg.progID,
      "CameraLocGlobalTime"
    );
    this.projSizeDistFarDeltaTime = gl.getUniformLocation(
      prg.progID,
      "ProjSizeDistFarDeltaTime"
    );
    this.cameraDirectionFrameW = gl.getUniformLocation(
      prg.progID,
      "CamDirFrameW"
    );
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

  setPositionAttribute(prg: _shader, buffer: _buffer | undefined) {
    if (buffer === undefined) return;
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
      gl.uniform4f(
        this.cameraLocGlobalTime,
        Cam.loc.x,
        Cam.loc.y,
        Cam.loc.z,
        this.timer.globalTime
      );
    }
    // Projection size/dist/farclip - delta time
    if (this.projSizeDistFarDeltaTime != null) {
      gl.uniform4f(
        this.projSizeDistFarDeltaTime,
        Cam.projSize,
        Cam.projDist,
        Cam.projFarClip,
        this.timer.deltaTime
      );
    }
    // Camera direction - frame width
    if (this.cameraDirectionFrameW != null) {
      gl.uniform4f(
        this.cameraDirectionFrameW,
        Cam.dir.x,
        Cam.dir.y,
        Cam.dir.z,
        Cam.frameW
      );
    }
    // Camera up - frame height
    if (this.cameraUpFrameH != null) {
      gl.uniform4f(
        this.cameraUpFrameH,
        Cam.up.x,
        Cam.up.y,
        Cam.up.z,
        Cam.frameH
      );
    }
    // Camera right - smth
    if (this.cameraRightSmth != null) {
      gl.uniform4f(
        this.cameraRightSmth,
        Cam.right.x,
        Cam.right.y,
        Cam.right.z,
        1
      );
    }
  }
}

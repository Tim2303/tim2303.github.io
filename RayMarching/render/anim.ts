/* Animation implementation */
import { _render } from "./render";
import { _input, _timer, VK } from "../math/math.js";
import { _vec3 } from "../math/math.js";
import { _control } from "./control";
import * as GL from "./gl.js";

export class _anim {
  renderContext: _render = new _render();
  input: _input = new _input();
  controller: _control = new _control();

  isCursorHidden: boolean = false;

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
        GL.canvas.requestPointerLock();
        this.isCursorHidden = true;
      }
    }
    if (this.input.keysClick[VK.ESCAPE] && this.isCursorHidden) {
      this.isCursorHidden = false;
    }

    const { width, height } = GL.canvas.getBoundingClientRect();
    this.renderContext.cam.setSize(width, height);

    this.renderContext.frameStart();
    this.renderContext.frameEnd();
  }
}

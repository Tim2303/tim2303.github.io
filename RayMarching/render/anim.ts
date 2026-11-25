/* Animation implementation */
import { _render } from "./render.js";
import { _input } from "../math/math.js";
import { _control } from "./control.js";
import * as GL from "./gl.js";

export class _anim {
  renderContext = new _render();
  input = new _input();
  controller = new _control();

  get isCursorHidden(): boolean {
    return document.pointerLockElement === GL.canvas;
  }

  async init() {
    await this.renderContext.init();

    GL.canvas.addEventListener("click", () => {
      if (!this.isCursorHidden) GL.canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      this.input.reset();
      document.body.classList.toggle("locked", this.isCursorHidden);
    });
  }

  response() {
    this.input.response();

    if (this.isCursorHidden) {
      this.controller.cameraChange(this.input, this.renderContext);
    }

    const { width, height } = GL.canvas.getBoundingClientRect();
    this.renderContext.cam.setSize(width, height);

    this.renderContext.frameStart();
    this.renderContext.frameEnd();
  }
}
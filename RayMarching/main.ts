/* Render */
import { _anim } from "./render/anim.js";
import * as mainGL from "./render/gl.js";

let anim: _anim = new _anim();

/* Main program function */
export async function main() {
  if (mainGL.setGL(document) === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  await anim.init();

  /* Input callbacks */
  window.addEventListener("keydown", anim.input.onKeyDown);
  window.addEventListener("keyup", anim.input.onKeyUp);
  mainGL.canvas.addEventListener("mousedown", anim.input.onMouseDown);
  mainGL.canvas.addEventListener("mouseup", anim.input.onMouseUp);
  mainGL.canvas.addEventListener("mousemove", anim.input.onMouseMove);
  mainGL.canvas.addEventListener("wheel", anim.input.onMouseWheel);

  /**/
  const sliderEl = document.getElementById("range");
  const sliderValue = document.querySelector(".value");

  if (sliderEl !== null && sliderValue !== null) {
    sliderEl.addEventListener("input", (event: any = 0) => {
      let tempSliderValue;
      if (event.target !== null) {
        tempSliderValue = event.target.value;
      }

      sliderValue.textContent = tempSliderValue;
      sliderEl.style.background = `linear-gradient(to right, #f50 ${
        tempSliderValue * 10
      }%, #ccc ${tempSliderValue}%)`;

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

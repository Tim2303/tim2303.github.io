/* Control implementation */
import { _input, VK, _timer, _vec3, _mat4 } from "../math/math.js";
import { _render } from "./render.js";

const coeff = 7;
const turbo = 150;
const totalUp = new _vec3([0, 1, 0]);

export class _control {
  cameraChange(input: _input, render: _render) {
    const delta = render.timer.globalDeltaTime;
    const cam = render.cam;

    const smth = turbo * delta * Number(input.keys[VK.SHIFT]);
    const accel = smth == 0 ? 1 : smth;

    let x = cam.dir
      .normalize()
      .mulNum(
        (Number(input.keys[VK.W]) - Number(input.keys[VK.S])) *
          delta *
          coeff *
          accel
      );
    let z = cam.right
      .normalize()
      .mulNum(
        (Number(input.keys[VK.D]) - Number(input.keys[VK.A])) *
          delta *
          coeff *
          accel
      );
    let y = totalUp.mulNum(
      (Number(input.keys[VK.SPACE]) - Number(input.keys[VK.CONTROL])) *
        delta *
        coeff *
        accel
    );
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

/// Main output module.
import { mat4, vec3 } from "./mth/matr4.js";
import { camera } from "./mth/camera.js";
import { prim } from "./rnd/rndprim.js";
import {
  cubData,
  cubInd,
  tetrData,
  tetrInd,
  octaData,
  octaInd,
  dodecaData,
  dodecaInd,
  icosaData,
  icosaInd,
  surfaceData,
  surfaceInd,
  artEnData,
  artEnInd,
  artData,
  artInd,
  squareData,
  squareInd,
} from "./data/buffers.js";

// Read text from file by URL function.
async function fetchResource(resURL) {
  try {
      const response = await fetch(resURL);
      const text = await response.text();

      return text;
  } catch(err) {
      console.error(err);
  }
}

// Load shader function.
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Error load shader" + gl.getShaderInfoLog(shader));
  }
  return shader;
}

// Draw bullet shot and colision with enemy tank.
// (x1, y1) - start position of bullet
// (x2, y2) - enemy's tank position.
// flag (bool) - (true): draw flying bullet, (false): bullet is not moving.
function shotAndColision(x1, y1, speed, sin, cos, x2, y2, time, cam, prim, flag) {
  let delta = 7;

  if (flag === true) {
    let A = 2; // acceleration
    let Sx = speed * cos * time; // Proj of speed on Ox
    let Sy = (speed * sin - A * time) * time; // Proj of speed on Oy

    if (y1 + Sy < -10 ||
    (x1 + Sx > -0.5 * delta && x1 + Sx < 0.5 * delta && y1 + Sy < 1.5 * delta - 10)) {
      Sy = 0;
      Sx = 0;
      prim.draw(cam, mat4().translate(x1, y1, 0));
      return 0;
    }
    prim.draw(cam, mat4().translate(x1 + Sx, y1 + Sy, 0));

    if (
      x1 + Sx <= x2 + 0.5 &&
      x1 + Sx >= x2 - 0.5 &&
      y1 + Sy <= y2 + 0.5 &&
      y1 + Sy >= y2 - 0.5
    ) {
      Sy = 0;
      Sx = 0;
      // alert("Столкновение");
      return 1;
    }
    return -1;
  } else {
    prim.draw(cam, mat4().translate(x1, y1, 0));
    return -1;
  }
}

// Local room data.
let roomDataGL;
let leftFlag = false, rightFlag = false;
let leftStartTime, rightStartTime;
let leftSin, leftCos;
let rightSin, rightCos;
let leftSpeed, rightSpeed;

export function getRoomDataGL(roomData) {
  roomDataGL = roomData;

  if (roomDataGL == undefined) {
    leftFlag = false;
    rightFlag = false;
    leftStartTime = 0;
    rightStartTime = 0;
    return;
  }

  // Copy data to local class.
  if (roomDataGL.side == "r") {
    // Shot flag
    rightFlag = roomDataGL.isShot;
    leftFlag = roomDataGL.eIsShot;
    // Shot start time
    rightStartTime = roomDataGL.startShot;
    leftStartTime = roomDataGL.eStartShot;
    // Shot angle
    rightSin = roomDataGL.sinAngle;
    rightCos = roomDataGL.cosAngle;
    leftSin = roomDataGL.eSinAngle;
    leftCos = roomDataGL.eCosAngle;
    // Speed
    rightSpeed = roomData.speed;
    leftSpeed = roomData.eSpeed;
  } else {
    // Shot flag
    rightFlag = roomDataGL.eIsShot;
    leftFlag = roomDataGL.isShot;
    // Shot start time
    rightStartTime = roomDataGL.eStartShot;
    leftStartTime = roomDataGL.startShot;
    // Shot angle
    leftSin = roomDataGL.sinAngle;
    leftCos = roomDataGL.cosAngle;
    rightSin = roomDataGL.eSinAngle;
    rightCos = roomDataGL.eCosAngle;
    // Speed
    rightSpeed = roomData.eSpeed;
    leftSpeed = roomData.speed;
  }
}

/* GL initialization function */
export function initGL() {
  const canvas = document.getElementById("game");
  const gl = canvas.getContext("webgl2");

  // Get load shaders promises.
  let vsPr = fetchResource("./shaders/vert.glsl");
  let fsPr = fetchResource("./shaders/frag.glsl");

  Promise.all([vsPr, fsPr]).then((res) => {
    // Shader initialization.
    const vertexSh = loadShader(gl, gl.VERTEX_SHADER, res[0]);
    const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, res[1]);
    const shdprogram = gl.createProgram();

    gl.attachShader(shdprogram, vertexSh);
    gl.attachShader(shdprogram, fragmentSh);
    gl.linkProgram(shdprogram);

    // Enable openGL functions.
    gl.enable(gl.DEPTH_TEST);

    if (!gl.getProgramParameter(shdprogram, gl.LINK_STATUS)) {
      alert("Error in program");
    }

    // Load surface.
    let surfaceAg = new prim(gl, gl.TRIANGLES, surfaceData, surfaceInd, shdprogram);

    // Load models.
    let leftTank = new prim(gl, gl.TRIANGLES, artData, artInd, shdprogram);
    let rightTank = new prim(gl, gl.TRIANGLES, artEnData, artEnInd, shdprogram);

    let leftBullet = new prim(gl, gl.TRIANGLES, squareData, squareInd, shdprogram);
    let rightBullet = new prim(gl, gl.TRIANGLES, squareData, squareInd, shdprogram);

    let cam = camera();

    // Players coords.
    let rightPosX, rightPosY;
    let leftPosX, leftPosY;

    if (roomDataGL.side == "r") {
      rightPosX = roomDataGL.position[0];
      rightPosY = roomDataGL.position[1];
      leftPosX = roomDataGL.ePos[0];
      leftPosY = roomDataGL.ePos[1];
      rightSpeed = roomDataGL.speed;
      leftSpeed = roomDataGL.eSpeed;
    } else {
      rightPosX = roomDataGL.ePos[0];
      rightPosY = roomDataGL.ePos[1];
      leftPosX = roomDataGL.position[0];
      leftPosY = roomDataGL.position[1];
      rightSpeed = roomDataGL.eSpeed;
      leftSpeed = roomDataGL.speed;
    }

    let timeFromStart = Date.now();
    const drawRender = () => {
      if (roomDataGL == undefined) {
        gl.clearColor(0.3, 0.3, 0.4, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      gl.clearColor(0.3, 0.47, 0.8, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let rTime = (Date.now() - rightStartTime) / 1000.0;
      let lTime = (Date.now() - leftStartTime) / 1000.0;

      // Surface drawing.
      surfaceAg.draw(cam, mat4().scale(7, 7, 7).translate(0, -10, 0), timeFromStart);

      // Left side.
      leftTank.draw(cam, mat4().translate(leftPosX, leftPosY, 0), timeFromStart);
      if (shotAndColision(leftPosX + 0.5, leftPosY + 0.8,  // Bullet start position.
          leftSpeed, leftSin, leftCos,                     // Bullet speed.
          rightPosX, rightPosY,                            // Enemy position.
          lTime, cam, leftBullet, leftFlag) != -1) {       // Time, camera, primitive, shootFlag.
        leftFlag = false;
      }

      // Right side.
      rightTank.draw(cam, mat4().translate(rightPosX, rightPosY, 0), timeFromStart);
      if (shotAndColision(rightPosX - 0.5, rightPosY + 0.8,    // Bullet start position.
          rightSpeed, rightSin, rightCos,                      // Bullet speed.
          leftPosX, leftPosY,                                  // Enemy position.
          rTime, cam, rightBullet, rightFlag) != -1) {         // Time, camera, primitive, shootFlag.
        rightFlag = false;
      }

      window.requestAnimationFrame(drawRender);
    };
    
    if (roomDataGL != undefined) {
      drawRender();
    }
  });
}

// END OF 'main.js' FILE.

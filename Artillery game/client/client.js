import { io } from "socket.io-client";

// My files imports.
import {Data, State} from "./classes.js";
import * as Utils from "./utils.js";
import * as control from "./game_engine.js";

// Output result of game.
function gameResult(res) {
  if (res == 1) {
    document.getElementById("game-res").innerText = "You won!!!";
    setTimeout(() => {
      document.getElementById("game-res").innerText = "";
    }, 2000);
  } else {
    document.getElementById("game-res").innerText = "You lose";
    setTimeout(() => {
      document.getElementById("game-res").innerText = "";
    }, 2000);
  }
} 

// Update UI upper zone with statistics.
function updateUpperUI(id) {
  if (id == 1) {
    document.getElementById("room-info").innerText = `Room ID: ${roomData.roomId}\n
          Your ID: ${roomData.playerId}`;
    document.getElementById("small-info").innerText = `Your HP: ${roomData.myHp}\n
          Your pos: ${roomData.position[0]}:${roomData.position[1]}\n
          You are ${roomData.side == "l" ? "green" : "red"} player`;
  } else if (id == 0) {
    document.getElementById("room-info").innerText = "Waiting for opponent...";
    document.getElementById("small-info").innerText = "";
  } else if (id == 2) {
    document.getElementById("room-info").innerText = "You are in lobby";
    document.getElementById("small-info").innerText = "";
  }
}

// Update UI down zone with turn or shoot success.
function updateDownUI(id, msg) {
  if (id == "turn") {
    document.getElementById("turn-info").innerText = msg;
  } else if (id == "success") {
    document.getElementById("shoot-info").innerText = msg;
    setTimeout(() => {
      document.getElementById("shoot-info").innerText = "";
    }, 1500);
  }
}

// Local room data.
let roomData = new Data();
let startTime;
let lobbyFlag = 1;

// Client-side.
async function main() {
  const socket = io();

  ////////////////////// User connected.
  socket.on("connect", () => {

    // Room created, have opponent, get start data, initialize canvas webGL, set UI.
    socket.on("Found room", (dataArray) => {
      Utils.setRoomData(roomData, dataArray, socket);
      control.getRoomDataGL(roomData);
      control.initGL();
      updateDownUI("turn", roomData.state == State.ANGLE_CHOOSE
      ? "It's your turn, set angle"
      : "Wait for opponent");
      updateUpperUI(1);
    });

    // Send request to join vaiters room.
    document.getElementById("join").addEventListener("click", (e) => {
      if (lobbyFlag != 0) {
        lobbyFlag = 0;
        socket.emit("Join waiters", '');
      }
    });

    // Output current angle.
    document.getElementById("game").addEventListener("mousemove", (e) => {
      if (roomData.state == State.ANGLE_CHOOSE) { // Set shoot angle.
        let myCan = document.getElementById("game");
        let mouseX = (e.pageX - e.target.offsetLeft) / myCan.clientWidth * 20;
        let mouseY = 20 - (e.pageY - e.target.offsetTop) / myCan.clientHeight * 20;

        roomData.setAngle(mouseX, mouseY);
        document.getElementById("angle").innerText = `Sin: ${roomData.sinAngle.toFixed(4)}\nCos: ${roomData.cosAngle.toFixed(4)}`;
      }
    });

    // Send data about shoot to server.
    document.getElementById("game").addEventListener("click", (e) => {
      if (roomData.state == State.ANGLE_CHOOSE) { // Set shoot angle.
        let myCan = document.getElementById("game");
        roomData.setAngle(
          (e.pageX - e.target.offsetLeft) / myCan.clientWidth * 20,
          20 - (e.pageY - e.target.offsetTop) / myCan.clientHeight * 20);
        roomData.state = State.SPEED_CHOOSE;
        startTime = Date.now();
        updateDownUI("turn", "Now choose speed");
      } else if (roomData.state == State.SPEED_CHOOSE) { // Set shoot speed.
        roomData.speed = document.getElementById("speed").value;
        roomData.startShot = Date.now();

        // Give shoot data to server.
        roomData.isShot = true;
        socket.emit("Shoot data", [roomData.roomId, roomData.speed, roomData.sinAngle, roomData.cosAngle, roomData.startShot]);
        control.getRoomDataGL(roomData);

        roomData.state = State.WAITING;
        updateDownUI("turn", "Wait for opponent");
      }
    });

    // Send data about button click to server (moving).
    // Change

    // Room disbanded - lost opponent/You are new player.
    socket.on("No opponent", () => {
      control.getRoomDataGL(undefined);
      roomData.roomId = 0;
      roomData.state = State.WAITING;
      updateUpperUI(0);
      updateDownUI("turn", "");
    });

    // Lost room, move to lobby.
    socket.on("Lost room", () => {
      control.getRoomDataGL(undefined);
      roomData.roomId = 0;
      roomData.state = State.WAITING;
      lobbyFlag = 1;
      updateUpperUI(2);
      updateDownUI("turn", "");
    });

    // Result of player shoot.
    socket.on("Self shoot res", (res) => {
      setTimeout(() => {
        updateDownUI("success", res[0] == true ? "Success" : "Missed");
      }, res[1] * 1000);
    });

    // Enemy have no hp.
    socket.on("End game", (res) => {
      control.getRoomDataGL(undefined);
      roomData.roomId = 0;
      roomData.state = State.WAITING;
      lobbyFlag = 1;
      updateUpperUI(2);
      updateDownUI("turn", "");
      gameResult(1);
    });

    // Result of enemy shoot.
    socket.on("Damage", (res) => {
      setTimeout(() => {
        if (Number(res[0])) {
          roomData.myHp -= 100;
        }
        updateUpperUI(1);
        // Ckeck if player have no hp.
        if (roomData.myHp <= 0) {
          socket.emit("Game over", roomData.roomId);
          control.getRoomDataGL(undefined);
          roomData.roomId = 0;
          lobbyFlag = 1;
          updateUpperUI(2);
          updateDownUI("turn", "");
          gameResult(0);
        }
      }, res[1] * 1000);
    });

    // PLayer's turn to make move and enemy shoot result.
    socket.on("Changed turn", (dataArray) => {
      updateDownUI("turn", "Now it's your turn, set angle");
      roomData.state = State.ANGLE_CHOOSE;
      roomData.eSinAngle = dataArray[2];
      roomData.eCosAngle = dataArray[3];
      roomData.eSpeed = dataArray[1];
      roomData.eIsShot = true;
      roomData.eStartShot = dataArray[4];
      control.getRoomDataGL(roomData); // Give room data to openGL canvas.
    });
  });

  // Player disconnected from server.
  socket.on("disconnect", () => {
    socket.on("MessageFromServer", (msg) => {
      console.log(msg);
    });
  });
}

window.addEventListener("load", () => {
  main();
});
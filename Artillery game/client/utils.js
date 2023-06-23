import {State} from "./classes.js";

// Set player data from message function.
export function setRoomData(roomData, dataArray, socket) {
  // Room ID.
  roomData.roomId = dataArray[0];
  console.log(`Your room id: ${roomData.roomId}`);

  // Player HP.
  roomData.myHp = 1500;

  // Player ID.
  roomData.playerId = socket.id;

  // Position.
  roomData.position = [parseFloat(dataArray[1]), parseFloat(dataArray[2])];
  console.log(`Your position: ${roomData.position}`);

  // Player state and side.
  if (dataArray[3] == 1) {
    roomData.side = "l";
    roomData.state = State.ANGLE_CHOOSE;
  } else {
    roomData.side = "r";
    roomData.state = State.WAITING;
  }

  // Enemy position.
  roomData.ePos = [parseFloat(dataArray[4]), parseFloat(dataArray[5])];
  console.log(`Enemy position: ${roomData.ePos}`);
} // End of setRoomData function.

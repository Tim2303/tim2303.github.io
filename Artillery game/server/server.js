const http = require("http");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");

const app = express();
app.use(morgan("combined"));
app.use(express.static("."));

//initialize a simple http server
const server = http.createServer(app);
const io = new Server(server);

// Online clients on server array. 
const clients = [];
// Rooms with clients array.
const rooms = [];
// Wait room.
let waiters = [];

// Quick result of shoot.
function isBulletHitEnemyTank(x1, y1, speed, x2, y2, sin, cos) {
  let A = 2;
  let delta = 7;
  let timeX = (x2 - x1) / (speed * cos);
  let coordByX, coordByY;

  for (let i = 0; i <= timeX; i += 0.05) {
    coordByX = x1 + speed * cos * i;
    coordByY = y1 + (speed * sin - A * i) * i;

    if (coordByY < -10 || (coordByX > -0.5 * delta && coordByX < 0.5 * delta && coordByY < 1.5 * delta - 10)) {
      return [false, i];
    }
  }

  for (let j = timeX - 0.2; j <= timeX + 0.2; j += 0.005) {
    if ((y1 + (speed * sin - A * j) * j) <= y2 + 0.5 && (y1 + (speed * sin - A * j) * j) >= y2 - 0.5) {
      return [true, timeX];
    }
  }

  return [false, timeX];
}

/////////////////////////////////////////////////////////////////////////
class Room {
  constructor(u1, u2) {
    this.user1 = u1;
    this.user2 = u2;
    this.id = Date.now() + Math.random() - Math.random();
    this.user1_pos = [-8, -6];
    this.user2_pos = [8, -6];

    u1.emit("Found room", [this.id, this.user1_pos[0], this.user1_pos[1], 1, this.user2_pos[0], this.user2_pos[1]]);
    u2.emit("Found room", [this.id, this.user2_pos[0], this.user2_pos[1], 2, this.user1_pos[0], this.user1_pos[1]]);
  }

  countMoveResult(socket, speed, sin, cos) {
    let pos, ePos, shotted, enemy;
    let offset = [];

    if (socket.id == this.user1.id) {
      pos = this.user1_pos;
      shotted = this.user1;
      ePos = this.user2_pos;
      enemy = this.user2;
      offset = [0.65, 0.8];
    } else {
      pos = this.user2_pos;
      shotted = this.user2;
      ePos = this.user1_pos;
      enemy = this.user1;
      offset = [-0.65, 0.8];
    }

    let res = isBulletHitEnemyTank(pos[0] + offset[0], pos[1] + offset[1], speed, ePos[0], ePos[1], sin, cos);
    shotted.emit("Self shoot res", res);
    enemy.emit("Damage", res);
  }
} // End of Room class.

// Check if there are 2 waiters and inform them if room created.
function checkWaiters(socket) {
  waiters.push(socket);
  if (waiters.length == 2) {
    rooms.push(new Room(waiters[0], waiters[1]));
    waiters = [];
  } else {
    socket.emit("No opponent", '');
  }
}
///////////////////////////////////////////

io.on("connection", (socket) => {
  clients.push(socket);

  ////////////////////////////////////////////////////////////// Connected
  console.log(`Client connected with id: ${socket.id}`);

  // Check for available room.
  socket.on("Join waiters", () => {
    checkWaiters(socket);
  });

  // New users data delivery on shoot.
  socket.on("Shoot data", (dataArray) => {
    for (let room of rooms) {
      if (room.id == dataArray[0]) {
        // Found current room.
        let shottedUser;

        if (socket.id == room.user1.id) {
          shottedUser = room.user1;
          room.user2.emit("Changed turn", dataArray);
        } else {
          shottedUser = room.user2;
          room.user1.emit("Changed turn", dataArray);
        }

        room.countMoveResult(socket, dataArray[1], dataArray[2], dataArray[3]);
        break;
      }
    }
  });

  // User failed.
  socket.on("Game over", (roomID) => {
    for (let room of rooms) {
      if (room.id == roomID) {
        if (socket.id == room.user1.id) {
          room.user2.emit("End game", 1);
          let index = clients.indexOf(room.user2);
          if (index > -1) {
            clients.splice(index, 1);
          }
        } else {
          room.user1.emit("End game", 1);
          let index = clients.indexOf(room.user1);
          if (index > -1) {
            clients.splice(index, 1);
          }
        }

        // Delete clients.
        const index = clients.indexOf(socket);
        if (index > -1) {
          clients.splice(index, 1);
        }
        // Delete room.
        let roomIndex = rooms.indexOf(room);
        rooms.splice(roomIndex, 1);
        break;
      }
    }
  });

  ////////////////////////////////////////////////////////////// Disconnected
  socket.on("disconnect", () => {
    let roomIndex;
    console.log(`Client disconnected with id: ${socket.id}`);

    // Set new waiters room if left active player.
    rooms.forEach((room) => {
      if (room.user1.id == socket.id) {
        room.user2.emit("Lost room", '');
        roomIndex = rooms.indexOf(room);
        rooms.splice(roomIndex, 1);
      } else if (room.user2.id == socket.id) {
        room.user1.emit("Lost room", '');
        roomIndex = rooms.indexOf(room);
        rooms.splice(roomIndex, 1);
      }
    });

    // Clear waiters room if necessary.
    if (waiters[0] == socket) {
      waiters = [];
    }

    // Delete client from clients array.
    const index = clients.indexOf(socket);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });
});

server.listen(process.env.PORT || 3047, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
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

const clients = [];

io.on("connection", (socket) => {
  clients.push(socket);
  console.log(`Client connected with id: ${socket.id}`);
  socket.on("MessageToServer", (msg) => {
    let res = msg.split('╩╦╩');
    const replyMsg = res[0] + `╩╦╩` + (res[1]) + `╩╦╩` + (clients.length);
    for (let client of clients) {
      client.emit("MessageFromServer", replyMsg);
    }
  });
  socket.on("disconnect", () => {
    console.log(`Client disconnected with id: ${socket.id}`);
    const index = clients.indexOf(socket);
    
    for (let client of clients) {
      client.emit("MessageFromServer", `╩╦╩${clients.length}`);
    }

    if (index > -1) {
      clients.splice(index, 1);
    }
  });
});

server.listen(process.env.PORT || 3047, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
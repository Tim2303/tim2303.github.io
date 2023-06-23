import { io } from "socket.io-client";

const socket = io();

function sendMessage() {
  const value = document.getElementById("id1").value;
  const name = document.getElementById("nick").value;

  document.getElementById("id1").value = "";
  socket.emit("MessageToServer", name + `╩╦╩` + value);
}

async function main() {
  // client-side
  socket.on("connect", () => {
    //console.log(socket.id); // x8WIv7-mJelg7on_ALbx

    socket.on("MessageFromServer", function (msg) {
      let res = msg.split('╩╦╩');
      let nick = res[0];
      let place = document.getElementById("id2");

      let date = new Date();
      let time = `${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}`;

      document.getElementById("info").innerText = `Chat sample` + ` - online (${res[2]})`;

      if (nick === "~~offset~~") {
        place.insertAdjacentHTML('beforeend',
        `<div class="container-cursed" id="id2">
        <img src="./avatar1.jpg" alt="Avatar">
        <p>Message from Guest666: ${res[1]}</p>
        <span class="time-right">${time}</span>
        </div>`);
      } else {
        place.insertAdjacentHTML('beforeend',
        `<div class="container" id="id2">
        <img src="./bandmember.jpg" alt="Avatar">
        <p>Message from ${res[0]}: ${res[1]}</p>
        <span class="time-right">${time}</span>
        </div>`);
      }

      place.scrollTo(0, place.scrollHeight);
    });
  });

  socket.on("disconnect", () => {
    socket.on("MessageFromServer", function(msg) {
      let res = msg.split('╩╦╩');
      let tmp = document.getElementById("info");
      tmp.innerText = `Chat sample` + ` - online (${res[1]})`;
    })
    //console.log(socket.id); // undefined
  });

  document.getElementById("id1").onkeyup = (ev) => {
    if (ev.code === "Enter") {sendMessage()}};
  document.getElementById("but").onclick = () => {sendMessage()};
}

window.addEventListener("load", (event) => {
  main();
});
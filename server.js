const express = require("express");
const { Action } = require("history");
const app = express();
const http = require("http");
const path = require("path");
const { disconnect } = require("process");
const server = http.createServer(app);

const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const io = new Server(server);

app.use(express.static("build"));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // JOIN
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    // need to know the username of particular socket id. thats why storing in a map obj
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    // getting all existing clients
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // EMITTING DATA TO ALL EXCEPT ME
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // AUTO SYNC
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // DISCONNECT
  socket.on("disconnecting", () => {
    // if a user is present in multiple rooms, find those rooms and in each room emit that this man is leaving
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

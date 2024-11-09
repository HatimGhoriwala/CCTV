const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let broadcaster;

app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on('viewer', () => {
    if (broadcaster) {
      io.to(broadcaster).emit('viewer', socket.id);
    }
  });

  socket.on('offer', (id, description) => {
    io.to(id).emit('offer', socket.id, description);
  });

  socket.on('answer', (id, description) => {
    io.to(id).emit('answer', socket.id, description);
  });

  socket.on('icecandidate', (id, candidate) => {
    io.to(id).emit('icecandidate', socket.id, candidate);
  });

  socket.on('disconnect', () => {
    if (socket.id === broadcaster) {
      io.emit('disconnectPeer', socket.id);
      broadcaster = null;
    } else {
      io.to(broadcaster).emit('disconnectPeer', socket.id);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is running on port ${port}`));

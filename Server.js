const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Serve static files

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // Join Room
  socket.on('joinRoom', () => {
    console.log('User joined room:', socket.id);
    // Notify other users about the new user
    socket.broadcast.emit('newUser', socket.id);
  });

  // Relay offers, answers, and ICE candidates
  socket.on('offer', (userId, description) => {
    io.to(userId).emit('offer', socket.id, description);
  });

  socket.on('answer', (userId, description) => {
    io.to(userId).emit('answer', socket.id, description);
  });

  socket.on('icecandidate', (userId, candidate) => {
    io.to(userId).emit('icecandidate', socket.id, candidate);
  });

  // Notify others when a user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('userLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

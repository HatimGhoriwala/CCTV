const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let broadcaster;

app.use(express.static('public'));

// Socket.IO connection logic
io.on('connection', socket => {
  console.log(`Client connected: ${socket.id}`);

  // Handle broadcaster connection
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    console.log(`Broadcaster connected: ${broadcaster}`);
    socket.broadcast.emit('broadcaster');
  });

  // Handle viewer connection request
  socket.on('viewer', () => {
    if (broadcaster) {
      console.log(`Viewer connected: ${socket.id}`);
      io.to(broadcaster).emit('viewer', socket.id);
    } else {
      console.log(`No broadcaster available for viewer: ${socket.id}`);
    }
  });

  // Handle offer from broadcaster to viewer
  socket.on('offer', (id, description) => {
    io.to(id).emit('offer', socket.id, description);
    console.log(`Offer sent from ${socket.id} to ${id}`);
  });

  // Handle answer from viewer to broadcaster
  socket.on('answer', (id, description) => {
    io.to(id).emit('answer', socket.id, description);
    console.log(`Answer sent from ${socket.id} to ${id}`);
  });

  // Handle ICE candidate exchange
  socket.on('icecandidate', (id, candidate) => {
    io.to(id).emit('icecandidate', socket.id, candidate);
    console.log(`ICE candidate sent from ${socket.id} to ${id}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // If broadcaster disconnects, notify all viewers
    if (socket.id === broadcaster) {
      console.log('Broadcaster has disconnected.');
      io.emit('disconnectPeer', socket.id);
      broadcaster = null;
    } else {
      // Notify broadcaster if a viewer disconnects
      if (broadcaster) {
        io.to(broadcaster).emit('disconnectPeer', socket.id);
      }
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is running on port ${port}`));

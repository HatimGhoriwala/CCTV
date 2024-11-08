const express = require('express');
const http = require('http');
const socketIo = require('socket.io');



// Initialize express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = socketIo(server);

// Serve static files (index.html)
app.use(express.static('public'));

// When a client connects
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Listen for an offer from the client (laptop)
  socket.on('offer', (offer) => {
    console.log('Received offer:', offer);
    socket.broadcast.emit('offer', offer); // Broadcast the offer to other clients (mobiles)
  });
  
  // Listen for an answer from the client (mobile)
  socket.on('answer', (answer) => {
    console.log('Received answer:', answer);
    socket.broadcast.emit('answer', answer); // Broadcast the answer back to the laptop
  });
  
  // Listen for ICE candidates from clients (both laptop and mobile)
  socket.on('icecandidate', (candidate) => {
    console.log('Received ICE candidate:', candidate);
    socket.broadcast.emit('icecandidate', candidate); // Broadcast ICE candidate to the other client
  });
  
  // When a client disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
const port = process.env.PORT || 3000;

// Start server on port 3000
server.listen(port, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000');
});

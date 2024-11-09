const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setInterval(() => {
  axios.get('http://cctv-njp7.onrender.com/keep-alive')
    .then(response => {
      if (response.status === 200) {
        console.log('Server is awake');
      } else {
        console.error('Failed to wake up the server:', response.status);
      }
    })
    .catch(error => console.error('Error keeping server awake:', error.message));
}, 120000);

let broadcaster = null;

app.use(express.static('public'));

// Serve the HTML file
app.get('/keep-alive', (req, res) => {
  res.status(200).send('Server is awake!');
});

// Socket.IO connection handling
io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  // Broadcaster registration
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster', socket.id);
    console.log('Broadcaster registered:', broadcaster);
  });

  // Viewer joining
  socket.on('viewer', () => {
    if (broadcaster) {
      socket.to(broadcaster).emit('viewer', socket.id);
      console.log('Viewer joined:', socket.id);
    } else {
      socket.emit('broadcasterNotAvailable');
      console.log('No broadcaster available for viewer:', socket.id);
    }
  });

  // WebRTC signaling
  socket.on('offer', (id, description) => {
    socket.to(id).emit('offer', socket.id, description);
    console.log('Offer forwarded to:', id);
  });

  socket.on('answer', (id, description) => {
    socket.to(id).emit('answer', socket.id, description);
    console.log('Answer forwarded to:', id);
  });

  socket.on('icecandidate', (id, candidate) => {
    socket.to(id).emit('icecandidate', socket.id, candidate);
    console.log('ICE candidate forwarded to:', id);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.id === broadcaster) {
      console.log('Broadcaster disconnected');
      broadcaster = null;
      io.emit('broadcasterDisconnected');
    } else {
      if (broadcaster) {
        socket.to(broadcaster).emit('viewerDisconnected', socket.id);
        console.log('Viewer disconnected:', socket.id);
      }
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Access the application at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
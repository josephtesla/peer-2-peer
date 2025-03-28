const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  connectionStateRecovery: true
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    console.log('message from client: ' + msg)
    // socket.emit('chat message', 'message from you via server: ' + msg) // sends to only tha same socket client
    io.emit('chat message', 'message from client1 via server to everyone: ' + msg) // sends to all connected sockets/clients
    // socket.broadcast.emit('chat message', 'message from client1 via server to everyone except client1: ' + msg)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
})

server.listen(3001, () => {
  console.log('server running at http://localhost:3001');
});

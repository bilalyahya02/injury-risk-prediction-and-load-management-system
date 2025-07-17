
// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { port, mongoURI } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/data', require('./routes/data'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));



// Setup server + WebSocket
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

module.exports.io = io;  // Export for use in mqttClient


require('./mqtt/mqttClient');

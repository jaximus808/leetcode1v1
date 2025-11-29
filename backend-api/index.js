require('dotenv').config();

const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectKafka, producer } = require('./kafka');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

io.on('connection', (socket) => {

  let currentPlayerId = null;
  let queueInterval;

  console.log('User connected:', socket.id);

  socket.on('join', (roomName) => {
    socket.join(roomName);
    currentPlayerId = roomName.replace('player-', '');
    console.log(`${socket.id} joined room: ${roomName}`);

    queueInterval = setInterval(() => {
      const position = Math.floor(Math.random() * 10) + 1;
      const eta = position * 5;
      socket.emit('queue-update', { position, eta });
    }, 2000);
  });

  socket.on('cancel-search', async () => {
    if(!currentPlayerId) {
      console.error('No player ID found');
      return;
    }

    try {
      await producer.send({
        topic: 'match-requests', //has to be implemented in go matchmaker
        messages: [
          {
            key: currentPlayerId.toString(),
            value: JSON.stringify({
              player_id: currentPlayerId,
              action: 'cancel',
              timestamp: Date.now()
            })
          }
        ]
      });
    }
    catch (error) {
      console.error('Error canceling search:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io)

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Test Supabase connection
const supabase = require('./supabase');
supabase.from('players').select('count').then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connected successfully');
  }
});

// Connect Kafka
connectKafka().catch(err => {
  console.error("Kafka connection error:", err);
});

// Import routes
const playerRoutes = require('./routes/player');
const problemRoutes = require('./routes/problem');
const matchRoutes = require('./routes/match');

// Use routes
app.use('/api/players', playerRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/matches', matchRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Matchmaking API',
    version: '1.0.0',
    endpoints: {
      players: '/api/players',
      problems: '/api/problems',
      matches: '/api/matches'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { io };
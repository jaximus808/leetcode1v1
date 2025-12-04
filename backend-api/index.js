require('dotenv').config();

const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectKafka, producer } = require('./kafka');
const MakeSocketIOInstance = require('./socket')

const app = express()
const { io, server } = MakeSocketIOInstance(app)
app.set('io', io)

// CORS configuration - allow multiple origins for Kubernetes
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  /^http:\/\/127\.0\.0\.1:\d+$/,  // Any localhost port
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Minikube IPs
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches regex
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for development
    }
  },
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
connectKafka(io).catch(err => {
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

app.post('/api/test-progress', async (req, res) => {
  const { matchId, playerId, passed, total } = req.body;

  if (!matchId || !playerId || passed === undefined || total === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`Test progress: Player ${playerId} in match ${matchId}: ${passed}/${total}`);

  // Emit to the game room
  io.to(`room:${matchId}`).emit('test-progress', {
    playerId,
    passed,
    total
  });

  // Check if player won (100% completion)
  if (passed === total) {
    console.log(`🏆 Player ${playerId} completed all tests! Game Over!`);

    // Get match data to determine opponent
    const supabase = require('./supabase');
    const { data: match } = await supabase
      .from('matches')
      .select('player1_id, player2_id')
      .eq('id', matchId)
      .single();

    if (match) {
      const winnerId = playerId;
      const loserId = match.player1_id == playerId ? match.player2_id : match.player1_id;

      // Update match status
      await supabase
        .from('matches')
        .update({
          status: 'completed',
          result: match.player1_id == playerId ? 'player1' : 'player2'
        })
        .eq('id', matchId);

      // Emit game over event
      io.to(`room:${matchId}`).emit('game-over', {
        winnerId,
        loserId,
        winnerScore: total,
        reason: 'completed_all_tests'
      });
    }
  }

  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { io };

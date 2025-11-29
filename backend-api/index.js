require('dotenv').config();

const express = require("express");
const cors = require('cors');
const { connectKafka, producer } = require('./kafka');

const app = express();

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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
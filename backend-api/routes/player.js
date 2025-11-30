const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const bcrypt = require('bcrypt');

// GET all players (leaderboard)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, username, elo, created_at')
      .order('elo', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching players', error: err.message });
  }
});

// GET player by ID
router.get('/:playerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, username, elo, created_at, updated_at')
      .eq('id', req.params.playerId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching player', error: err.message });
  }
});

// GET player by username
router.get('/username/:username', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, username, elo, created_at')
      .eq('username', req.params.username)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching player', error: err.message });
  }
});

// POST create new player
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert player
    const { data, error } = await supabase
      .from('players')
      .insert([
        {
          username,
          password: hashedPassword,
          elo: 100
        }
      ])
      .select('id, username, elo, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Username already exists' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: 'Error creating player', error: err.message });
  }
});

// PUT update player elo
router.put('/:playerId/elo', async (req, res) => {
  try {
    const { elo } = req.body;

    if (typeof elo !== 'number') {
      return res.status(400).json({ message: 'Elo must be a number' });
    }

    const { data, error } = await supabase
      .from('players')
      .update({ elo })
      .eq('id', req.params.playerId)
      .select('id, username, elo, updated_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error updating player', error: err.message });
  }
});

// POST login/verify password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Get player with password
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Don't send password back
    delete data.password;
    res.json({ message: 'Login successful', player: data });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// DELETE player
router.delete('/:playerId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', req.params.playerId);

    if (error) throw error;

    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting player', error: err.message });
  }
});

module.exports = router;
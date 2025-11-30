const { authenticateToken } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { producer } = require('../kafka');

// GET /api/matches/my-matches
router.get('/my-matches', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching matches', error: err.message });
  }
});

// GET /api/matches/match/pending
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error;

    res.json(data || null);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending match', error: err.message });
  }
});

// GET all matches
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('matches')
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching matches', error: err.message });
  }
});

// GET match by ID
router.get('/:matchId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .eq('id', req.params.matchId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching match', error: err.message });
  }
});

// GET matches for a specific player
router.get('/player/:playerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .or(`player1_id.eq.${req.params.playerId},player2_id.eq.${req.params.playerId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching matches', error: err.message });
  }
});

// POST request a match (sends to Kafka)
// JAXON: Moving this into websocket flow
router.post('/request', async (req, res) => {
  try {
    const { player_id } = req.body;

    if (!player_id) {
      return res.status(400).json({ message: 'player_id is required' });
    }

    // Get player info
    const { data: player, error } = await supabase
      .from('players')
      .select('id, username, elo')
      .eq('id', player_id)
      .single();

    if (error || !player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Send to Kafka for matchmaking
    await producer.send({
      topic: 'match-requests',
      messages: [{
        key: player.id.toString(),
        value: JSON.stringify({
          player_id: player.id,
          elo_rank: player.elo,
          timestamp: Date.now()
        })
      }]
    });

    res.json({
      message: 'Match request sent to matchmaker',
      player: player
    });
  } catch (err) {
    res.status(500).json({ message: 'Error requesting match', error: err.message });
  }
});

// POST create match (usually called by matchmaker)
router.post('/', async (req, res) => {
  try {
    const { player1_id, player2_id, problem_id } = req.body;

    if (!player1_id || !player2_id) {
      return res.status(400).json({ message: 'player1_id and player2_id are required' });
    }

    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          player1_id,
          player2_id,
          problem_id: problem_id || null,
          status: 'pending'
        }
      ])
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo),
        problem:problems(id, title, difficulty)
      `)
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: 'Error creating match', error: err.message });
  }
});

// PUT update match result
router.put('/:matchId/result', async (req, res) => {
  try {
    const { result, status } = req.body;

    const updates = { status: status || 'completed' };
    if (result) updates.result = result;

    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', req.params.matchId)
      .select(`
        *,
        player1:players!player1_id(id, username, elo),
        player2:players!player2_id(id, username, elo)
      `)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update player elos if match is completed
    if (updates.status === 'completed' && result) {
      if (result === 'player1') {
        await supabase.from('players').update({ elo: data.player1.elo + 25 }).eq('id', data.player1_id);
        await supabase.from('players').update({ elo: Math.max(0, data.player2.elo - 25) }).eq('id', data.player2_id);
      } else if (result === 'player2') {
        await supabase.from('players').update({ elo: data.player2.elo + 25 }).eq('id', data.player2_id);
        await supabase.from('players').update({ elo: Math.max(0, data.player1.elo - 25) }).eq('id', data.player1_id);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error updating match', error: err.message });
  }
});

// DELETE match
router.delete('/:matchId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', req.params.matchId);

    if (error) throw error;

    res.json({ message: 'Match deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting match', error: err.message });
  }
});

module.exports = router;

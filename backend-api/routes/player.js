const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/:playerId', async (req, res) => {
    try {
        const player = await Player.findOne({ id: req.params.playerId });
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(player);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching player', error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const player = new Player(req.body);
        await player.save();
        res.status(201).json(player);
    } catch (err) {
        res.status(400).json({ message: 'Error creating player', error: err.message });
    }
});

module.exports = router;
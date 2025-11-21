const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
    },
    result: {
        type: String,
        enum: ['player1', 'player2', 'draw'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
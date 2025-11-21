const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    difficult: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
    },
    testCaseUrl: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);
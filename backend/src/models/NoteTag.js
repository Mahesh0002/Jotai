const mongoose = require('mongoose');

const noteTagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    color: {
        type: String,
        default: '#ec4899'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NoteTag', noteTagSchema);

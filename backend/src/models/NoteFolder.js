const mongoose = require('mongoose');

const noteFolderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: 'folder'
    },
    color: {
        type: String,
        default: '#8b5cf6'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NoteFolder', noteFolderSchema);

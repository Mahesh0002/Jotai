const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Untitled Note',
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NoteFolder',
        default: null
    },
    tagIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NoteTag'
    }],
    pinned: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastEdited: {
        type: Date,
        default: Date.now
    }
});

// Update lastEdited automatically on save
noteSchema.pre('save', function(next) {
    this.lastEdited = Date.now();
    next();
});

module.exports = mongoose.model('Note', noteSchema);

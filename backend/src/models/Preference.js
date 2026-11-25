const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    integrations: {
        google: { type: Boolean, default: false },
        notion: { type: Boolean, default: false },
        spotify: { type: Boolean, default: false },
        github: { type: Boolean, default: false },
        trello: { type: Boolean, default: false }
    },
    theme: {
        type: String,
        default: 'dark'
    },
    settings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Preference', preferenceSchema);

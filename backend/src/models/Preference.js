const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const preferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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
    calendarIcsUrl: { type: String, default: '' },
    settings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

preferenceSchema.plugin(scopedPlugin);

module.exports = mongoose.model('Preference', preferenceSchema);

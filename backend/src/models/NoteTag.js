const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const noteTagSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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

noteTagSchema.plugin(scopedPlugin);

module.exports = mongoose.model('NoteTag', noteTagSchema);

const mongoose = require('mongoose');
const scopedPlugin = require('../middlewares/scopingPlugin');

const noteFolderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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

noteFolderSchema.plugin(scopedPlugin);

module.exports = mongoose.model('NoteFolder', noteFolderSchema);

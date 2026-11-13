const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  color: { 
    type: String, 
    default: "#A855F7" 
  },
  description: { 
    type: String,
    trim: true 
  },
  deadline: { 
    type: Date 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Project', projectSchema);

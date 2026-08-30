// src/models/News.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the News Schema
const newsSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
});

// Create the News model
const News = mongoose.model('News', newsSchema);

module.exports = News;

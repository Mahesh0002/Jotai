const Note = require('../models/Note');

const createNote = async (noteData) => {
  const note = new Note(noteData);
  return await note.save();
};

const getNotes = async () => {
  return await Note.find().sort({ createdAt: -1 });
};

const getNoteById = async (id) => {
  return await Note.findById(id);
};

const updateNote = async (id, updateData) => {
  return await Note.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteNote = async (id) => {
  return await Note.findByIdAndDelete(id);
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};

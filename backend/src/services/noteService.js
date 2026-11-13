const Note = require('../models/Note');
const NoteFolder = require('../models/NoteFolder');
const NoteTag = require('../models/NoteTag');

// --- Notes ---
const createNote = async (noteData) => {
  const note = new Note(noteData);
  await note.save();
  return await Note.findById(note._id).populate('folderId').populate('tagIds');
};

const getNotes = async () => {
  return await Note.find()
    .populate('folderId')
    .populate('tagIds')
    .sort({ lastEdited: -1 });
};

const getNoteById = async (id) => {
  return await Note.findById(id).populate('folderId').populate('tagIds');
};

const updateNote = async (id, updateData) => {
  updateData.lastEdited = Date.now();
  return await Note.findByIdAndUpdate(id, updateData, { new: true })
    .populate('folderId')
    .populate('tagIds');
};

const deleteNote = async (id) => {
  return await Note.findByIdAndDelete(id);
};

// --- Folders ---
const createFolder = async (data) => {
  const folder = new NoteFolder(data);
  return await folder.save();
};

const getFolders = async () => {
  return await NoteFolder.find().sort({ createdAt: 1 });
};

const deleteFolder = async (id) => {
  return await NoteFolder.findByIdAndDelete(id);
};

// --- Tags ---
const createTag = async (data) => {
  const tag = new NoteTag(data);
  return await tag.save();
};

const getTags = async () => {
  return await NoteTag.find().sort({ name: 1 });
};

const deleteTag = async (id) => {
  return await NoteTag.findByIdAndDelete(id);
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  createFolder,
  getFolders,
  deleteFolder,
  createTag,
  getTags,
  deleteTag,
};

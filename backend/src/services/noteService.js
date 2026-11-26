const noteRepository = require('../repositories/noteRepository');

const createNote = async (noteData) => {
  const userId = noteData.user_id || 'local_user';
  return noteRepository.create(userId, noteData);
};

const getNotes = async (userId = 'local_user') => {
  return noteRepository.findAll(userId);
};

const getNoteById = async (id, userId = 'local_user') => {
  return noteRepository.findById(userId, id);
};

const updateNote = async (id, updateData, userId = 'local_user') => {
  updateData.last_edited = new Date().toISOString();
  return noteRepository.update(userId, id, updateData);
};

const deleteNote = async (id, userId = 'local_user') => {
  return noteRepository.delete(userId, id);
};

const createFolder = async (data, userId = 'local_user') => {
  // Folders table not fully implemented, return mock
  return { id: require('uuid').v4(), ...data, user_id: userId, created_at: new Date().toISOString() };
};

const getFolders = async (userId = 'local_user') => {
  return [];
};

const deleteFolder = async (id, userId = 'local_user') => {
  return { deleted: true };
};

const createTag = async (data, userId = 'local_user') => {
  return { id: require('uuid').v4(), ...data, created_at: new Date().toISOString() };
};

const getTags = async (userId = 'local_user') => {
  return [];
};

const deleteTag = async (id, userId = 'local_user') => {
  return { deleted: true };
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
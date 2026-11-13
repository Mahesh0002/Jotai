const noteService = require('../services/noteService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// --- Notes ---
const createNote = async (req, res, next) => {
  try {
    const note = await noteService.createNote(req.body);
    res.status(201).json(new ApiResponse(201, note, 'Note created successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const getNotes = async (req, res, next) => {
  try {
    const notes = await noteService.getNotes();
    res.status(200).json(new ApiResponse(200, notes, 'Notes retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.params.id, req.body);
    if (!note) return next(new ApiError(404, 'Note not found'));
    res.status(200).json(new ApiResponse(200, note, 'Note updated successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await noteService.deleteNote(req.params.id);
    if (!note) return next(new ApiError(404, 'Note not found'));
    res.status(200).json(new ApiResponse(200, null, 'Note deleted successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

// --- Folders ---
const createFolder = async (req, res, next) => {
  try {
    const folder = await noteService.createFolder(req.body);
    res.status(201).json(new ApiResponse(201, folder, 'Folder created successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const getFolders = async (req, res, next) => {
  try {
    const folders = await noteService.getFolders();
    res.status(200).json(new ApiResponse(200, folders, 'Folders retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const folder = await noteService.deleteFolder(req.params.id);
    if (!folder) return next(new ApiError(404, 'Folder not found'));
    res.status(200).json(new ApiResponse(200, null, 'Folder deleted successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

// --- Tags ---
const createTag = async (req, res, next) => {
  try {
    const tag = await noteService.createTag(req.body);
    res.status(201).json(new ApiResponse(201, tag, 'Tag created successfully'));
  } catch (err) {
    next(new ApiError(400, err.message));
  }
};

const getTags = async (req, res, next) => {
  try {
    const tags = await noteService.getTags();
    res.status(200).json(new ApiResponse(200, tags, 'Tags retrieved successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const tag = await noteService.deleteTag(req.params.id);
    if (!tag) return next(new ApiError(404, 'Tag not found'));
    res.status(200).json(new ApiResponse(200, null, 'Tag deleted successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  createFolder,
  getFolders,
  deleteFolder,
  createTag,
  getTags,
  deleteTag
};

const noteService = require('../services/noteService');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

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

const deleteNote = async (req, res, next) => {
  try {
    const note = await noteService.deleteNote(req.params.id);
    if (!note) return next(new ApiError(404, 'Note not found'));
    res.status(200).json(new ApiResponse(200, null, 'Note deleted successfully'));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  createNote,
  getNotes,
  deleteNote,
};

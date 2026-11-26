const noteRepository = require('../repositories/noteRepository');

/**
 * POST /api/v1/notes
 */
exports.createNote = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const note = noteRepository.create(userId, req.body);
    res.status(201).json({ success: true, data: note, message: 'Note created successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes
 */
exports.getNotes = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const notes = noteRepository.findAll(userId);
    res.status(200).json({ success: true, data: notes, message: 'Notes retrieved successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes/:id
 */
exports.getNote = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const note = noteRepository.findById(userId, req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/notes/:id
 */
exports.updateNote = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const note = noteRepository.update(userId, req.params.id, { ...req.body, last_edited: new Date().toISOString() });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    // Emit event for knowledge index refresh
    const eventBus = require('../services/eventBus').eventBus;
    eventBus.publish('NOTE_CHANGED', { type: 'node', operation: 'note.update' }, { noteId: note.id }, userId);

    res.status(200).json({ success: true, data: note, message: 'Note updated successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/notes/:id
 */
exports.deleteNote = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const deleted = noteRepository.delete(userId, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Note not found' });

    const eventBus = require('../services/eventBus').eventBus;
    eventBus.publish('NOTE_CHANGED', { type: 'node', operation: 'note.delete' }, { noteId: req.params.id }, userId);

    res.status(200).json({ success: true, data: { deleted: true }, message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes/search?q=&limit=
 * Search notes using FTS5
 */
exports.searchNotes = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { q, limit } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const results = noteRepository.searchFTS(userId, q, parseInt(limit, 10) || 8);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/notes/search/vector
 * Merge vector search results from Runner with FTS
 */
exports.mergeVectorSearch = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { ids, scores } = req.body;

    if (!Array.isArray(ids) || !Array.isArray(scores) || ids.length !== scores.length) {
      return res.status(400).json({ success: false, message: 'ids and scores arrays required with same length' });
    }

    const vectorResults = ids.map((id, i) => ({ id, score: scores[i], source: 'vector' }));
    const noteRepository = require('../repositories/noteRepository');

    // Get FTS results for the same query (we'd need the query - for now merge with empty FTS)
    // In practice, Runner would call this after doing vector search
    const ftsResults = []; // Would need query to do FTS

    const merged = noteRepository.mergeVectorResults(userId, ftsResults, vectorResults);
    res.status(200).json({ success: true, data: merged });
  } catch (err) {
    next(err);
  }
};

// --- Folders ---
exports.createFolder = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    // Folders would be a separate table - for now return mock
    const folder = { id: require('uuid').v4(), ...req.body, user_id: userId, created_at: new Date().toISOString() };
    res.status(201).json({ success: true, data: folder, message: 'Folder created successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getFolders = async (req, res, next) => {
  try {
    // Return empty for now - folders table not implemented yet
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
};

exports.deleteFolder = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

// --- Tags ---
exports.createTag = async (req, res, next) => {
  try {
    const tag = { id: require('uuid').v4(), ...req.body, created_at: new Date().toISOString() };
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
};

exports.getTags = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
};

exports.deleteTag = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};
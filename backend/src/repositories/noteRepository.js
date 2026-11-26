const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

class NoteRepository extends BaseRepository {
  constructor() {
    super('notes');
  }

  findAll(userId, options = {}) {
    return this.find(userId, { ...options, orderBy: options.orderBy || 'last_edited DESC' });
  }

  searchFTS(userId, query, limit = 8) {
    if (!query || !query.trim()) return [];

    const sanitizedQuery = query.trim().replace(/"/g, '""');
    return all(
      `SELECT n.id, n.title, n.content, n.created_at, n.last_edited,
              snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) as excerpt,
              rank as score
       FROM notes_fts
       JOIN notes n ON notes_fts.note_id = n.id
       WHERE notes_fts MATCH ? AND n.user_id = ?
       ORDER BY rank
       LIMIT ?`,
      [sanitizedQuery, userId, limit]
    );
  }

  mergeVectorResults(userId, ftsResults, vectorResults) {
    // vectorResults: [{ id, score, source: 'vector' }]
    // ftsResults: from searchFTS
    const merged = new Map();

    // Add FTS results
    for (const r of ftsResults) {
      merged.set(r.id, { ...r, source: 'fts', score: r.score || 0 });
    }

    // Merge vector results (higher score wins)
    for (const r of vectorResults) {
      const existing = merged.get(r.id);
      if (!existing || r.score > existing.score) {
        merged.set(r.id, { ...r, source: 'vector' });
      }
    }

    // Sort by score descending
    return Array.from(merged.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8);
  }
}

module.exports = new NoteRepository();
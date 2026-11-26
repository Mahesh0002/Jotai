const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, all, get, transaction } = require('../db');

const MAX_MESSAGES = 200;

class ConversationRepository extends BaseRepository {
  constructor() {
    super('conversations');
  }

  findBySessionId(userId, sessionId) {
    return get(
      `SELECT * FROM conversations WHERE user_id = ? AND session_id = ?`,
      [userId, sessionId]
    );
  }

  getOrCreate(userId, sessionId) {
    let conv = this.findBySessionId(userId, sessionId);
    if (!conv) {
      const id = uuidv4();
      const now = this.now();
      run(
        `INSERT INTO conversations (id, user_id, session_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [id, userId, sessionId, now, now]
      );
      conv = this.findById(userId, id);
    }
    return conv;
  }

  getMessages(conversationId) {
    return all(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );
  }

  addMessage(conversationId, role, content, toolCalls = null) {
    const id = uuidv4();
    const now = this.now();
    run(
      `INSERT INTO messages (id, conversation_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, conversationId, role, content, toolCalls ? JSON.stringify(toolCalls) : null, now]
    );
    // Update conversation updated_at
    run(
      `UPDATE conversations SET updated_at = ? WHERE id = ?`,
      [now, conversationId]
    );
    // Trim old messages
    this.trimMessages(conversationId);
    return { id, conversation_id: conversationId, role, content, tool_calls: toolCalls, created_at: now };
  }

  trimMessages(conversationId) {
    // Keep only the last MAX_MESSAGES messages
    run(
      `DELETE FROM messages WHERE conversation_id = ? AND id NOT IN (
        SELECT id FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
      )`,
      [conversationId, conversationId, MAX_MESSAGES]
    );
  }

  deleteConversation(userId, sessionId) {
    const conv = this.findBySessionId(userId, sessionId);
    if (!conv) return false;
    return this.delete(userId, conv.id);
  }
}

module.exports = new ConversationRepository();
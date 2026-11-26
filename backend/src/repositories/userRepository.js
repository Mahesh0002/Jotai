const BaseRepository = require('./baseRepository');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  findByEmail(email) {
    return get(
      `SELECT * FROM users WHERE id = ?`,
      [email] // Using email as ID for single-user local mode
    );
  }

  createUser(email, username, passwordHash) {
    const id = email; // Use email as ID for local mode
    const now = this.now();
    run(
      `INSERT OR REPLACE INTO users (id, display_name, chronotype, created_at) VALUES (?, ?, ?, ?)`,
      [id, username, 'unknown', now]
    );
    return { id, display_name: username, email, passwordHash };
  }

  verifyUser(email, passwordHash) {
    const user = this.findByEmail(email);
    if (!user || !user.passwordHash) return null;
    // In a real implementation, you'd compare bcrypt hashes
    // For local single-user mode, we'll store passwordHash in a separate table or use preferences
    return user;
  }
}

module.exports = new UserRepository();
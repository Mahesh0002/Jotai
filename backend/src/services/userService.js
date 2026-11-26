const { v4: uuidv4 } = require('uuid');
const { all, run } = require('../db');

const createUser = async (userData) => {
  const id = userData.id || userData.email || uuidv4();
  const now = new Date().toISOString();
  run(
    `INSERT OR REPLACE INTO users (id, display_name, chronotype, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, userData.username || userData.display_name || 'Local User', userData.chronotype || 'unknown', now]
  );
  return { id, username: userData.username || 'Local User', email: userData.email, created_at: now };
};

const getUsers = async () => all(`SELECT * FROM users ORDER BY created_at DESC`);

module.exports = {
  createUser,
  getUsers,
};

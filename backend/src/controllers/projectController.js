const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db');

const userIdOf = (req) => req.userId || 'local_user';

// @desc    Get all projects
// @route   GET /api/v1/projects
exports.getProjects = (req, res, next) => {
  try {
    const projects = all(
      `SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC`,
      [userIdOf(req)]
    );
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/v1/projects
exports.createProject = (req, res, next) => {
  try {
    const id = req.body.id || uuidv4();
    const now = new Date().toISOString();
    const project = {
      name: req.body.name || 'Untitled Project',
      description: req.body.description || '',
      color: req.body.color || '#A855F7',
      status: req.body.status || 'active',
    };
    run(
      `INSERT INTO projects (id, user_id, name, description, color, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userIdOf(req), project.name, project.description, project.color, project.status, now, now]
    );
    res.status(201).json({
      success: true,
      action: 'project.create',
      data: get(`SELECT * FROM projects WHERE id = ?`, [id]),
      ui: { invalidate: ['projects', 'tasks'] },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/v1/projects/:id
exports.getProject = (req, res, next) => {
  try {
    const project = get(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [
      req.params.id,
      userIdOf(req),
    ]);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PATCH /api/v1/projects/:id
exports.updateProject = (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'color', 'status'];
    const keys = allowed.filter((key) => req.body[key] !== undefined);
    const existing = get(`SELECT * FROM projects WHERE id = ? AND user_id = ?`, [
      req.params.id,
      userIdOf(req),
    ]);
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found' });

    if (keys.length) {
      const assignments = keys.map((key) => `${key} = ?`).join(', ');
      run(
        `UPDATE projects SET ${assignments}, updated_at = ? WHERE id = ? AND user_id = ?`,
        [...keys.map((key) => req.body[key]), new Date().toISOString(), req.params.id, userIdOf(req)]
      );
    }
    res.status(200).json({
      success: true,
      data: get(`SELECT * FROM projects WHERE id = ?`, [req.params.id]),
      ui: { invalidate: ['projects', 'tasks'] },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
exports.deleteProject = (req, res, next) => {
  try {
    const result = run(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [
      req.params.id,
      userIdOf(req),
    ]);
    if (!result.changes) return res.status(404).json({ success: false, error: 'Project not found' });
    res.status(200).json({
      success: true,
      data: {},
      ui: { invalidate: ['projects', 'tasks'] },
    });
  } catch (error) {
    next(error);
  }
};

const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  toggleSubtask,
  getNextAction
} = require('../controllers/taskController');
// Local single-user UI routes. The Runner sends its service token, but this
// app has no login flow yet, so enforcing JWT here would break the dashboard.
// See docs/STATUS.md (known limitation: no per-user scoping).
const router = express.Router();

router.get('/next-action', getNextAction);

router
  .route('/')
  .get(getTasks)
  .post(createTask);

router
  .route('/:id')
  .get(getTask)
  .patch(updateTask)
  .delete(deleteTask);

router.post('/:id/complete', completeTask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

module.exports = router;

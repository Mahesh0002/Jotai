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
const serviceAuth = require('../middlewares/serviceAuth');

const router = express.Router();
router.use(serviceAuth);

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

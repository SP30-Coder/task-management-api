const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskValidation, updateTaskValidation } = require('../validators/task.validator');

const router = express.Router();

router.use(protect);

router.route('/').post(createTaskValidation, validate, createTask).get(getTasks);

router
  .route('/:id')
  .get(getTaskById)
  .put(updateTaskValidation, validate, updateTask)
  .delete(deleteTask);

module.exports = router;

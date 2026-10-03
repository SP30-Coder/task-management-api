const mongoose = require('mongoose');
const Task = require('../models/Task');

// @desc    Create a task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      user: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Task created successfully', data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks with search, filter & pagination
// @route   GET /api/tasks?search=&status=&priority=&page=1&limit=10&sortBy=createdAt&sortOrder=desc
const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let { page = 1, limit = 10 } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const filter = { user: req.user._id };

    // Filter by status
    if (status) {
      const validStatuses = ['Pending', 'In Progress', 'Completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed: ${validStatuses.join(', ')}`,
        });
      }
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      const validPriorities = ['Low', 'Medium', 'High'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority filter. Allowed: ${validPriorities.join(', ')}`,
        });
      }
      filter.priority = priority;
    }

    // Search by title / description (case-insensitive)
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'status', 'priority'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const total = await Task.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const tasks = await Task.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: { tasks },
      pagination: {
        total,
        totalPages,
        currentPage,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single task (owner only)
// @route   GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (owner only)
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const task = await Task.findOneAndUpdate({ _id: id, user: req.user._id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task updated successfully', data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task (owner only)
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };

const express = require('express');
const Task = require('../models/Task');
const { taskValidation } = require('../validators/validation');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express.Router();

// Create a new task
router.post('/', [auth, role(['Admin', 'Manager'])], async (req, res) => {
  // Validate task data
  const { error } = taskValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const { title, description, dueDate, priority, assignedTo } = req.body;

  try {
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      createdBy: req.user.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'username');
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update a task
router.put('/:id', [auth, role(['Admin', 'Manager'])], async (req, res) => {
  // Validate task update data
  const { error } = taskValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });
  const { title, description, dueDate, priority, status } = req.body;
  const id = req.params.id; // Access the ID from the URL path
  console.log('Task ID:', id);

  try {
    let task = await Task.findById(id);
    console.log("🚀 ~ router.put ~ task:", task)
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    task = await Task.findByIdAndUpdate(req.params.id, { title, description, dueDate, priority, status }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete a task
router.delete('/:id', [auth, role(['Admin'])], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    await task.remove();
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
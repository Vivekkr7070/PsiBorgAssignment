const express = require('express');
const Task = require('../models/Task');
const { taskValidation } = require('../validators/validation');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express.Router();
const User = require("../models/User")
const { sendVerificationEmailService, sendSMS } = require('../services/notificationService');


/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - dueDate
 *         - priority
 *         - assignedTo
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: The task title
 *         description:
 *           type: string
 *           description: The task description
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date of the task
 *         priority:
 *           type: string
 *           description: The priority level of the task
 *         assignedTo:
 *           type: string
 *           description: The user ID to whom the task is assigned
 *       example:
 *         title: Finish report
 *         description: Complete the monthly report
 *         dueDate: 2024-10-25
 *         priority: High
 *         assignedTo: 60d0fe4f5311236168a109ca
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created and notification sent
 *       400:
 *         description: Invalid task data
 *       500:
 *         description: Server error
 */
// Route to create a new task and send notification
router.post('/', [auth, role(['Admin', 'Manager'])], async (req, res) => {
  // Validate task data
  const { error } = taskValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const { title, description, dueDate, priority, assignedTo, notificationType } = req.body;

  try {
    // Create a new task
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      createdBy: req.user.id
    });
    await task.save();

    // Retrieve assigned user's details for notification
    const user = await User.findById(assignedTo); // Find the user to whom the task is assigned

    //  console.log(user)
    //  return ;

    if (!user) return res.status(404).json({ msg: 'Assigned user not found' });

    // Send notification based on user's preference
    if (notificationType === 'email' && user.email) {
      const subject = 'Task Assigned';
      const message = `You have been assigned a new task: "${task.title}".`;
      await sendVerificationEmailService(user.email, subject, message);
    } else if (notificationType === 'sms' && user.phone) {
      const message = `You have been assigned a new task: "${task.title}".`;
      await sendSMS(user.phone, message);
    } else {
      return res.status(400).json({ msg: 'Invalid notification type or user lacks required contact details' });
    }

    // Respond with the created task and notification status
    res.status(201).json({ task, msg: 'Task created and notification sent' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 *       500:
 *         description: Server error
 */
// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'username');
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});


/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
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


/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task removed
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
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


// Get task statistics by user
router.get('/analytics/user/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  try {
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: { $ne: 'Completed' }, dueDate: { $gte: new Date() } });
    const overdueTasks = await Task.countDocuments({ assignedTo: userId, status: { $ne: 'Completed' }, dueDate: { $lt: new Date() } });

    return res.json({
      user: userId,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Get task statistics for a team (by list of user IDs)
router.get('/analytics/team', auth, async (req, res) => {
  const { team } = req.query; // Assume team IDs are passed as a comma-separated list

  try {
    const teamMembers = team.split(','); // Convert comma-separated string to array

    const completedTasks = await Task.countDocuments({ assignedTo: { $in: teamMembers }, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ assignedTo: { $in: teamMembers }, status: { $ne: 'Completed' }, dueDate: { $gte: new Date() } });
    const overdueTasks = await Task.countDocuments({ assignedTo: { $in: teamMembers }, status: { $ne: 'Completed' }, dueDate: { $lt: new Date() } });

    return res.json({
      team: teamMembers,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.get('/search', auth, async (req, res) => {
  const { status, priority, startDate, endDate, assignedTo, title } = req.query;

  try {
      // Build dynamic query object based on search criteria
      let query = {};

      // Add search filters if provided
      if (status) query.status = status;
      if (priority) query.priority = priority;

      // Filter by due date range if provided
      if (startDate || endDate) {
          query.dueDate = {};
          if (startDate) query.dueDate.$gte = new Date(startDate);
          if (endDate) query.dueDate.$lte = new Date(endDate);
      }

      // Filter by assigned user if provided
      if (assignedTo) query.assignedTo = assignedTo;

      // Partial match for task title (case-insensitive)
      if (title) query.title = { $regex: title, $options: 'i' };

      // Execute query
      const tasks = await Task.find(query).populate('assignedTo', 'username');
      res.json(tasks);

  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

// module.exports = (io) => {

//   // Route to create a new task
//   router.post('/', [auth, role(['Admin', 'Manager'])], async (req, res) => {
//     // Validate task data
//     const { error } = taskValidation(req.body);
//     if (error) return res.status(400).json({ msg: error.details[0].message });

//     const { title, description, dueDate, priority, assignedTo, notificationType } = req.body;

//     try {
//       // Create a new task
//       const task = new Task({
//         title,
//         description,
//         dueDate,
//         priority,
//         assignedTo,
//         createdBy: req.user.id
//       });
//       await task.save();

//       // Retrieve assigned user's details for notification
//       const user = await User.findById(assignedTo);
//       if (!user) return res.status(404).json({ msg: 'Assigned user not found' });

//       // Send notification based on user's preference
//       if (notificationType === 'email' && user.email) {
//         const subject = 'Task Assigned';
//         const message = `You have been assigned a new task: "${task.title}".`;
//         await sendVerificationEmailService(user.email, subject, message);
//       } else if (notificationType === 'sms' && user.phone) {
//         const message = `You have been assigned a new task: "${task.title}".`;
//         await sendSMS(user.phone, message);
//       } else {
//         return res.status(400).json({ msg: 'Invalid notification type or user lacks required contact details' });
//       }

//       // Emit the task creation event to all clients
//       io.emit('taskCreated', task);

//       // Respond with the created task and notification status
//       res.status(201).json({ task, msg: 'Task created and notification sent' });

//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server error');
//     }
//   });

//   // Route to update an existing task
//   router.put('/:id', [auth, role(['Admin', 'Manager'])], async (req, res) => {
//     // Validate task update data
//     const { error } = taskValidation(req.body);
//     if (error) return res.status(400).json({ msg: error.details[0].message });

//     const { title, description, dueDate, priority, status } = req.body;
//     const id = req.params.id;

//     try {
//       let task = await Task.findById(id);
//       if (!task) return res.status(404).json({ msg: 'Task not found' });

//       task = await Task.findByIdAndUpdate(id, { title, description, dueDate, priority, status }, { new: true });

//       // Emit the task update event to all clients
//       io.emit('taskUpdated', task);

//       res.json(task);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server error');
//     }
//   });

//   // Route to delete a task
//   router.delete('/:id', [auth, role(['Admin'])], async (req, res) => {
//     try {
//       const task = await Task.findById(req.params.id);
//       if (!task) return res.status(404).json({ msg: 'Task not found' });

//       await task.remove();

//       // Emit the task deletion event to all clients
//       io.emit('taskDeleted', { taskId: task._id });

//       res.json({ msg: 'Task removed' });
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server error');
//     }
//   });

//   // Route to get all tasks
//   router.get('/', auth, async (req, res) => {
//     try {
//       // Retrieve tasks and populate the 'assignedTo' field with the username
//       const tasks = await Task.find().populate('assignedTo', 'username');
//       res.json(tasks);
//     } catch (err) {
//       console.error(err.message);
//       res.status(500).send('Server error');
//     }
//   });

//   return router;
// };
const Joi = require('joi');

// User Registration Validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Admin', 'Manager', 'User')  // Optional, will be validated if provided
  });
  return schema.validate(data);
};

// User Login Validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

// Task Validation
const taskValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500),
    dueDate: Joi.date(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Low'),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed').default('Pending'),
    assignedTo: Joi.string().optional(),  // Should be the ID of the assigned user, but optional
  });
  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  taskValidation,
};

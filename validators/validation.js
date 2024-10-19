const Joi = require('joi');

// User Registration Validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    // password: Joi.string().min(6).required(),
    phone:Joi.number(),
    password: Joi.string()
      .min(8) // Minimum length of 8 characters
      .max(30) // Optional maximum length
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must have at least one uppercase letter, one lowercase letter, one number, and one special character.',
        'string.min': 'Password should be at least 8 characters long.',
        'string.max': 'Password should not exceed 30 characters.',
        'any.required': 'Password is required.',
      }),
    role: Joi.string().valid('Admin', 'Manager', 'User')  // Optional, will be validated if provided
  });
  return schema.validate(data);
};

// User Login Validation
const loginValidation = (data) => {
  const schema = Joi.object({
    emailOrUsername: Joi.string().required().custom((value, helpers) => {
      // Regular expression to check if the value is an email or username
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex pattern

      // Check if value is either a valid email or a valid username
      if (!emailRegex.test(value) && value.length < 3) {
        // If it's not an email and the username is too short
        return helpers.message('emailOrUsername must be a valid email or at least 3 characters for a username');
      }
      return value; // Valid input
    }),
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
    notificationType: Joi.string().valid('email', 'sms').optional(),  // Valid values: 'email' or 'sms'
  });
  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  taskValidation,
};

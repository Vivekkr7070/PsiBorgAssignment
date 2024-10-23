const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validators/validation');
const auth = require('../middleware/auth');
const router = express.Router();
const { blacklistToken } = require('../middleware/tokenBlacklist')


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - role
 *         - phone
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         role:
 *           type: string
 *           description: The user's role (Admin, Manager, or User)
 *         phone:
 *           type: string
 *           description: The user's phone number
 *       example:
 *         username: johndoe
 *         email: johndoe@example.com
 *         password: strongpassword
 *         role: User
 *         phone: 1234567890
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid user input
 *       500:
 *         description: Server error
 */

// Register user
router.post('/register', async (req, res) => {
    // Validate the user data
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    const { username, email, password, role, phone } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists with this email' });

        // Optionally check if a user already exists with the provided phone number
        if (phone) {
            user = await User.findOne({ phone });
            if (user) return res.status(400).json({ msg: 'User already exists with this phone number' });
        }

        // Create a new user with a specified or default role
        user = new User({ username, email, password, phone, role: role || 'User' });
        await user.save();

        // Generate JWT for user authentication
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ message: 'Server error' });
    }
});



/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */


// Login user
router.post('/login', async (req, res) => {
    try {
        console.log(req.body);

        const { error } = loginValidation(req.body);
        if (error) {
            return res.status(400).json({ msg: 'Invalid login credentials' });
        }

        const { emailOrUsername, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        // Generalize the invalid credentials message to enhance security
        if (!user) {
            return res.status(400).json({ msg: 'Invalid login credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid login credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ token });
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
});


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       500:
 *         description: Server error
 */
router.post('/logout', auth, (req, res) => {
    const token = req.header('Authorization');

    try {
        // Blacklist the token
        blacklistToken(token);

        res.status(200).json({ msg: 'User logged out successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
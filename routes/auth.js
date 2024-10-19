const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validators/validation');
const auth = require('../middleware/auth');
const router = express.Router();
const { blacklistToken } = require('../middleware/tokenBlacklist')

// Register user
router.post('/register', async (req, res) => {
    // Validate the user data
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    const { username, email, password, role, phone } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Create a new user with a specified or default role
        user = new User({ username, email, password, phone, role: role || 'User' });
        await user.save();

        // Generate JWT for user authentication
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Login user
router.post('/login', async (req, res) => {
    // Validate the login data (either email or username)
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });
    const { emailOrUsername, password } = req.body;

    try {
        // Check if the user exists by email or username
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // Compare the password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Generate a JWT token, including user ID and role
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send the token in the response
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

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
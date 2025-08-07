const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); // Import admin middleware

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { db, io, userSocketMap } = req;
    const { username, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const oldSocketId = userSocketMap[user.id];
        if (oldSocketId) {
            io.to(oldSocketId).emit('force_logout', {
                msg: 'You have been logged in from another device.'
            });
        }

        // Add user's role to the JWT payload
        const payload = { user: { id: user.id, role: user.role } }; 
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                // Return user object including their role
                res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/register
// @desc    Register a new user (now requires Admin privileges)
router.post('/register', [auth, adminAuth], async (req, res) => { // <-- SECURE THIS ROUTE
    const { db, io } = req;
    const { username, password, role, status } = req.body;
    try {
        let userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserResult = await db.query(
            'INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING id, username, role, status',
            [username, hashedPassword, role || 'Staff', status || 'Active']
        );
        
        io.emit('users_updated'); // Notify clients that the user list has changed
        res.status(201).json(newUserResult.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

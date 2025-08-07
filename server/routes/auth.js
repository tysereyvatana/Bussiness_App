const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST api/auth/login
// @desc    Authenticate user, get token, and handle multi-device logout
// @access  Public
router.post('/login', async (req, res) => {
    // Destructure dependencies from the request object (passed by middleware in server.js)
    const { db, io, userSocketMap } = req;
    const { username, password } = req.body;

    try {
        // 1. Find the user in the database
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const user = userResult.rows[0];

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. --- Restore the force logout logic ---
        // Check if the user ID already exists in our map of active connections.
        const oldSocketId = userSocketMap[user.id];
        if (oldSocketId) {
            console.log(`User ${user.id} is already connected on socket ${oldSocketId}. Emitting 'force_logout'.`);
            // If they are connected, emit the 'force_logout' event to their old socket.
            io.to(oldSocketId).emit('force_logout', {
                msg: 'You have been logged in from another device.'
            });
        }

        // 4. Create and sign the JSON Web Token
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 }, // Expires in 1 hour
            (err, token) => {
                if (err) throw err;
                // Return the token and user info to the client
                res.json({ token, user: { id: user.id, username: user.username } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { db } = req;
    // --- UPDATE THIS LINE to include role and status ---
    const { username, password, role, status } = req.body;
    try {
        let userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- UPDATE THIS QUERY to insert role and status ---
        // Use provided role/status, or fallback to defaults.
        const newUserResult = await db.query(
            'INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING id, username, role, status',
            [username, hashedPassword, role || 'Staff', status || 'Active']
        );
        
        res.json(newUserResult.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

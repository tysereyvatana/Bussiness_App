const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// @route   POST api/auth/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const db = req.db;
    try {
        const userExists = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user, get token, and log out old sessions
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = req.db;
    const io = req.io;
    const userSocketMap = req.userSocketMap;

    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // --- This is the key logic for single-device login ---
        const oldSocketId = userSocketMap[user.id];
        if (oldSocketId) {
            console.log(`Found old socket ${oldSocketId} for user ${user.id}. Forcing logout.`);
            // Emit a 'force_logout' event directly to the old device's socket
            io.to(oldSocketId).emit('force_logout', { msg: 'You have been logged in from another device.' });
        }
        // --- End of logic ---

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

        res.json({
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

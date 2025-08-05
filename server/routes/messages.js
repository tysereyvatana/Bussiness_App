// server/routes/messages.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/messages
// @desc    Get all messages
// @access  Private
router.get('/', auth, async (req, res) => {
    const db = req.db;
    try {
        const result = await db.query("SELECT id, username, text, created_at FROM messages ORDER BY created_at ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages
// @desc    Post a new message
// @access  Private
router.post('/', auth, async (req, res) => {
    const { username, text } = req.body;
    const db = req.db;
    const io = req.io;

    try {
        const result = await db.query(
            "INSERT INTO messages (username, text) VALUES ($1, $2) RETURNING *",
            [username, text]
        );
        const savedMessage = result.rows[0];

        // Broadcast the new message to all connected clients except the sender
        // The client that sent the message will handle adding it to their own UI
        io.emit('receive_message', savedMessage);

        res.status(201).json(savedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

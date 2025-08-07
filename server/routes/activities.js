const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/activities
// @desc    Get the 10 most recent user activities
// @access  Private
router.get('/', auth, async (req, res) => {
    const { db } = req;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        // Fetches the 10 most recent activities to display in the feed.
        const queryText = `
            SELECT * FROM activities
            ORDER BY created_at DESC
            LIMIT 10;
        `;
        const { rows } = await db.query(queryText);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching activities:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

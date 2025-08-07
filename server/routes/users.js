const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');

// Helper function to log user activities to the database.
const logActivity = async (req, action_type, details) => {
    const { db, io, user } = req;
    try {
        // First, get the username of the admin performing the action.
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [user.id]);
        const adminUsername = userResult.rows[0]?.username || 'Unknown Admin';
        
        // Insert the new activity into the 'activities' table.
        await db.query(
            'INSERT INTO activities (user_id, username, action_type, details) VALUES ($1, $2, $3, $4)',
            [user.id, adminUsername, action_type, details]
        );
        // Notify all clients that a new activity has been logged so the feed can update.
        io.emit('activity_updated');
    } catch (err) {
        console.error('Failed to log activity:', err.message);
    }
};

// Helper function to notify clients that user data has changed.
const notifyClientsOfUpdate = (req) => {
    if (req.io) {
        req.io.emit('users_updated');
        console.log("Emitted 'users_updated' event to all clients.");
    }
};

// --- (The GET routes for roles, statuses, and the user list are unchanged) ---
router.get('/roles', [auth, adminAuth], async (req, res) => {
    const { db } = req;
    try {
        const { rows } = await db.query(`SELECT unnest(enum_range(NULL::user_role)) AS role;`);
        res.json(rows.map(row => row.role));
    } catch (err) {
        console.error('Error fetching user roles:', err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/statuses', [auth, adminAuth], async (req, res) => {
    const { db } = req;
    try {
        const { rows } = await db.query(`SELECT unnest(enum_range(NULL::user_status)) AS status;`);
        res.json(rows.map(row => row.status));
    } catch (err) {
        console.error('Error fetching user statuses:', err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/', auth, async (req, res) => {
    const { db } = req;
    const { search } = req.query;
    try {
        let queryText = `
            SELECT id, username, role, status, created_at, COUNT(*) OVER() as total_count
            FROM users
        `;
        const values = [];
        if (search) {
            queryText += ` WHERE username ILIKE $1`;
            values.push(`%${search}%`);
        }
        queryText += ` ORDER BY created_at DESC;`;
        const { rows } = await db.query(queryText, values);
        
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
        const users = rows.map(row => {
            delete row.total_count;
            return row;
        });
        res.json({ users, total });
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/users/:id
// @desc    Update a user
router.put('/:id', [auth, adminAuth], async (req, res) => {
    const { db } = req;
    const { username, password, role, status } = req.body;
    const userIdToUpdate = req.params.id;

    if (req.user.id === parseInt(userIdToUpdate, 10)) {
        return res.status(403).json({ msg: "Users cannot edit their own account from this page." });
    }

    try {
        let queryText;
        let values;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            queryText = `UPDATE users SET username = $1, password = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, username, role, status;`;
            values = [username, hashedPassword, role, status, userIdToUpdate];
        } else {
            queryText = `UPDATE users SET username = $1, role = $2, status = $3 WHERE id = $4 RETURNING id, username, role, status;`;
            values = [username, role, status, userIdToUpdate];
        }
        
        const { rows } = await db.query(queryText, values);

        if (rows.length > 0) {
            // Log this action
            logActivity(req, 'update_user', `Updated user profile for: ${rows[0].username}`);
            notifyClientsOfUpdate(req);
            res.json(rows[0]);
        } else {
            res.status(404).json({ msg: 'User not found.' });
        }
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
router.delete('/:id', [auth, adminAuth], async (req, res) => {
    const { db } = req;
    const userIdToDelete = req.params.id;

    if (req.user.id === parseInt(userIdToDelete, 10)) {
        return res.status(400).json({ msg: "You cannot delete your own account." });
    }

    try {
        // Get the username before deleting for a better log message
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userIdToDelete]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        const deletedUsername = userResult.rows[0].username;

        const queryText = `DELETE FROM users WHERE id = $1;`;
        const result = await db.query(queryText, [userIdToDelete]);

        if (result.rowCount > 0) {
            // Log this action
            logActivity(req, 'delete_user', `Deleted user: ${deletedUsername}`);
            notifyClientsOfUpdate(req);
            res.json({ msg: 'User removed' });
        } else {
            res.status(404).json({ msg: 'User not found.' });
        }
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

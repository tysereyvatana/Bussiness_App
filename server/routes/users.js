const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');

const notifyClientsOfUpdate = (req) => {
    if (req.io) {
        req.io.emit('users_updated');
        console.log("Emitted 'users_updated' event to all clients.");
    }
};

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

router.delete('/:id', [auth, adminAuth], async (req, res) => {
    const { db } = req;
    const userIdToDelete = req.params.id;

    if (req.user.id === parseInt(userIdToDelete, 10)) {
        return res.status(400).json({ msg: "You cannot delete your own account." });
    }

    try {
        const queryText = `DELETE FROM users WHERE id = $1;`;
        const result = await db.query(queryText, [userIdToDelete]);

        if (result.rowCount > 0) {
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

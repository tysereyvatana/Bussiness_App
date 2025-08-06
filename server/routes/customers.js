// server/routes/customers.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Authentication middleware remains the same
const db = require('../config/db'); // Import the new PostgreSQL db config

// @route   POST api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, email, phone, address, status } = req.body;

    try {
        const queryText = `
            INSERT INTO customers (user_id, name, email, phone, address, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [req.user.id, name, email, phone, address, status];

        const { rows } = await db.query(queryText, values);
        res.json(rows[0]); // Return the newly created customer
    } catch (err) {
        console.error(err.message);
        // Check for unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'A customer with this email already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers
// @desc    Get all customers for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const queryText = `
            SELECT * FROM customers
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(queryText, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { name, email, phone, address, status } = req.body;
    const customerId = req.params.id;

    try {
        const queryText = `
            UPDATE customers
            SET name = $1, email = $2, phone = $3, address = $4, status = $5
            WHERE id = $6 AND user_id = $7
            RETURNING *;
        `;
        const values = [name, email, phone, address, status, customerId, req.user.id];

        const { rows } = await db.query(queryText, values);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'This email is already in use by another one of your customers.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    const customerId = req.params.id;

    try {
        const queryText = `
            DELETE FROM customers
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;
        const values = [customerId, req.user.id];

        const { rows } = await db.query(queryText, values);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }

        res.json({ msg: 'Customer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

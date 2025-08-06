const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your existing authentication middleware

// @route   POST api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', auth, async (req, res) => {
    const { db } = req;
    const { name, email, phone, address, status } = req.body;

    // Add a validation check to ensure the auth middleware worked correctly.
    if (!req.user || !req.user.id) {
        console.error('Authentication error: User ID not found on request in POST /api/customers.');
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        const userId = req.user.id;
        
        const queryText = `
            INSERT INTO customers (user_id, name, email, phone, address, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [userId, name, email, phone, address, status];

        const { rows } = await db.query(queryText, values);
        res.status(201).json(rows[0]); // Return the newly created customer
    } catch (err) {
        console.error('Error creating customer:', err.message);
        if (err.code === '23505') { // Handle unique constraint violation (e.g., duplicate email)
            return res.status(400).json({ msg: 'A customer with this email already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers
// @desc    Get all customers for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    const { db } = req;

    if (!req.user || !req.user.id) {
        console.error('Authentication error: User ID not found on request in GET /api/customers.');
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        const queryText = `
            SELECT * FROM customers
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await db.query(queryText, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching customers:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { db } = req;
    const { name, email, phone, address, status } = req.body;
    const customerId = req.params.id;

    if (!req.user || !req.user.id) {
        console.error('Authentication error: User ID not found on request in PUT /api/customers/:id.');
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        const queryText = `
            UPDATE customers
            SET name = $1, email = $2, phone = $3, address = $4, status = $5, updated_at = NOW()
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
        console.error('Error updating customer:', err.message);
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'This email is already in use by another customer.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    const { db } = req;
    const customerId = req.params.id;

    if (!req.user || !req.user.id) {
        console.error('Authentication error: User ID not found on request in DELETE /api/customers/:id.');
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        const queryText = `
            DELETE FROM customers
            WHERE id = $1 AND user_id = $2;
        `;
        const result = await db.query(queryText, [customerId, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }

        res.json({ msg: 'Customer removed' });
    } catch (err) {
        console.error('Error deleting customer:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

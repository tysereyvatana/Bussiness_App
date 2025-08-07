const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// This helper function will be called to notify all connected clients of a change.
const notifyClientsOfUpdate = (req) => {
    if (req.io) {
        req.io.emit('customers_updated');
        console.log("Emitted 'customers_updated' event to all clients.");
    }
};

// --- ADD THIS NEW ROUTE ---
// @route   GET api/customers/statuses
// @desc    Get all possible customer statuses from the database enum
// @access  Private
router.get('/statuses', auth, async (req, res) => {
    const { db } = req;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        // This query inspects the 'customer_status' type in PostgreSQL and returns its values.
        const queryText = `SELECT unnest(enum_range(NULL::customer_status)) AS status;`;
        const { rows } = await db.query(queryText);
        // The result is an array of objects, so we map it to a simple array of strings.
        const statuses = rows.map(row => row.status);
        res.json(statuses);
    } catch (err) {
        console.error('Error fetching customer statuses:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/customers
// @desc    Create a new customer
router.post('/', auth, async (req, res) => {
    const { db } = req;
    const { name, email, phone, address, status } = req.body;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        const queryText = `
            INSERT INTO customers (user_id, name, email, phone, address, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [req.user.id, name, email, phone, address, status];
        const { rows } = await db.query(queryText, values);
        
        notifyClientsOfUpdate(req);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating customer:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
router.put('/:id', auth, async (req, res) => {
    const { db } = req;
    const { name, email, phone, address, status } = req.body;
    const customerId = req.params.id;
    if (!req.user || !req.user.id) {
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

        if (rows.length > 0) {
            notifyClientsOfUpdate(req);
            res.json(rows[0]);
        } else {
            res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error updating customer:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
router.delete('/:id', auth, async (req, res) => {
    const { db } = req;
    const customerId = req.params.id;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        const queryText = `DELETE FROM customers WHERE id = $1 AND user_id = $2;`;
        const result = await db.query(queryText, [customerId, req.user.id]);

        if (result.rowCount > 0) {
            notifyClientsOfUpdate(req);
            res.json({ msg: 'Customer removed' });
        } else {
            res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error deleting customer:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/customers
// @desc    Get all customers with search and total count
// @access  Private
router.get('/', auth, async (req, res) => {
    const { db } = req;
    const { search } = req.query;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        let queryText = `
            SELECT c.*, u.username as creator_name, COUNT(*) OVER() as total_count
            FROM customers c
            LEFT JOIN users u ON c.user_id = u.id
        `;
        const values = [];

        if (search) {
            queryText += ` WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1`;
            values.push(`%${search}%`);
        }

        queryText += ` ORDER BY c.created_at DESC;`;

        const { rows } = await db.query(queryText, values);
        
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

        const customers = rows.map(row => {
            delete row.total_count;
            return row;
        });

        res.json({ customers, total });

    } catch (err) {
        console.error('Error fetching all customers:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

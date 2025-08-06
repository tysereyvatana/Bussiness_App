const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// This helper function will be called to notify all connected clients of a change.
const notifyClientsOfUpdate = (req) => {
    // req.io is available because we attached it in the server.js middleware
    if (req.io) {
        req.io.emit('customers_updated');
        console.log("Emitted 'customers_updated' event to all clients.");
    }
};

// @route   POST api/customers
// @desc    Create a new customer (This remains unchanged, associates customer with the creator)
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
        
        notifyClientsOfUpdate(req); // Notify clients of the new customer
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating customer:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/customers/:id
// @desc    Update a customer (This remains unchanged, only the owner can edit)
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
            notifyClientsOfUpdate(req); // Notify clients of the update
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
// @desc    Delete a customer (This remains unchanged, only the owner can delete)
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
            notifyClientsOfUpdate(req); // Notify clients of the deletion
            res.json({ msg: 'Customer removed' });
        } else {
            res.status(404).json({ msg: 'Customer not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error deleting customer:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- UPDATE THIS ROUTE ---
// @route   GET api/customers
// @desc    Get all customers with search and total count
// @access  Private
router.get('/', auth, async (req, res) => {
    const { db } = req;
    const { search } = req.query; // Get search term from query parameters

    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        // The SQL query is updated to handle searching and counting.
        let queryText = `
            SELECT c.*, u.username as creator_name, COUNT(*) OVER() as total_count
            FROM customers c
            LEFT JOIN users u ON c.user_id = u.id
        `;
        const values = [];

        if (search) {
            // Add a WHERE clause for searching. ILIKE is case-insensitive.
            queryText += ` WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1`;
            values.push(`%${search}%`); // Add wildcards for partial matching
        }

        queryText += ` ORDER BY c.created_at DESC;`;

        const { rows } = await db.query(queryText, values);
        
        // The total count will be the same for every row, so we can take it from the first.
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

        // We don't want to send the total_count with each customer object.
        const customers = rows.map(row => {
            delete row.total_count;
            return row;
        });

        // Return the data in a new format: { customers, total }
        res.json({ customers, total });

    } catch (err) {
        console.error('Error fetching all customers:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

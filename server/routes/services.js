const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper function to notify all clients of a data change.
const notifyClientsOfUpdate = (req) => {
    if (req.io) {
        req.io.emit('services_updated');
        console.log("Emitted 'services_updated' event to all clients.");
    }
};

// @route   GET api/services
// @desc    Get all services with search and total count
router.get('/', auth, async (req, res) => {
    const { db } = req;
    const { search } = req.query;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        let queryText = `
            SELECT s.*, u.username as creator_name, COUNT(*) OVER() as total_count
            FROM services s
            LEFT JOIN users u ON s.user_id = u.id
        `;
        const values = [];

        if (search) {
            queryText += ` WHERE s.name ILIKE $1 OR s.description ILIKE $1`;
            values.push(`%${search}%`);
        }

        queryText += ` ORDER BY s.created_at DESC;`;
        const { rows } = await db.query(queryText, values);
        
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
        const services = rows.map(row => {
            delete row.total_count;
            return row;
        });

        res.json({ services, total });
    } catch (err) {
        console.error('Error fetching services:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/services
// @desc    Create a new service
router.post('/', auth, async (req, res) => {
    const { db } = req;
    const { name, description, price, status } = req.body;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        const queryText = `
            INSERT INTO services (user_id, name, description, price, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [req.user.id, name, description, price, status];
        const { rows } = await db.query(queryText, values);
        
        notifyClientsOfUpdate(req);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating service:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/services/:id
// @desc    Update a service
router.put('/:id', auth, async (req, res) => {
    const { db } = req;
    const { name, description, price, status } = req.body;
    const serviceId = req.params.id;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        const queryText = `
            UPDATE services
            SET name = $1, description = $2, price = $3, status = $4, updated_at = NOW()
            WHERE id = $5 AND user_id = $6
            RETURNING *;
        `;
        const values = [name, description, price, status, serviceId, req.user.id];
        const { rows } = await db.query(queryText, values);

        if (rows.length > 0) {
            notifyClientsOfUpdate(req);
            res.json(rows[0]);
        } else {
            res.status(404).json({ msg: 'Service not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error updating service:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/services/:id
// @desc    Delete a service
router.delete('/:id', auth, async (req, res) => {
    const { db } = req;
    const serviceId = req.params.id;
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    try {
        const queryText = `DELETE FROM services WHERE id = $1 AND user_id = $2;`;
        const result = await db.query(queryText, [serviceId, req.user.id]);

        if (result.rowCount > 0) {
            notifyClientsOfUpdate(req);
            res.json({ msg: 'Service removed' });
        } else {
            res.status(404).json({ msg: 'Service not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error deleting service:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

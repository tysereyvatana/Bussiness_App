const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper to notify clients of updates via WebSocket
const notifyClients = (req) => {
    if (req.io) {
        req.io.emit('brands_updated');
    }
};

// @route   GET api/item-brands
// @desc    Get all item brands
router.get('/', auth, async (req, res) => {
    try {
        const { rows } = await req.db.query('SELECT * FROM item_brands ORDER BY name');
        res.json({ brands: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/item-brands
// @desc    Add a new item brand
router.post('/', auth, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ msg: 'Please enter a brand name.' });
    }
    try {
        const newBrand = await req.db.query(
            'INSERT INTO item_brands (name, user_id) VALUES ($1, $2) RETURNING *',
            [name, req.user.id]
        );
        notifyClients(req);
        res.status(201).json(newBrand.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/item-brands/:id
// @desc    Update an item brand
router.put('/:id', auth, async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    if (!name) {
        return res.status(400).json({ msg: 'Please enter a brand name.' });
    }
    try {
        const updatedBrand = await req.db.query(
            'UPDATE item_brands SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (updatedBrand.rows.length === 0) {
            return res.status(404).json({ msg: 'Brand not found.' });
        }
        notifyClients(req);
        res.json(updatedBrand.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/item-brands/:id
// @desc    Delete an item brand
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleteRes = await req.db.query('DELETE FROM item_brands WHERE id = $1', [req.params.id]);
        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ msg: 'Brand not found.' });
        }
        notifyClients(req);
        res.json({ msg: 'Brand removed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

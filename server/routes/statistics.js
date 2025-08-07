const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/statistics
// @desc    Get dashboard statistics (total users, customers, services)
// @access  Private
router.get('/', auth, async (req, res) => {
    const { db } = req;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
    }

    try {
        // Use Promise.all to run all count queries concurrently for better performance.
        const [userCount, customerCount, serviceCount] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users;'),
            db.query('SELECT COUNT(*) FROM customers;'),
            db.query('SELECT COUNT(*) FROM services;')
        ]);

        // Construct the response object with the counts.
        const stats = {
            totalUsers: parseInt(userCount.rows[0].count, 10),
            totalCustomers: parseInt(customerCount.rows[0].count, 10),
            totalServices: parseInt(serviceCount.rows[0].count, 10),
        };

        res.json(stats);
    } catch (err)        {
            console.error('Error fetching dashboard statistics:', err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;

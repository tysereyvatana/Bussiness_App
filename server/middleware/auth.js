// server/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token');
    const db = req.db;

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        const result = await db.query("SELECT active_token FROM users WHERE id = $1", [req.user.id]);
        const user = result.rows[0];

        if (!user || user.active_token !== token) {
            return res.status(401).json({ msg: 'Token is not valid (session may have expired or been logged out elsewhere)' });
        }

        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

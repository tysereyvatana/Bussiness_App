const jwt = require('jsonwebtoken');

/**
 * This middleware function intercepts protected API routes to verify the user's authentication.
 * It checks for a JSON Web Token (JWT) in the 'x-auth-token' header.
 */
module.exports = function(req, res, next) {
    // 1. Get the token from the request header.
    const token = req.header('x-auth-token');

    // 2. If no token is found, deny access.
    if (!token) {
        console.error('[Auth Middleware] Access denied. No token provided.');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. --- Enhanced Debugging ---
    // Check if the JWT_SECRET is loaded correctly from your .env file.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL ERROR: JWT_SECRET is not defined in your environment variables. Please check your .env file.');
        return res.status(500).json({ msg: 'Server configuration error: JWT secret is missing.' });
    }

    // 4. Try to verify the token.
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded.user;
        next();
    } catch (err) {
        // 5. If verification fails, log the specific reason.
        console.error('[Auth Middleware] Token verification failed.');
        if (err.name === 'TokenExpiredError') {
            console.error('Reason: Token has expired.');
            return res.status(401).json({ msg: 'Token has expired.' });
        }
        if (err.name === 'JsonWebTokenError') {
            console.error(`Reason: ${err.message}`);
            return res.status(401).json({ msg: 'Token is not valid.' });
        }
        // For any other unexpected errors
        console.error(`An unexpected error occurred: ${err.message}`);
        res.status(401).json({ msg: 'Token is not valid.' });
    }
};

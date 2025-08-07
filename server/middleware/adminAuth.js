/**
 * This middleware runs *after* the standard 'auth' middleware.
 * It checks if the authenticated user has the 'Admin' role.
 * If not, it denies access to the route.
 */
module.exports = function(req, res, next) {
    // The 'auth' middleware should have already attached the user object to the request.
    // The user's role is included in the JWT payload.
    if (req.user && req.user.role === 'Admin') {
        // If the user is an Admin, proceed to the next function in the route handler.
        next();
    } else {
        // If the user is not an Admin, return a 403 Forbidden error.
        console.warn(`[Admin Auth] Forbidden access attempt by user ID: ${req.user ? req.user.id : 'Unknown'}`);
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
};

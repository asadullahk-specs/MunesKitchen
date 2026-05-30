const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in the Authorization header (Matches your Axios interceptor)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fallback: Check for token in cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // If no token is found at all, reject immediately
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, token missing.' });
    }

    try {
        // Verify the token payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the admin using your Sequelize Admin model
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Not authorized, admin user not found.' });
        }

        // Attach the verified admin to BOTH req.user and req.admin to support all controller naming conventions safely
        req.admin = admin;
        req.user = admin;

        next();
    } catch (error) {
        console.error('Auth middleware verification error:', error.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token validation failed.' });
    }
};

module.exports = { protect };
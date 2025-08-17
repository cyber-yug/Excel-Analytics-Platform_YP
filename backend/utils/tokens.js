
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT access token (short-lived)
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
};

// Generate refresh token (long-lived, random string)
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    // Refresh tokens are random strings, verified against database
    return token && token.length === 128; // Basic validation
};

// Get token expiry dates
const getTokenExpiry = () => {
    const accessExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return { accessExpiry, refreshExpiry };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getTokenExpiry
};

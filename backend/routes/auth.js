const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const cloudinary = require('../config/cloudinary');
const { authenticateToken } = require('../middleware/auth');
const { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken, 
    getTokenExpiry 
} = require('../utils/tokens');
const stream = require('stream');

const router = express.Router();

// Multer setup for profile photo upload
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res, token, expiresAt) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        expires: expiresAt
    });
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'profile-photos',
                public_id: `${Date.now()}-${originalName.split('.')[0]}`,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(uploadStream);
    });
};

// POST /auth/signup - Register new user
router.post('/signup', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'All fields are required',
                required: ['username', 'email', 'password', 'firstName', 'lastName']
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({ 
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Handle profile photo upload
        let profilePhoto = null;
        if (req.file) {
            try {
                const cloudResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
                profilePhoto = {
                    url: cloudResult.secure_url,
                    public_id: cloudResult.public_id
                };
            } catch (uploadError) {
                console.error('Profile photo upload failed:', uploadError);
                // Continue without photo rather than failing signup
            }
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            profilePhoto
        });

        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken();
        const { refreshExpiry } = getTokenExpiry();

        // Store refresh token
        const refreshTokenDoc = new RefreshToken({
            token: refreshToken,
            userId: user._id,
            expiresAt: refreshExpiry,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });

        await refreshTokenDoc.save();

        // Set refresh token cookie
        setRefreshTokenCookie(res, refreshToken, refreshExpiry);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
            accessToken
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ error: `${field} already exists` });
        }
        
        res.status(500).json({ 
            error: 'Registration failed',
            details: error.message 
        });
    }
});

// POST /auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { emailOrUsername, password, keepLoggedIn } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({ error: 'Email/username and password are required' });
        }

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername }
            ]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken();
        
        // Determine refresh token expiry based on "keep me logged in"
        const refreshExpiry = keepLoggedIn 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

        // Store refresh token
        const refreshTokenDoc = new RefreshToken({
            token: refreshToken,
            userId: user._id,
            expiresAt: refreshExpiry,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });

        await refreshTokenDoc.save();

        // Set refresh token cookie with appropriate expiry
        setRefreshTokenCookie(res, refreshToken, refreshExpiry);

        res.json({
            success: true,
            message: 'Login successful',
            user,
            accessToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            details: error.message 
        });
    }
});

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken || !verifyRefreshToken(refreshToken)) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Find and validate refresh token
        const tokenDoc = await RefreshToken.findOne({
            token: refreshToken,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('userId');

        if (!tokenDoc || !tokenDoc.userId || !tokenDoc.userId.isActive) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(tokenDoc.userId._id);

        res.json({
            success: true,
            accessToken,
            user: tokenDoc.userId
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ 
            error: 'Token refresh failed',
            details: error.message 
        });
    }
});

// POST /auth/logout - Logout user
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            // Revoke the refresh token
            await RefreshToken.findOneAndUpdate(
                { token: refreshToken },
                { isRevoked: true }
            );
        }

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Logout failed',
            details: error.message 
        });
    }
});

// GET /auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Failed to get user info',
            details: error.message 
        });
    }
});

// Token refresh endpoint removed for now

// Logout endpoint removed for now

// Get current user info endpoint removed for now

// PUT /auth/profile - Update user profile - TEMPORARILY DISABLED
/*
router.put('/profile', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;

        // Handle profile photo update
        if (req.file) {
            try {
                // Delete old photo if exists
                if (req.user.profilePhoto?.public_id) {
                    await cloudinary.uploader.destroy(req.user.profilePhoto.public_id);
                }

                // Upload new photo
                const cloudResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
                updateData.profilePhoto = {
                    url: cloudResult.secure_url,
                    public_id: cloudResult.public_id
                };
            } catch (uploadError) {
                console.error('Profile photo update failed:', uploadError);
                return res.status(400).json({ error: 'Failed to upload profile photo' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            error: 'Profile update failed',
            details: error.message 
        });
    }
});

// DELETE /auth/profile-photo - Remove profile photo
router.delete('/profile-photo', authenticateToken, async (req, res) => {
    try {
        if (req.user.profilePhoto?.public_id) {
            await cloudinary.uploader.destroy(req.user.profilePhoto.public_id);
        }

        await User.findByIdAndUpdate(req.user._id, {
            $unset: { profilePhoto: 1 }
        });

        res.json({
            success: true,
            message: 'Profile photo removed successfully'
        });

    } catch (error) {
        console.error('Profile photo removal error:', error);
        res.status(500).json({ 
            error: 'Failed to remove profile photo',
            details: error.message 
        });
    }
});

// POST /auth/logout-all - Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
    try {
        // Revoke all refresh tokens for this user
        await RefreshToken.updateMany(
            { userId: req.user._id, isRevoked: false },
            { isRevoked: true }
        );

        // Clear current refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        });

        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ 
            error: 'Failed to logout from all devices',
            details: error.message 
        });
    }
});
*/

module.exports = router;

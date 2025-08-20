require('dotenv').config();

// Test Cloudinary configuration at startup
console.log('🌤️  Cloudinary Configuration Check:');
console.log('  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('  API Key:', process.env.CLOUDINARY_API_KEY ? 'SET ✅' : 'NOT SET ❌');
console.log('  API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET ✅' : 'NOT SET ❌');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('./config/cloudinary');
require('dotenv').config();

const uploadRoute = require('./routes/upload');
const analyticsRoute = require('./routes/analytics');
const authRoute = require('./routes/auth');
const User = require('./models/User'); // Use existing User model

const app = express();

// CORS configuration for authentication
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            // Local development
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            // Production Vercel domains (note the correct URL)
            'https://excel-analytics-platform-yp-fronten.vercel.app',
            'https://excel-analytics-platform-yp-frontend.vercel.app',
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // Allow any vercel.app domain for production
        if (origin && origin.includes('.vercel.app')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Configure multer for memory storage (for cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is responding', timestamp: new Date() });
});

// Health check endpoint with Cloudinary status
app.get('/api/health', (req, res) => {
    const health = {
        status: 'OK',
        message: 'Excel Analytics Platform API is running',
        timestamp: new Date(),
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            cloudinary: {
                configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not_set',
                api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not_set',
                api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not_set'
            }
        }
    };
    
    res.json(health);
});

// Cloudinary test endpoint
app.get('/api/test-cloudinary', async (req, res) => {
    try {
        console.log('🌤️  Testing Cloudinary connection...');
        
        // Check configuration
        const config = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
            api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
        };
        
        // Test API ping
        const pingResult = await cloudinary.api.ping();
        
        // Get basic account info
        const resources = await cloudinary.api.resources({ max_results: 1 });
        
        res.json({
            status: 'success',
            message: 'Cloudinary connection is working!',
            config: config,
            ping: pingResult,
            account_accessible: true,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Cloudinary test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Cloudinary connection failed',
            error: error.message,
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
                api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
            },
            timestamp: new Date()
        });
    }
});

// JWT Helper Functions
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// New Authentication Routes

// Register User
app.post('/api/user/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({ 
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email: email.toLowerCase(),
            password,
            firstName,
            lastName
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userResponse
        });

        console.log(`✅ New user registered: ${email}`);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login User
app.post('/api/user/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

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

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });

        console.log(`✅ User logged in: ${user.email}`);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current User
app.get('/api/user/me', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Update User Profile
app.put('/api/user/profile', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
    try {
        const { firstName, lastName, username, email } = req.body;
        const userId = req.user._id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if username or email is being changed and if they're already taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already taken' });
            }
        }

        // Handle profile photo upload
        let profilePhotoUpdate = {};
        if (req.file) {
            try {
                // Delete old photo if exists
                if (user.profilePhoto && user.profilePhoto.public_id) {
                    await cloudinary.uploader.destroy(user.profilePhoto.public_id);
                }

                // Upload new photo to cloudinary
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'excel-profile-photos',
                            resource_type: 'image',
                            transformation: [
                                { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                                { quality: 'auto' }
                            ]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(req.file.buffer);
                });

                profilePhotoUpdate = {
                    profilePhoto: {
                        url: result.secure_url,
                        public_id: result.public_id
                    }
                };
            } catch (uploadError) {
                console.error('Photo upload error:', uploadError);
                return res.status(500).json({ error: 'Failed to upload profile photo' });
            }
        }

        // Update user data
        const updateData = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(username && { username }),
            ...(email && { email: email.toLowerCase() }),
            ...profilePhotoUpdate
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

        console.log(`✅ Profile updated for user: ${updatedUser.email}`);

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get All Users (for testing)
app.get('/api/user/all', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Old routes (keeping for backward compatibility)
app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/analytics', analyticsRoute);

// Connect to MongoDB at startup
console.log('🔄 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB connected successfully");
})
.catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️  Server will continue running without database connection");
    console.log("📝 To fix this issue:");
    console.log("   1. Check your MongoDB Atlas cluster");
    console.log("   2. Add your current IP to the IP whitelist");
    console.log("   3. Verify connection string and credentials");
});

module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

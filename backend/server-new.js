const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://192.168.1.21:5173', 'http://192.168.1.21:5174', 'http://192.168.1.21:3000'],
    credentials: true
}));
app.use(express.json());

// Simple User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcryptjs.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcryptjs.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
})
    .then(() => {
        console.log('✅ MongoDB Atlas connected successfully');
        console.log('📊 Database:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('💡 Trying to continue without database...');
    });

// Routes

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Excel Analytics API is running', timestamp: new Date() });
});

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

// Delete User (for testing)
app.delete('/api/user/:id', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3002; // Changed port to 3002
app.listen(PORT, () => {
    console.log(`🚀 Excel Analytics Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://192.168.1.21:${PORT}/api`);
});

module.exports = app;

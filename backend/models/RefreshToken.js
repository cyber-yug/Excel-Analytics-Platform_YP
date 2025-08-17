const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    userAgent: String,
    ipAddress: String
}, {
    timestamps: true
});

// Clean up expired or revoked tokens
RefreshTokenSchema.statics.cleanup = async function() {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { isRevoked: true }
        ]
    });
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);

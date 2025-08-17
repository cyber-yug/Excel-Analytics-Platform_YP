const mongoose = require('mongoose');

const ExcelDataSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    sheetName: String,
    headers: [String],
    rowCount: {
        type: Number,
        default: 0
    },
    columnCount: {
        type: Number,
        default: 0
    },
    fileSize: Number,
    userId: {
        type: String,
        default: 'anonymous'
    },
    cloudinary: {
        type: new mongoose.Schema({
            url: String,
            public_id: String,
            bytes: Number,
            format: String,
            resource_type: String
        }, { _id: false })
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExcelData', ExcelDataSchema);

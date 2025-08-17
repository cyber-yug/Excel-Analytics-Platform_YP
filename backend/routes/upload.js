const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const ExcelData = require('../models/ExcelData');
const cloudinary = require('../config/cloudinary');
// JWT auth temporarily removed
const stream = require('stream');

const router = express.Router();

// Multer memory storage (we'll upload buffer to Cloudinary)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload and process file
router.post('/', upload.single('file'), async (req, res) => {
    try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Parse workbook from buffer (supports xlsx/xls/csv)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet);

    // Stats from in-memory file
    const fileSize = req.file.size;
        
        // Extract headers
        const headers = Object.keys(sheetData[0] || {});
        
        // Analyze column types and get sample data
        const columnTypes = {};
        const sampleData = sheetData.slice(0, 5); // First 5 rows as sample
        
        headers.forEach(header => {
            const columnData = sheetData
                .map(row => row[header])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (columnData.length === 0) {
                columnTypes[header] = 'unknown';
                return;
            }
            
            // Check if column is numerical
            const isNumerical = columnData.every(val => {
                const parsed = parseFloat(val);
                return !isNaN(parsed) && isFinite(parsed);
            });
            
            // Check if column looks like date
            const isDate = columnData.some(val => {
                const date = new Date(val);
                return !isNaN(date.getTime()) && val.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
            });
            
            if (isNumerical) {
                columnTypes[header] = 'numerical';
            } else if (isDate) {
                columnTypes[header] = 'date';
            } else {
                columnTypes[header] = 'categorical';
            }
        });
        
        // Upload raw file buffer to Cloudinary (resource_type raw)
        const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'excel-uploads';
        const uploadStream = () => new Promise((resolve, reject) => {
            const options = {
                resource_type: 'raw',
                folder,
                // Keep a deterministic public_id; let Cloudinary add extension automatically
                public_id: `${Date.now()}-${path.parse(req.file.originalname).name}`,
                overwrite: true
            };
            const cldStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) return reject(Object.assign(error, { _cloudinaryOptions: options }));
                resolve(result);
            });
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.file.buffer);
            bufferStream.pipe(cldStream);
        });

        const cloudResult = await uploadStream();

        // Save metadata only to database (no sheet data stored in MongoDB)
        const excelDocument = new ExcelData({
            filename: cloudResult.public_id,
            originalName: req.file.originalname,
            sheetName,
            headers,
            rowCount: sheetData.length,
            columnCount: headers.length,
            fileSize,
            userId: req.user?._id || req.body.userId || 'anonymous',
            cloudinary: {
                url: cloudResult.secure_url,
                public_id: cloudResult.public_id,
                bytes: cloudResult.bytes,
                format: cloudResult.format,
                resource_type: cloudResult.resource_type
            }
        });

        await excelDocument.save();

        res.json({
            success: true,
            message: 'File uploaded, processed, and stored successfully',
            fileId: excelDocument._id,
            data: sheetData,
            metadata: {
                filename: req.file.originalname,
                rows: sheetData.length,
                columns: headers.length,
                headers,
                fileSize,
                cloudinaryUrl: cloudResult.secure_url,
                public_id: cloudResult.public_id
            }
        });

    } catch (error) {
        if (error.http_code === 401 || /invalid signature/i.test(error.message || '')) {
            console.error('Cloudinary signature/auth issue. Current config:', cloudinary.config());
        }
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to process or store file',
            details: error.message,
            hint: /invalid signature/i.test(error.message || '') ? 'Verify CLOUDINARY_CLOUD_NAME, API key & secret match your dashboard. Ensure no extra spaces and restart server after editing .env.' : undefined
        });
    }
});

// Get all uploaded files
router.get('/files', async (req, res) => {
    try {
        const query = req.user ? { userId: req.user._id } : {}; // Filter by user if authenticated
        const files = await ExcelData.find(query, {
            data: 0 // Exclude large data field
        }).sort({ uploadDate: -1 });
        
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Get specific file data
router.get('/files/:id', async (req, res) => {
    try {
        const file = await ExcelData.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.json({ file });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch file data' });
    }
});

// Simple Cloudinary config diagnostic (no secrets exposed)
router.get('/ping', (req, res) => {
    const cfg = cloudinary.config();
    res.json({
        ok: true,
        cloud_name: cfg.cloud_name || null,
        has_api_key: !!cfg.api_key
    });
});

module.exports = router;

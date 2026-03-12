// ============================================================
// UPLOAD ROUTES
// Handles image file uploads using Multer
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    uploadImage,
    uploadMultipleImages,
    deleteImage
} = require('../controllers/upload.controller');

const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// MULTER CONFIGURATION
// ============================================================

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    // Where to save files
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    // How to name files: timestamp-originalname
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter: Only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);  // Accept the file
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB max file size
    }
});

// ============================================================
// ROUTES (All require authentication)
// ============================================================

// POST /api/upload/image - Upload single image
router.post('/image', authMiddleware, upload.single('image'), uploadImage);

// POST /api/upload/images - Upload multiple images (max 10)
router.post('/images', authMiddleware, upload.array('images', 10), uploadMultipleImages);

// DELETE /api/upload/image/:filename - Delete an image
router.delete('/image/:filename', authMiddleware, deleteImage);

// ============================================================
// ERROR HANDLER for Multer errors
// ============================================================
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files.'
            });
        }
    }
    
    if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next(err);
});

module.exports = router;
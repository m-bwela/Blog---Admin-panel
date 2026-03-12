// ============================================================
// UPLOAD CONTROLLER
// Handles file uploads (images for posts, avatars, etc.)
// ============================================================

const path = require('path');
const fs = require('fs');

// ============================================================
// UPLOAD SINGLE IMAGE
// Route: POST /api/upload/image
// ============================================================
exports.uploadImage = async (req, res, next) => {
    try {
        // Multer adds the file info to req.file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Build the URL to access the uploaded file
        // Example: http://localhost:5000/uploads/images/1234567890-photo.jpg
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// UPLOAD MULTIPLE IMAGES
// Route: POST /api/upload/images
// ============================================================
exports.uploadMultipleImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided'
            });
        }

        const uploadedImages = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `${req.protocol}://${req.get('host')}/uploads/images/${file.filename}`
        }));

        res.status(201).json({
            success: true,
            message: `${uploadedImages.length} images uploaded successfully`,
            data: uploadedImages
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// DELETE IMAGE
// Route: DELETE /api/upload/image/:filename
// ============================================================
exports.deleteImage = async (req, res, next) => {
    try {
        const { filename } = req.params;

        // Security: Prevent path traversal attacks
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename'
            });
        }

        const filePath = path.join(__dirname, '../../uploads/images', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete the file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
// ============================================================
// TAGS ROUTES
// Same pattern as categories
// ============================================================

const express = require('express');
const router = express.Router();

const {
    getTags,
    getTagBySlug,
    createTag,
    updateTag,
    deleteTag
} = require('../controllers/tags.controllers');

const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// ============================================================
// PUBLIC ROUTES
// ============================================================

// GET /api/tags - List all tags with post counts
router.get('/', getTags);

// GET /api/tags/:slug - Get tag with its posts
router.get('/:slug', getTagBySlug);

// ============================================================
// ADMIN ROUTES
// ============================================================

// POST /api/tags - Create new tag
router.post('/', authMiddleware, adminMiddleware, createTag);

// PUT /api/tags/:id - Update tag
router.put('/:id', authMiddleware, adminMiddleware, updateTag);

// DELETE /api/tags/:id - Delete tag (removes from posts, doesn't delete posts)
router.delete('/:id', authMiddleware, adminMiddleware, deleteTag);

module.exports = router;
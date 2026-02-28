// ============================================================
// CATEGORIES ROUTES
// Maps URL endpoints to controller functions
// ============================================================

// Express is the web framework
// express.Router() creates a modular, mountable route handler
const express = require('express');
const router = express.Router();

// ============================================================
// IMPORT CONTROLLER FUNCTIONS
// ============================================================
// Destructuring import - pulls specific functions from the controller
// This is cleaner than: const controller = require(...); controller.getCategories()
const {
    getCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categories.controllers');

// ============================================================
// IMPORT MIDDLEWARE
// ============================================================
// Middleware = functions that run BEFORE your controller
// They can: check auth, log requests, validate data, etc.

// authMiddleware: Verifies JWT token, attaches req.user
// Without valid token → returns 401 Unauthorized
const authMiddleware = require('../middleware/auth.middleware');

// adminMiddleware: Checks if req.user.role === 'ADMIN'
// Must come AFTER authMiddleware (needs req.user to exist)
// If not admin → returns 403 Forbidden
const adminMiddleware = require('../middleware/admin.middleware');

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================
// Anyone can access these - blog readers, search engines, etc.

// GET /api/categories
// Returns all categories with post counts
// Example: Used by sidebar widget showing category list
router.get('/', getCategories);

// GET /api/categories/:slug
// The :slug is a URL parameter - captures whatever comes after /categories/
// Example: /api/categories/technology → req.params.slug = "technology"
// Returns category details + its published posts
router.get('/:slug', getCategoryBySlug);

// ============================================================
// ADMIN ROUTES (Authentication + Admin role required)
// ============================================================
// Only logged-in admins can access these
// 
// Route execution order: authMiddleware → adminMiddleware → controller
// If any middleware fails, the chain stops and returns an error

// POST /api/categories
// Creates a new category
// Request body: { name: "Technology", description: "Tech posts" }
router.post('/', authMiddleware, adminMiddleware, createCategory);

// PUT /api/categories/:id
// Updates an existing category
// Why :id instead of :slug? IDs are stable, slugs might change during update
// Request body: { name: "New Name", description: "Updated description" }
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);

// DELETE /api/categories/:id
// Deletes a category (posts become uncategorized, not deleted)
// No request body needed - ID comes from URL
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

// ============================================================
// EXPORT ROUTER
// ============================================================
// This router gets mounted in app.js:
// app.use('/api/categories', require('./src/routes/categories.routes'))
//
// So our routes become:
// GET  /api/categories         → getCategories
// GET  /api/categories/:slug   → getCategoryBySlug
// POST /api/categories         → createCategory (admin)
// PUT /api/categories/:id     → updateCategory (admin)
// DELETE /api/categories/:id   → deleteCategory (admin)
module.exports = router;
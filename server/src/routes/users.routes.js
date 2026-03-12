// ============================================================
// USERS ROUTES
// All routes require admin authentication
// ============================================================

const express = require('express');
const router = express.Router();

const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/users.controller');

const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// All routes are admin-only
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/users - List all users with pagination
router.get('/', getUsers);

// GET /api/users/:id - Get single user details
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user (role, status)
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;
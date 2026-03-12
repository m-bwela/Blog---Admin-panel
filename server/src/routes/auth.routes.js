const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route to get current user info
router.get('/me', authMiddleware, getMe);
// Update current user profile
router.put('/me', authMiddleware, updateMe);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostBySlug,
  getAdminPosts,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost,
  updatePostStatus,
} = require('../controllers/posts.controllers');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Public routes
router.get('/', getPosts);
router.get('/:slug', getPostBySlug);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, getAdminPosts);
router.get('/admin/:id', authMiddleware, adminMiddleware, getAdminPostById);
router.post('/admin', authMiddleware, adminMiddleware, createPost);
router.put('/admin/:id', authMiddleware, adminMiddleware, updatePost);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deletePost);
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, updatePostStatus);

module.exports = router;
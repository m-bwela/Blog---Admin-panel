// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Initialize express app
const app = express();

// ===================
// MIDDLEWARE
// ===================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================
// ROUTES
// ===================

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here
 app.use('/api/auth', require('./src/routes/auth.routes'));
 app.use('/api/posts', require('./src/routes/posts.routes'));
 app.use('/api/categories', require('./src/routes/categories.routes'));
 app.use('/api/tags', require('./src/routes/tags.routes'));
 app.use('/api/users', require('./src/routes/users.routes'));
 app.use('/api/upload', require('./src/routes/upload.routes'));

// ===================
// ERROR HANDLING
// ===================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===================
// START SERVER
// ===================
// START SERVER
// ===================


module.exports = app;
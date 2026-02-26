const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📍 Local: http://localhost:${PORT}
  📍 Health: http://localhost:${PORT}/api/health
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

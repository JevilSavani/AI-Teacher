const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const apiRoutes = require('./routes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Custom request logging
app.use(requestLogger);

// Mount API routes
app.use('/api', apiRoutes);

// Root index route
app.get('/', (req, res) => {
  res.json({
    service: 'AI Teacher API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

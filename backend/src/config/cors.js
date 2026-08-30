const config = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.clientOrigin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || config.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;

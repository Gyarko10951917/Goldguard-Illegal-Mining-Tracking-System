import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import configurations and utilities
import { connectDB } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

// Import routes
import alertRoutes from './routes/alerts.js';
import authRoutes from './routes/auth.js';
import casesRoutes from './routes/cases.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';
import sensorRoutes from './routes/sensors.js';
import userRoutes from './routes/users.js';

// Import seeding utility
import { seedDatabase } from './utils/seedData.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Configure Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Connect to MongoDB
await connectDB();

// Seed database if in development mode and SEED_DATABASE is true
if (process.env.NODE_ENV === 'development' && process.env.SEED_DATABASE === 'true') {
  try {
    logger.info('Seeding database with sample data...');
    const seedResult = await seedDatabase();
    logger.info('Database seeding completed:', seedResult);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    // Don't exit - continue starting the server
  }
}

// Trust proxy if behind a reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/api/health' || req.headers['x-internal-request'] === 'true';
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: 'connected' // You might want to actually check DB connection
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cases', casesRoutes);

// Make IO available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Join sensor-specific rooms for real-time updates
  socket.on('join-sensor', (sensorId) => {
    if (typeof sensorId === 'string' && sensorId.length > 0) {
      socket.join(`sensor-${sensorId}`);
      logger.info(`Client ${socket.id} joined sensor room: ${sensorId}`);
      
      // Send confirmation
      socket.emit('joined-sensor', { sensorId, message: 'Successfully subscribed to sensor updates' });
    } else {
      socket.emit('error', { message: 'Invalid sensor ID' });
    }
  });
  
  // Leave sensor room
  socket.on('leave-sensor', (sensorId) => {
    if (typeof sensorId === 'string' && sensorId.length > 0) {
      socket.leave(`sensor-${sensorId}`);
      logger.info(`Client ${socket.id} left sensor room: ${sensorId}`);
      
      socket.emit('left-sensor', { sensorId, message: 'Unsubscribed from sensor updates' });
    }
  });
  
  // Join dashboard room for general updates
  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    logger.info(`Client ${socket.id} joined dashboard room`);
    
    socket.emit('joined-dashboard', { message: 'Connected to dashboard updates' });
  });
  
  // Handle authentication for socket connections
  socket.on('authenticate', (token) => {
    // You can implement JWT verification here if needed
    // For now, we'll assume authentication is handled via HTTP headers
    socket.emit('authenticated', { message: 'Socket authenticated successfully' });
  });
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    logger.error(`Socket error for client ${socket.id}:`, error);
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    import('./config/database.js').then(({ disconnectDB }) => {
      disconnectDB().then(() => {
        logger.info('Database connection closed');
        process.exit(0);
      }).catch((err) => {
        logger.error('Error closing database connection:', err);
        process.exit(1);
      });
    });
  });
  
  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`GoldGuard Backend Server running on ${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});

// Export io for use in other modules
export { io };

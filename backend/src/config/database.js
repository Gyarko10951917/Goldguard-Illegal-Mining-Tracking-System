import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goldguard';
    
    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Sensor readings indexes for time-series optimization
    await db.collection('sensorreadings').createIndexes([
      { key: { sensorId: 1, timestamp: -1 } },
      { key: { timestamp: -1 } },
      { key: { location: "2dsphere" } },
      { key: { "readings.temperature": 1 } },
      { key: { "readings.humidity": 1 } },
      { key: { "readings.airQuality": 1 } },
      { key: { processed: 1 } },
      { key: { quality: 1 } }
    ]);

    // Sensors indexes
    await db.collection('sensors').createIndexes([
      { key: { sensorId: 1 }, unique: true },
      { key: { location: "2dsphere" } },
      { key: { status: 1 } },
      { key: { lastHeartbeat: 1 } },
      { key: { sensorType: 1 } }
    ]);

    // Users indexes
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
      { key: { role: 1 } },
      { key: { status: 1 } },
      { key: { lastLogin: 1 } }
    ]);

    // Alerts indexes
    await db.collection('alerts').createIndexes([
      { key: { sensorId: 1 } },
      { key: { enabled: 1 } },
      { key: { priority: 1 } },
      { key: { lastTriggered: 1 } }
    ]);

    // Alert history indexes
    await db.collection('alerthistories').createIndexes([
      { key: { alertId: 1, triggeredAt: -1 } },
      { key: { sensorId: 1, triggeredAt: -1 } },
      { key: { acknowledged: 1 } },
      { key: { resolved: 1 } }
    ]);

    // Reports indexes
    await db.collection('reports').createIndexes([
      { key: { generatedBy: 1, createdAt: -1 } },
      { key: { type: 1 } },
      { key: { status: 1 } },
      { key: { visibility: 1 } },
      { key: { 'dateRange.start': 1, 'dateRange.end': 1 } }
    ]);

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

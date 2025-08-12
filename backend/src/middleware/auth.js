import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// Authentication middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication server error.'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const hasPermission = req.user.hasPermission(resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${action} on ${resource}`
      });
    }

    next();
  };
};

// Optional authentication (allows both authenticated and unauthenticated requests)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// API key authentication (for sensor data submission)
export const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required.'
      });
    }

    // Find user by API key
    const user = await User.findOne({
      'apiKeys.key': apiKey,
      status: 'active'
    }).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key.'
      });
    }

    // Update API key last used timestamp
    const apiKeyIndex = user.apiKeys.findIndex(key => key.key === apiKey);
    if (apiKeyIndex !== -1) {
      user.apiKeys[apiKeyIndex].lastUsed = new Date();
      await user.save();
    }

    req.user = user;
    req.apiKey = apiKey;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication server error.'
    });
  }
};

// Rate limiting by user
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create user request log
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      const resetTime = Math.ceil((recentRequests[0] + windowMs - now) / 1000);
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Too many requests.',
        retryAfter: resetTime
      });
    }
    
    // Add current request
    recentRequests.push(now);
    userRequests.set(userId, recentRequests);
    
    next();
  };
};

// Admin-only middleware (shorthand for requireRole(['admin']))
export const adminOnly = requireRole(['admin']);

// Officer or higher middleware
export const officerOrHigher = requireRole(['admin', 'officer']);

// Analyst or higher middleware
export const analystOrHigher = requireRole(['admin', 'officer', 'analyst']);

import express from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateLogin, validatePasswordChange, validateUserRegistration } from '../middleware/validation.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but might be restricted in production)
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
  const { username, email, passwordHash, profile, role, preferences } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: existingUser.email === email 
        ? 'Email address already registered' 
        : 'Username already taken'
    });
  }

  // Create new user
  const user = new User({
    username,
    email,
    passwordHash,
    profile,
    role: role || 'viewer',
    preferences: preferences || {},
    status: 'pending' // Require admin approval in production
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  logger.info('User registered successfully', {
    userId: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Account pending approval.',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role,
        status: user.status,
        preferences: user.preferences
      }
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user and verify credentials
    const user = await User.findByCredentials(email, password);

    // Generate token
    const token = generateToken(user._id);

    logger.info('User logged in successfully', {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          status: user.status,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    logger.warn('Login attempt failed', {
      email,
      error: error.message,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
}));

// @route   POST /api/auth/logout
// @desc    Logout user (mainly for logging purposes)
// @access  Private
router.post('/logout', auth, asyncHandler(async (req, res) => {
  logger.info('User logged out', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-passwordHash')
    .populate('createdBy', 'username email');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        role: user.role,
        status: user.status,
        preferences: user.preferences,
        permissions: user.permissions,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy: user.createdBy
      }
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const allowedUpdates = ['profile', 'preferences'];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid updates provided'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');

  logger.info('User profile updated', {
    userId: user._id,
    updates: Object.keys(updates)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, validatePasswordChange, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  logger.info('Password changed successfully', {
    userId: user._id,
    username: user.username
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, asyncHandler(async (req, res) => {
  // Generate new token
  const token = generateToken(req.user.id);

  logger.info('Token refreshed', {
    userId: req.user.id,
    username: req.user.username
  });

  res.json({
    success: true,
    data: { token }
  });
}));

// @route   POST /api/auth/verify-email
// @desc    Verify user email address
// @access  Private
router.post('/verify-email', auth, asyncHandler(async (req, res) => {
  // In a real application, you would implement email verification
  // For now, we'll just mark the user as verified
  
  const user = await User.findById(req.user.id);
  if (user.status === 'pending') {
    user.status = 'active';
    await user.save();
  }

  logger.info('Email verified', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal whether user exists
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // In a real application, you would:
  // 1. Generate a secure reset token
  // 2. Save it to the database with expiration
  // 3. Send email with reset link
  
  logger.info('Password reset requested', {
    email,
    userId: user._id
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
}));

// @route   GET /api/auth/sessions
// @desc    Get user's active sessions (for security dashboard)
// @access  Private
router.get('/sessions', auth, asyncHandler(async (req, res) => {
  // In a production app, you'd track active sessions in Redis
  // For now, return mock data
  
  res.json({
    success: true,
    data: {
      sessions: [
        {
          id: 'current',
          device: req.get('User-Agent'),
          ip: req.ip,
          lastActive: new Date(),
          current: true
        }
      ]
    }
  });
}));

export default router;

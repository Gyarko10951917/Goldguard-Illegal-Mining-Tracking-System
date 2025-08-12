import express from 'express';
import {
    adminOnly,
    auth,
    officerOrHigher
} from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
    validateObjectId,
    validatePagination,
    validateUserRegistration,
    validateUserUpdate
} from '../middleware/validation.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and pagination - REPLACES MOCK DATA
// @access  Private (Admin/Officer)
router.get('/', 
  auth, 
  officerOrHigher, 
  validatePagination,
  asyncHandler(async (req, res) => {
    const { 
      page, 
      limit, 
      role, 
      status, 
      department, 
      search, 
      sortBy = 'createdAt',
      order = 'desc' 
    } = req.query;

    // Build query object
    let query = {};

    // Role filter
    if (role && ['admin', 'officer', 'analyst', 'viewer'].includes(role)) {
      query.role = role;
    }

    // Status filter
    if (status && ['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      query.status = status;
    }

    // Department filter
    if (department) {
      query['profile.department'] = department;
    }

    // Search across multiple fields
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.position': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-passwordHash -apiKeys -twoFactorAuth')
        .populate('createdBy', 'username profile.firstName profile.lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email, // Real email addresses from database
      fullName: `${user.profile.firstName} ${user.profile.lastName}`,
      initials: `${user.profile.firstName?.[0] || ''}${user.profile.lastName?.[0] || ''}`.toUpperCase(),
      role: user.role,
      department: user.profile.department,
      position: user.profile.position,
      status: user.status,
      lastLogin: user.lastLogin,
      avatar: user.profile.avatar,
      phone: user.profile.phone,
      preferences: user.preferences,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy ? {
        name: `${user.createdBy.profile?.firstName || ''} ${user.createdBy.profile?.lastName || ''}`.trim(),
        username: user.createdBy.username
      } : null
    }));

    // Calculate statistics
    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          adminCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } 
          },
          officerCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'officer'] }, 1, 0] } 
          },
          analystCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'analyst'] }, 1, 0] } 
          },
          viewerCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] } 
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users: transformedUsers, // Real user data replacing mock
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1
        },
        stats: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminCount: 0,
          officerCount: 0,
          analystCount: 0,
          viewerCount: 0
        }
      }
    });
  })
);

// @route   GET /api/users/administrators
// @desc    Get current administrators - REPLACES MOCK "Current Administrators"
// @access  Private (Admin/Officer)
router.get('/administrators',
  auth,
  officerOrHigher,
  asyncHandler(async (req, res) => {
    const administrators = await User.find({
      role: { $in: ['admin', 'officer'] },
      status: 'active'
    })
    .select('-passwordHash -apiKeys -twoFactorAuth')
    .sort({ role: 1, 'profile.lastName': 1 })
    .lean();

    const transformedAdministrators = administrators.map(admin => ({
      id: admin._id,
      username: admin.username,
      email: admin.email, // Real email addresses
      fullName: `${admin.profile.firstName} ${admin.profile.lastName}`,
      initials: `${admin.profile.firstName?.[0] || ''}${admin.profile.lastName?.[0] || ''}`.toUpperCase(),
      role: admin.role,
      department: admin.profile.department,
      position: admin.profile.position,
      lastLogin: admin.lastLogin,
      avatar: admin.profile.avatar,
      phone: admin.profile.phone,
      preferences: admin.preferences
    }));

    res.json({
      success: true,
      data: {
        administrators: transformedAdministrators, // Real administrator data
        count: transformedAdministrators.length
      }
    });
  })
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', 
  auth, 
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check permissions - users can view their own profile, officers+ can view others
    if (req.user.id !== id && !['admin', 'officer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(id)
      .select('-passwordHash -apiKeys -twoFactorAuth')
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const transformedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      preferences: user.preferences,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy ? {
        name: `${user.createdBy.profile?.firstName || ''} ${user.createdBy.profile?.lastName || ''}`.trim(),
        username: user.createdBy.username
      } : null
    };

    res.json({
      success: true,
      data: { user: transformedUser }
    });
  })
);

// @route   POST /api/users
// @desc    Create new user - WITH REAL EMAIL VALIDATION
// @access  Private (Admin only)
router.post('/', 
  auth, 
  adminOnly, 
  validateUserRegistration,
  asyncHandler(async (req, res) => {
    const userData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'active' // Admin-created users are active by default
    };

    // Additional email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Check for existing email or username
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === userData.email 
          ? 'Email address already registered' 
          : 'Username already taken'
      });
    }

    const user = new User(userData);
    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    logger.info('New user created by admin', {
      createdUserId: user._id,
      createdUserEmail: user.email,
      createdBy: req.user.id,
      createdByUsername: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  })
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', 
  auth, 
  validateObjectId, 
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check permissions
    const canUpdate = req.user.id === id || 
                     req.user.role === 'admin' || 
                     (req.user.role === 'officer' && req.user.id !== id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions to update this user.'
      });
    }

    // Prevent non-admins from changing roles
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins can change user roles.'
      });
    }

    // Prevent non-admins from changing status
    if (req.body.status && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins can change user status.'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for email conflicts if email is being updated
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email address already in use'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-passwordHash -apiKeys -twoFactorAuth');

    logger.info('User updated', {
      updatedUserId: id,
      updatedBy: req.user.id,
      updatedFields: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  })
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', 
  auth, 
  adminOnly, 
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await User.findByIdAndDelete(id);

    logger.info('User deleted by admin', {
      deletedUserId: id,
      deletedUserEmail: user.email,
      deletedBy: req.user.id,
      deletedByUsername: req.user.username
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

// @route   PUT /api/users/:id/status
// @desc    Update user status
// @access  Private (Admin only)
router.put('/:id/status', 
  auth, 
  adminOnly, 
  validateObjectId,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (active, inactive, suspended, pending)'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('User status updated', {
      userId: id,
      newStatus: status,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user }
    });
  })
);

// @route   GET /api/users/stats
// @desc    Get user statistics - REPLACES MOCK DASHBOARD DATA
// @access  Private (Officer+)
router.get('/stats/overview',
  auth,
  officerOrHigher,
  asyncHandler(async (req, res) => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          inactiveUsers: { 
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } 
          },
          pendingUsers: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          },
          suspendedUsers: { 
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } 
          },
          adminCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } 
          },
          officerCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'officer'] }, 1, 0] } 
          },
          analystCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'analyst'] }, 1, 0] } 
          },
          viewerCount: { 
            $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] } 
          }
        }
      }
    ]);

    // Get recent registrations
    const recentUsers = await User.find({ 
      status: { $ne: 'suspended' } 
    })
    .select('username email profile.firstName profile.lastName role createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    const recentRegistrations = recentUsers.map(user => ({
      id: user._id,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      username: user.username,
      email: user.email,
      role: user.role,
      registeredAt: user.createdAt
    }));

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          pendingUsers: 0,
          suspendedUsers: 0,
          adminCount: 0,
          officerCount: 0,
          analystCount: 0,
          viewerCount: 0
        },
        recentRegistrations, // Real recent registration data
        timestamp: new Date()
      }
    });
  })
);

export default router;

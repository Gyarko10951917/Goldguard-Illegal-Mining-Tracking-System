import express from 'express';
import { adminOnly, auth, officerOrHigher } from '../middleware/auth.js';
import { validateCaseData } from '../middleware/validation.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all cases
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      region,
      priority,
      type,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const cases = await Case.find(filter)
      .populate('reportId', 'reportId fullName phoneNumber email isAnonymous')
      .populate('assignedTo', 'username profile.firstName profile.lastName profile.department')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cases',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get specific case by ID
router.get('/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findOne({ caseId })
      .populate('reportId')
      .populate('assignedTo', 'username profile.firstName profile.lastName profile.department')
      .populate('comments.author', 'username profile.firstName profile.lastName')
      .populate('evidence.uploadedBy', 'username profile.firstName profile.lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseData
    });

  } catch (error) {
    logger.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create a new case (admin only)
router.post('/', auth, adminOnly, validateCaseData, async (req, res) => {
  try {
    const {
      title,
      region,
      type,
      priority,
      description,
      assignedTo,
      location,
      reporter
    } = req.body;

    const caseData = new Case({
      title,
      region,
      type,
      priority,
      description,
      assignedTo,
      location,
      reporter,
      timeline: [{
        action: 'created',
        description: 'Case created manually by admin',
        performedBy: req.user.id
      }]
    });

    await caseData.save();

    // Populate the response
    const populatedCase = await Case.findById(caseData._id)
      .populate('assignedTo', 'username profile.firstName profile.lastName profile.department');

    logger.info(`New case created: ${caseData.caseId} by user ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: populatedCase
    });

  } catch (error) {
    logger.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update case status
router.patch('/:caseId/status', auth, officerOrHigher, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status, comment } = req.body;

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const previousStatus = caseData.status;
    caseData.status = status;

    // Add timeline entry
    caseData.timeline.push({
      action: 'status_changed',
      description: `Status changed from ${previousStatus} to ${status}`,
      performedBy: req.user.id,
      previousValue: previousStatus,
      newValue: status
    });

    // Add comment if provided
    if (comment) {
      caseData.comments.push({
        author: req.user.id,
        content: comment,
        isInternal: true
      });
    }

    // Set resolution date if case is resolved or closed
    if (status === 'Resolved' || status === 'Closed') {
      caseData.resolutionDate = new Date();
    }

    await caseData.save();

    logger.info(`Case ${caseId} status updated to ${status} by user ${req.user.username}`);

    res.json({
      success: true,
      message: 'Case status updated successfully',
      data: {
        caseId: caseData.caseId,
        status: caseData.status,
        resolutionDate: caseData.resolutionDate
      }
    });

  } catch (error) {
    logger.error('Error updating case status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign case to officer
router.patch('/:caseId/assign', auth, officerOrHigher, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { assignedTo, comment } = req.body;

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify the assigned user exists and is an officer or admin
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || !['officer', 'admin'].includes(assignedUser.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment: User must be an officer or admin'
      });
    }

    const previousAssignment = caseData.assignedTo;
    caseData.assignedTo = assignedTo;
    caseData.status = 'In Progress';

    // Add timeline entry
    caseData.timeline.push({
      action: 'assigned',
      description: `Case assigned to ${assignedUser.profile.firstName} ${assignedUser.profile.lastName}`,
      performedBy: req.user.id,
      previousValue: previousAssignment?.toString(),
      newValue: assignedTo
    });

    // Add comment if provided
    if (comment) {
      caseData.comments.push({
        author: req.user.id,
        content: comment,
        isInternal: true
      });
    }

    await caseData.save();

    logger.info(`Case ${caseId} assigned to ${assignedUser.username} by user ${req.user.username}`);

    res.json({
      success: true,
      message: 'Case assigned successfully',
      data: {
        caseId: caseData.caseId,
        assignedTo: {
          id: assignedUser._id,
          username: assignedUser.username,
          name: `${assignedUser.profile.firstName} ${assignedUser.profile.lastName}`,
          department: assignedUser.profile.department
        }
      }
    });

  } catch (error) {
    logger.error('Error assigning case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign case',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add comment to case
router.post('/:caseId/comments', auth, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { content, isInternal = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    caseData.comments.push({
      author: req.user.id,
      content: content.trim(),
      isInternal
    });

    // Add timeline entry
    caseData.timeline.push({
      action: 'comment_added',
      description: isInternal ? 'Internal comment added' : 'Comment added',
      performedBy: req.user.id
    });

    await caseData.save();

    // Populate the new comment
    const populatedCase = await Case.findOne({ caseId })
      .populate('comments.author', 'username profile.firstName profile.lastName');

    const newComment = populatedCase.comments[populatedCase.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });

  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get case analytics
router.get('/analytics/overview', auth, adminOnly, async (req, res) => {
  try {
    const [
      totalCases,
      casesByStatus,
      casesByRegion,
      casesByPriority,
      openCasesByOfficer,
      recentCases
    ] = await Promise.all([
      Case.countDocuments(),
      Case.getCasesByStatus(),
      Case.getCasesByRegion(),
      Case.getCasesByPriority(),
      Case.getOpenCasesByOfficer(),
      Case.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('caseId title region type priority status createdAt')
        .populate('assignedTo', 'profile.firstName profile.lastName')
    ]);

    res.json({
      success: true,
      data: {
        totalCases,
        casesByStatus,
        casesByRegion,
        casesByPriority,
        openCasesByOfficer,
        recentCases
      }
    });

  } catch (error) {
    logger.error('Error fetching case analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available officers for assignment
router.get('/meta/officers', auth, officerOrHigher, async (req, res) => {
  try {
    const officers = await User.find({
      role: { $in: ['officer', 'admin'] },
      status: 'active'
    }).select('_id username profile.firstName profile.lastName profile.department');

    res.json({
      success: true,
      data: officers.map(officer => ({
        id: officer._id,
        username: officer.username,
        name: `${officer.profile.firstName} ${officer.profile.lastName}`,
        department: officer.profile.department
      }))
    });

  } catch (error) {
    logger.error('Error fetching officers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch officers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;

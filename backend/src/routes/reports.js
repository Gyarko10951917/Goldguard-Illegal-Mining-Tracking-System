import express from 'express';
import { adminOnly, auth } from '../middleware/auth.js';
import { validateReportData } from '../middleware/validation.js';
import Case from '../models/Case.js';
import Report from '../models/Report.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Submit a new report
router.post('/submit', validateReportData, async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      region,
      type,
      description,
      affectedArea,
      isAnonymous,
      location,
      evidence
    } = req.body;

    // Map frontend types to backend subject enum values
    const typeToSubjectMap = {
      'Water Pollution': 'Water Pollution',
      'Deforestation': 'Forest Destruction',
      'Mercury Use': 'Environmental Damage',
      'Child Labor': 'Safety Concerns',
      'Illegal Mining (Galamsey)': 'Illegal Mining',
      'Air Pollution': 'Environmental Damage',
      'Land Degradation': 'Land Degradation',
      'Chemical Contamination': 'Environmental Damage',
      'Noise Pollution': 'Environmental Damage',
      'Other': 'Other'
    };

    const mappedSubject = typeToSubjectMap[type] || 'Other';

    // Map frontend data to model schema
    const reportData = {
      fullName: !isAnonymous ? fullName : undefined,
      phoneNumber: !isAnonymous ? phoneNumber : undefined,
      email: !isAnonymous ? email : undefined,
      region,
      subject: mappedSubject, // Map 'type' to 'subject' with enum translation
      message: description, // Map 'description' to 'message'
      isAnonymous,
      location: location ? {
        type: 'Point',
        coordinates: [location.longitude, location.latitude] // [lng, lat] for GeoJSON
      } : undefined,
      attachments: evidence ? evidence.map(item => ({
        filename: item.fileName || 'evidence',
        url: item.fileUrl,
        fileType: item.type
      })) : [],
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer')
      }
    };

    // Create the report
    const report = new Report(reportData);

    await report.save();

    // Map frontend types to case type enum values
    const typeToCaseTypeMap = {
      'Water Pollution': 'Water Pollution',
      'Deforestation': 'Forest Destruction',
      'Mercury Use': 'Environmental',
      'Child Labor': 'Safety',
      'Illegal Mining (Galamsey)': 'Illegal Mining',
      'Air Pollution': 'Environmental',
      'Land Degradation': 'Land Degradation',
      'Chemical Contamination': 'Environmental',
      'Noise Pollution': 'Environmental',
      'Other': 'General'
    };

    const mappedCaseType = typeToCaseTypeMap[type] || 'General';

    // Automatically create a case from this report
    const caseData = {
      title: `${type} - ${region}`,
      region,
      type: mappedCaseType,
      status: 'Open',
      priority: report.priority,
      description: description,
      reportId: report._id,
      location: {
        address: region,
        coordinates: location ? [location.longitude, location.latitude] : undefined
      },
      reporter: {
        type: isAnonymous ? 'anonymous' : 'identified',
        name: !isAnonymous ? fullName : undefined,
        phone: !isAnonymous ? phoneNumber : undefined,
        email: !isAnonymous ? email : undefined,
        anonymous: isAnonymous
      },
      timeline: [{
        action: 'created',
        description: 'Case created from citizen report'
      }]
    };

    const newCase = new Case(caseData);
    await newCase.save();

    logger.info(`New report submitted: ${report.reportId}, Case created: ${newCase.caseId}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.reportId,
      caseId: newCase.caseId,
      data: {
        report: {
          id: report.reportId,
          status: report.status,
          priority: report.priority,
          createdAt: report.createdAt
        },
        case: {
          id: newCase.caseId,
          title: newCase.title,
          status: newCase.status,
          priority: newCase.priority
        }
      }
    });

  } catch (error) {
    logger.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all reports (admin only with filtering and pagination)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      region,
      priority,
      subject,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = subject;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const reports = await Report.find(filter)
      .populate('case')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get specific report by ID
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({ reportId })
      .populate('case');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update report status (admin only)
router.patch('/:reportId/status', auth, adminOnly, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const report = await Report.findOneAndUpdate(
      { reportId },
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    logger.info(`Report ${reportId} status updated to ${status} by user ${req.user.username}`);

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });

  } catch (error) {
    logger.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get report analytics (admin only)
router.get('/analytics/overview', auth, adminOnly, async (req, res) => {
  try {
    const [
      totalReports,
      reportsByRegion,
      reportsByStatus,
      trendingSubjects,
      recentReports
    ] = await Promise.all([
      Report.countDocuments(),
      Report.getReportsByRegion(),
      Report.getReportsByStatus(),
      Report.getTrendingSubjects(30),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('reportId subject region priority status createdAt')
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        reportsByRegion,
        reportsByStatus,
        trendingSubjects,
        recentReports
      }
    });

  } catch (error) {
    logger.error('Error fetching report analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available regions
router.get('/meta/regions', async (req, res) => {
  try {
    const regions = [
      'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Northern',
      'Upper East', 'Upper West', 'Volta', 'Central', 'Brong-Ahafo',
      'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
    ];

    res.json({
      success: true,
      data: regions
    });

  } catch (error) {
    logger.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;

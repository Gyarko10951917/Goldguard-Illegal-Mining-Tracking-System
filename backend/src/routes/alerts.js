import express from 'express';
import { auth, officerOrHigher } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import SensorReading from '../models/SensorReading.js';

const router = express.Router();

// @route   GET /api/alerts
// @desc    Get all alerts from sensor readings - REPLACES MOCK ALERT DATA
// @access  Private (Officer+)
router.get('/', 
  auth,
  officerOrHigher,
  asyncHandler(async (req, res) => {
    const {
      status = 'all', // active, resolved, all
      severity = 'all', // high, medium, low, all
      type = 'all', // temperature_high, air_quality_poor, sensor_offline, all
      region,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Calculate date range (default to last 7 days)
    const now = new Date();
    const defaultStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const dateStart = startDate ? new Date(startDate) : defaultStart;
    const dateEnd = endDate ? new Date(endDate) : now;

    // Build aggregation pipeline to extract alerts from sensor readings
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: dateStart, $lte: dateEnd },
          alertsTriggered: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$alertsTriggered'
      },
      {
        $lookup: {
          from: 'sensors',
          localField: 'sensorId',
          foreignField: 'sensorId',
          as: 'sensorInfo'
        }
      },
      {
        $addFields: {
          sensorInfo: { $arrayElemAt: ['$sensorInfo', 0] },
          severity: {
            $switch: {
              branches: [
                { 
                  case: { $in: ['$alertsTriggered.type', ['temperature_critical', 'air_quality_hazardous']] },
                  then: 'high'
                },
                {
                  case: { $in: ['$alertsTriggered.type', ['temperature_high', 'air_quality_poor', 'sensor_offline']] },
                  then: 'medium'
                },
                {
                  case: { $in: ['$alertsTriggered.type', ['humidity_high', 'battery_low']] },
                  then: 'low'
                }
              ],
              default: 'medium'
            }
          },
          isResolved: false // All alerts from readings are initially unresolved
        }
      }
    ];

    // Add filters
    if (region) {
      pipeline.push({
        $match: { 'sensorInfo.address.region': region }
      });
    }

    if (type !== 'all') {
      pipeline.push({
        $match: { 'alertsTriggered.type': type }
      });
    }

    if (severity !== 'all') {
      pipeline.push({
        $match: { severity: severity }
      });
    }

    if (status !== 'all') {
      const statusFilter = status === 'resolved';
      pipeline.push({
        $match: { isResolved: statusFilter }
      });
    }

    // Add pagination
    pipeline.push(
      { $sort: { timestamp: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    // Project final structure
    pipeline.push({
      $project: {
        id: { $toString: '$_id' },
        alertType: '$alertsTriggered.type',
        severity: 1,
        title: {
          $switch: {
            branches: [
              { 
                case: { $eq: ['$alertsTriggered.type', 'temperature_high'] },
                then: 'High Temperature Alert'
              },
              {
                case: { $eq: ['$alertsTriggered.type', 'air_quality_poor'] },
                then: 'Poor Air Quality Alert'
              },
              {
                case: { $eq: ['$alertsTriggered.type', 'humidity_high'] },
                then: 'High Humidity Alert'
              },
              {
                case: { $eq: ['$alertsTriggered.type', 'sensor_offline'] },
                then: 'Sensor Offline Alert'
              }
            ],
            default: 'Environmental Alert'
          }
        },
        description: {
          $concat: [
            'Alert triggered for sensor ',
            '$sensorId',
            ' - Value: ',
            { $toString: '$alertsTriggered.value' },
            ', Threshold: ',
            { $toString: '$alertsTriggered.threshold' }
          ]
        },
        sensorId: 1,
        sensorName: '$sensorInfo.name',
        location: {
          coordinates: '$sensorInfo.location.coordinates',
          address: '$sensorInfo.address'
        },
        triggeredAt: '$timestamp',
        value: '$alertsTriggered.value',
        threshold: '$alertsTriggered.threshold',
        isResolved: 1,
        resolvedAt: null,
        resolvedBy: null,
        readings: {
          temperature: '$readings.temperature',
          humidity: '$readings.humidity',
          airQuality: '$readings.airQuality'
        },
        metadata: {
          batteryLevel: '$metadata.batteryLevel',
          signalStrength: '$metadata.signalStrength'
        }
      }
    });

    const [alerts, totalPipeline] = await Promise.all([
      SensorReading.aggregate(pipeline),
      SensorReading.aggregate([
        ...pipeline.slice(0, -3), // Remove sort, skip, limit, project
        { $count: 'total' }
      ])
    ]);

    const total = totalPipeline[0]?.total || 0;

    // Get summary statistics
    const summaryPipeline = [
      {
        $match: {
          timestamp: { $gte: dateStart, $lte: dateEnd },
          alertsTriggered: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$alertsTriggered'
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          highSeverity: {
            $sum: {
              $cond: [
                { $in: ['$alertsTriggered.type', ['temperature_critical', 'air_quality_hazardous']] },
                1, 0
              ]
            }
          },
          mediumSeverity: {
            $sum: {
              $cond: [
                { $in: ['$alertsTriggered.type', ['temperature_high', 'air_quality_poor', 'sensor_offline']] },
                1, 0
              ]
            }
          },
          lowSeverity: {
            $sum: {
              $cond: [
                { $in: ['$alertsTriggered.type', ['humidity_high', 'battery_low']] },
                1, 0
              ]
            }
          },
          alertsByType: {
            $push: '$alertsTriggered.type'
          }
        }
      }
    ];

    const summary = await SensorReading.aggregate(summaryPipeline);
    const alertSummary = summary[0] || {
      totalAlerts: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      alertsByType: []
    };

    // Process alert type distribution
    const typeDistribution = {};
    alertSummary.alertsByType.forEach(type => {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        alerts, // Real alerts extracted from sensor readings
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total: total,
          limit: parseInt(limit)
        },
        summary: {
          total: alertSummary.totalAlerts,
          severity: {
            high: alertSummary.highSeverity,
            medium: alertSummary.mediumSeverity,
            low: alertSummary.lowSeverity
          },
          byType: typeDistribution,
          resolved: 0, // Since we don't have resolution tracking yet
          active: alertSummary.totalAlerts
        },
        filters: { status, severity, type, region },
        dateRange: { start: dateStart, end: dateEnd }
      }
    });
  })
);

// @route   GET /api/alerts/dashboard
// @desc    Get alert dashboard data - REAL ALERT METRICS
// @access  Private (Officer+)
router.get('/dashboard',
  auth,
  officerOrHigher,
  asyncHandler(async (req, res) => {
    const { timeRange = '24h' } = req.query;

    // Calculate time range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '1h': startDate = new Date(now - 60 * 60 * 1000); break;
      case '6h': startDate = new Date(now - 6 * 60 * 60 * 1000); break;
      case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now - 24 * 60 * 60 * 1000);
    }

    const [
      alertTrends,
      topSensors,
      regionStats,
      severityTrends
    ] = await Promise.all([
      // Alert trends over time
      getAlertTrends(startDate, now, timeRange),
      
      // Top sensors with most alerts
      getTopAlertSensors(startDate, now),
      
      // Regional alert statistics
      getRegionalAlertStats(startDate, now),
      
      // Severity trends
      getSeverityTrends(startDate, now)
    ]);

    const dashboardData = {
      overview: {
        timeRange,
        dateRange: { start: startDate, end: now },
        totalAlerts: alertTrends.reduce((sum, trend) => sum + trend.count, 0),
        averagePerHour: alertTrends.length > 0 ? 
          Math.round(alertTrends.reduce((sum, trend) => sum + trend.count, 0) / alertTrends.length * 10) / 10 : 0
      },
      trends: {
        timeline: alertTrends,
        severity: severityTrends
      },
      sensors: {
        topAlertSensors: topSensors,
        total: topSensors.length
      },
      regions: {
        distribution: regionStats,
        total: regionStats.length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  })
);

// @route   GET /api/alerts/real-time
// @desc    Get current active alerts for real-time monitoring
// @access  Private (Officer+)
router.get('/real-time',
  auth,
  officerOrHigher,
  asyncHandler(async (req, res) => {
    // Get alerts from last 30 minutes for real-time view
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeAlerts = await SensorReading.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyMinutesAgo },
          alertsTriggered: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$alertsTriggered'
      },
      {
        $lookup: {
          from: 'sensors',
          localField: 'sensorId',
          foreignField: 'sensorId',
          as: 'sensorInfo'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          sensorId: 1,
          sensorName: { $arrayElemAt: ['$sensorInfo.name', 0] },
          alertType: '$alertsTriggered.type',
          value: '$alertsTriggered.value',
          threshold: '$alertsTriggered.threshold',
          location: { $arrayElemAt: ['$sensorInfo.location', 0] },
          region: { $arrayElemAt: ['$sensorInfo.address.region', 0] },
          triggeredAt: '$timestamp',
          severity: {
            $switch: {
              branches: [
                { 
                  case: { $in: ['$alertsTriggered.type', ['temperature_critical', 'air_quality_hazardous']] },
                  then: 'high'
                },
                {
                  case: { $in: ['$alertsTriggered.type', ['temperature_high', 'air_quality_poor']] },
                  then: 'medium'
                }
              ],
              default: 'low'
            }
          }
        }
      },
      { $sort: { triggeredAt: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: {
        alerts: activeAlerts,
        lastUpdate: new Date(),
        count: activeAlerts.length
      }
    });
  })
);

// Helper function to get alert trends over time
const getAlertTrends = async (startDate, endDate, timeRange) => {
  let groupBy;
  
  switch (timeRange) {
    case '1h':
    case '6h':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
      break;
    case '24h':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
      break;
    case '7d':
    case '30d':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
      break;
    default:
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
  }

  const trends = await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        alertsTriggered: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$alertsTriggered'
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        highSeverity: {
          $sum: {
            $cond: [
              { $in: ['$alertsTriggered.type', ['temperature_critical', 'air_quality_hazardous']] },
              1, 0
            ]
          }
        },
        mediumSeverity: {
          $sum: {
            $cond: [
              { $in: ['$alertsTriggered.type', ['temperature_high', 'air_quality_poor']] },
              1, 0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    }
  ]);

  return trends.map(trend => ({
    timestamp: new Date(
      trend._id.year,
      trend._id.month - 1,
      trend._id.day,
      trend._id.hour || 0
    ),
    count: trend.count,
    severity: {
      high: trend.highSeverity,
      medium: trend.mediumSeverity,
      low: trend.count - trend.highSeverity - trend.mediumSeverity
    }
  }));
};

// Helper function to get top sensors with most alerts
const getTopAlertSensors = async (startDate, endDate) => {
  return await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        alertsTriggered: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$alertsTriggered'
    },
    {
      $group: {
        _id: '$sensorId',
        alertCount: { $sum: 1 },
        lastAlert: { $max: '$timestamp' },
        alertTypes: { $addToSet: '$alertsTriggered.type' }
      }
    },
    {
      $lookup: {
        from: 'sensors',
        localField: '_id',
        foreignField: 'sensorId',
        as: 'sensorInfo'
      }
    },
    {
      $project: {
        sensorId: '$_id',
        name: { $arrayElemAt: ['$sensorInfo.name', 0] },
        location: { $arrayElemAt: ['$sensorInfo.address', 0] },
        alertCount: 1,
        lastAlert: 1,
        alertTypes: 1
      }
    },
    { $sort: { alertCount: -1 } },
    { $limit: 10 }
  ]);
};

// Helper function to get regional alert statistics
const getRegionalAlertStats = async (startDate, endDate) => {
  return await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        alertsTriggered: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$alertsTriggered'
    },
    {
      $lookup: {
        from: 'sensors',
        localField: 'sensorId',
        foreignField: 'sensorId',
        as: 'sensorInfo'
      }
    },
    {
      $group: {
        _id: { $arrayElemAt: ['$sensorInfo.address.region', 0] },
        alertCount: { $sum: 1 },
        uniqueSensors: { $addToSet: '$sensorId' },
        alertTypes: { $addToSet: '$alertsTriggered.type' }
      }
    },
    {
      $project: {
        region: '$_id',
        alertCount: 1,
        sensorCount: { $size: '$uniqueSensors' },
        alertTypes: 1
      }
    },
    { $sort: { alertCount: -1 } }
  ]);
};

// Helper function to get severity trends
const getSeverityTrends = async (startDate, endDate) => {
  const trends = await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        alertsTriggered: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$alertsTriggered'
    },
    {
      $addFields: {
        severity: {
          $switch: {
            branches: [
              { 
                case: { $in: ['$alertsTriggered.type', ['temperature_critical', 'air_quality_hazardous']] },
                then: 'high'
              },
              {
                case: { $in: ['$alertsTriggered.type', ['temperature_high', 'air_quality_poor']] },
                then: 'medium'
              }
            ],
            default: 'low'
          }
        }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  return trends.reduce((acc, trend) => {
    acc[trend._id] = trend.count;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
};

export default router;

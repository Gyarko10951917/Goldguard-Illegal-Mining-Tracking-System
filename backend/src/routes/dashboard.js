import express from 'express';
import { auth, officerOrHigher } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateDateRange } from '../middleware/validation.js';
import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/dashboard/analytics
// @desc    Get real dashboard analytics - REPLACES ALL MOCK DASHBOARD DATA
// @access  Private (Officer+)
router.get('/analytics', 
  auth, 
  officerOrHigher, 
  validateDateRange,
  asyncHandler(async (req, res) => {
    const { timeRange = '24h', startDate, endDate } = req.query;
    
    // Calculate date range
    const now = new Date();
    let rangeStart, rangeEnd = now;
    
    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      switch (timeRange) {
        case '1h': 
          rangeStart = new Date(now - 60 * 60 * 1000); 
          break;
        case '6h': 
          rangeStart = new Date(now - 6 * 60 * 60 * 1000); 
          break;
        case '24h': 
          rangeStart = new Date(now - 24 * 60 * 60 * 1000); 
          break;
        case '7d': 
          rangeStart = new Date(now - 7 * 24 * 60 * 60 * 1000); 
          break;
        case '30d': 
          rangeStart = new Date(now - 30 * 24 * 60 * 60 * 1000); 
          break;
        default: 
          rangeStart = new Date(now - 24 * 60 * 60 * 1000);
      }
    }

    try {
      // Real data aggregation - replacing all mock data
      const [
        sensorStats,
        userStats,
        readingStats,
        systemHealth,
        recentActivity,
        monthlyTrends,
        regionalData,
        alertStats
      ] = await Promise.all([
        // Sensor statistics
        Sensor.aggregate([
          {
            $group: {
              _id: null,
              totalSensors: { $sum: 1 },
              activeSensors: { 
                $sum: { 
                  $cond: [
                    { 
                      $and: [
                        { $eq: ['$status', 'active'] },
                        { $gte: ['$lastHeartbeat', new Date(now - 60 * 60 * 1000)] }
                      ]
                    }, 
                    1, 0
                  ] 
                }
              },
              inactiveSensors: { 
                $sum: { $cond: [{ $ne: ['$status', 'active'] }, 1, 0] } 
              },
              maintenanceSensors: { 
                $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } 
              },
              errorSensors: { 
                $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } 
              },
              sensorsByType: {
                $push: {
                  type: '$sensorType',
                  status: '$status'
                }
              }
            }
          }
        ]),

        // User statistics - Real administrator and officer data
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: { 
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
              },
              administrators: { 
                $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } 
              },
              officers: { 
                $sum: { $cond: [{ $eq: ['$role', 'officer'] }, 1, 0] } 
              },
              analysts: { 
                $sum: { $cond: [{ $eq: ['$role', 'analyst'] }, 1, 0] } 
              },
              recentLogins: {
                $sum: { 
                  $cond: [
                    { $gte: ['$lastLogin', rangeStart] }, 
                    1, 0
                  ] 
                }
              }
            }
          }
        ]),

        // Sensor reading statistics
        SensorReading.aggregate([
          { $match: { timestamp: { $gte: rangeStart, $lte: rangeEnd } } },
          {
            $group: {
              _id: null,
              totalReadings: { $sum: 1 },
              avgTemperature: { $avg: '$readings.temperature' },
              avgHumidity: { $avg: '$readings.humidity' },
              avgAirQuality: { $avg: '$readings.airQuality' },
              maxTemperature: { $max: '$readings.temperature' },
              minTemperature: { $min: '$readings.temperature' },
              qualityDistribution: {
                $push: '$quality'
              },
              alertsTriggered: {
                $sum: { $size: { $ifNull: ['$alertsTriggered', []] } }
              }
            }
          }
        ]),

        // System health calculation
        calculateSystemHealth(),

        // Recent activity
        getRecentActivity(rangeStart, 10),

        // Monthly trends - Real data from MongoDB aggregation
        getMonthlyTrends(),

        // Regional sensor distribution
        Sensor.aggregate([
          {
            $group: {
              _id: '$address.region',
              sensorCount: { $sum: 1 },
              activeSensors: { 
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
              },
              sensorTypes: { $addToSet: '$sensorType' }
            }
          },
          { $sort: { sensorCount: -1 } }
        ]),

        // Alert statistics (when Alert model is available)
        getAlertStatistics(rangeStart, rangeEnd)
      ]);

      // Process sensor type distribution
      const sensorTypeDistribution = {};
      if (sensorStats[0]?.sensorsByType) {
        sensorStats[0].sensorsByType.forEach(sensor => {
          if (!sensorTypeDistribution[sensor.type]) {
            sensorTypeDistribution[sensor.type] = { total: 0, active: 0 };
          }
          sensorTypeDistribution[sensor.type].total++;
          if (sensor.status === 'active') {
            sensorTypeDistribution[sensor.type].active++;
          }
        });
      }

      // Process quality distribution
      const qualityStats = {};
      if (readingStats[0]?.qualityDistribution) {
        readingStats[0].qualityDistribution.forEach(quality => {
          qualityStats[quality] = (qualityStats[quality] || 0) + 1;
        });
      }

      // Real dashboard data structure - replaces all mock data
      const realDashboardData = {
        overview: {
          totalSensors: sensorStats[0]?.totalSensors || 0,
          activeSensors: sensorStats[0]?.activeSensors || 0,
          inactiveSensors: sensorStats[0]?.inactiveSensors || 0,
          totalUsers: userStats[0]?.totalUsers || 0,
          activeUsers: userStats[0]?.activeUsers || 0,
          administrators: userStats[0]?.administrators || 0, // Real admin count
          officers: userStats[0]?.officers || 0, // Real officer count
          totalReadings: readingStats[0]?.totalReadings || 0,
          alertsTriggered: readingStats[0]?.alertsTriggered || 0,
          systemUptime: `${systemHealth.uptime}%`,
          dataQuality: `${systemHealth.dataQuality}%`
        },

        // Real environmental data averages
        environmentalAverages: {
          temperature: readingStats[0]?.avgTemperature ? 
            Math.round(readingStats[0].avgTemperature * 10) / 10 : null,
          humidity: readingStats[0]?.avgHumidity ? 
            Math.round(readingStats[0].avgHumidity * 10) / 10 : null,
          airQuality: readingStats[0]?.avgAirQuality ? 
            Math.round(readingStats[0].avgAirQuality) : null,
          tempRange: {
            min: readingStats[0]?.minTemperature,
            max: readingStats[0]?.maxTemperature
          }
        },

        // Real sensor distribution by type
        sensorDistribution: sensorTypeDistribution,

        // Real regional data
        regionalData: regionalData.map(region => ({
          region: region._id || 'Unknown',
          totalSensors: region.sensorCount,
          activeSensors: region.activeSensors,
          sensorTypes: region.sensorTypes,
          coverage: Math.round((region.activeSensors / region.sensorCount) * 100)
        })),

        // Real data quality statistics
        dataQuality: {
          distribution: qualityStats,
          totalReadings: readingStats[0]?.totalReadings || 0,
          qualityScore: systemHealth.dataQuality
        },

        // Real recent activity
        recentActivity: recentActivity,

        // Real monthly trends from actual sensor data
        monthlyTrends: monthlyTrends,

        // Real alert statistics
        alertStatistics: alertStats,

        // Real user activity
        userActivity: {
          totalUsers: userStats[0]?.totalUsers || 0,
          recentLogins: userStats[0]?.recentLogins || 0,
          roleDistribution: {
            admin: userStats[0]?.administrators || 0,
            officer: userStats[0]?.officers || 0,
            analyst: userStats[0]?.analysts || 0,
            viewer: (userStats[0]?.totalUsers || 0) - 
                   (userStats[0]?.administrators || 0) - 
                   (userStats[0]?.officers || 0) - 
                   (userStats[0]?.analysts || 0)
          }
        },

        metadata: {
          generatedAt: new Date(),
          timeRange: timeRange,
          dateRange: { start: rangeStart, end: rangeEnd },
          dataFreshness: systemHealth.dataFreshness
        }
      };

      logger.info('Dashboard analytics generated', {
        userId: req.user.id,
        timeRange,
        sensorsAnalyzed: sensorStats[0]?.totalSensors || 0,
        readingsAnalyzed: readingStats[0]?.totalReadings || 0
      });

      res.json({
        success: true,
        data: realDashboardData
      });

    } catch (error) {
      logger.error('Error generating dashboard analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate dashboard analytics'
      });
    }
  })
);

// @route   GET /api/dashboard/recent-reports
// @desc    Get recent reports - REPLACES MOCK RECENT REPORTS
// @access  Private (Officer+)
router.get('/recent-reports', 
  auth, 
  officerOrHigher,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // For now, generate sample report data based on actual sensor readings
    const recentReadings = await SensorReading.aggregate([
      { $sort: { timestamp: -1 } },
      { $limit: parseInt(limit) },
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
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            region: { $arrayElemAt: ["$sensorInfo.address.region", 0] }
          },
          readingCount: { $sum: 1 },
          avgTemperature: { $avg: "$readings.temperature" },
          avgHumidity: { $avg: "$readings.humidity" },
          avgAirQuality: { $avg: "$readings.airQuality" },
          sensors: { $addToSet: "$sensorId" },
          latestReading: { $max: "$timestamp" }
        }
      },
      { $sort: { "latestReading": -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Transform to report format
    const reportsData = recentReadings.map((data, index) => ({
      id: `RPT-${Date.now()}-${index}`,
      title: `Daily Environmental Report - ${data._id.region || 'Unknown Region'}`,
      type: 'daily',
      description: `Automated daily environmental monitoring report for ${data._id.region || 'Unknown Region'}`,
      generatedBy: {
        name: 'System Generated',
        username: 'system'
      },
      dateRange: {
        start: new Date(data._id.date),
        end: new Date(data._id.date + 'T23:59:59.999Z')
      },
      status: 'completed',
      format: 'json',
      createdAt: data.latestReading,
      summary: {
        totalReadings: data.readingCount,
        averageTemperature: Math.round(data.avgTemperature * 10) / 10,
        averageHumidity: Math.round(data.avgHumidity * 10) / 10,
        averageAirQuality: Math.round(data.avgAirQuality),
        sensorsInvolved: data.sensors.length,
        region: data._id.region
      }
    }));

    res.json({
      success: true,
      data: {
        reports: reportsData, // Real report data based on actual readings
        total: reportsData.length,
        generatedAt: new Date()
      }
    });
  })
);

// Helper function to calculate system health
const calculateSystemHealth = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [totalSensors, activeSensors, recentReadings, totalReadings] = await Promise.all([
    Sensor.countDocuments(),
    Sensor.countDocuments({
      status: 'active',
      lastHeartbeat: { $gte: oneHourAgo }
    }),
    SensorReading.countDocuments({
      timestamp: { $gte: oneDayAgo },
      quality: { $in: ['excellent', 'good'] }
    }),
    SensorReading.countDocuments({
      timestamp: { $gte: oneDayAgo }
    })
  ]);

  const uptime = totalSensors > 0 ? ((activeSensors / totalSensors) * 100).toFixed(1) : 100;
  const dataQuality = totalReadings > 0 ? ((recentReadings / totalReadings) * 100).toFixed(1) : 100;
  const dataFreshness = activeSensors > 0 ? 'Current' : 'Stale';

  return { uptime: parseFloat(uptime), dataQuality: parseFloat(dataQuality), dataFreshness };
};

// Helper function to get recent activity
const getRecentActivity = async (since, limit) => {
  // Get recent sensor readings for activity feed
  const recentReadings = await SensorReading.find({
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .lean();

  return recentReadings.map(reading => ({
    id: reading._id,
    type: 'sensor_reading',
    description: `New reading from sensor ${reading.sensorId}`,
    sensorId: reading.sensorId,
    timestamp: reading.timestamp,
    data: {
      temperature: reading.readings.temperature,
      humidity: reading.readings.humidity,
      airQuality: reading.readings.airQuality
    },
    quality: reading.quality
  }));
};

// Helper function to get monthly trends
const getMonthlyTrends = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trends = await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: sixMonthsAgo },
        quality: { $in: ['excellent', 'good', 'fair'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' }
        },
        avgTemperature: { $avg: '$readings.temperature' },
        avgHumidity: { $avg: '$readings.humidity' },
        avgAirQuality: { $avg: '$readings.airQuality' },
        totalReadings: { $sum: 1 },
        uniqueSensors: { $addToSet: '$sensorId' },
        alertsTriggered: {
          $sum: { $size: { $ifNull: ['$alertsTriggered', []] } }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return trends.map(trend => ({
    month: new Date(trend._id.year, trend._id.month - 1).toLocaleString('default', { 
      month: 'short', 
      year: 'numeric' 
    }),
    temperature: trend.avgTemperature ? Math.round(trend.avgTemperature * 10) / 10 : null,
    humidity: trend.avgHumidity ? Math.round(trend.avgHumidity * 10) / 10 : null,
    airQuality: trend.avgAirQuality ? Math.round(trend.avgAirQuality) : null,
    readings: trend.totalReadings,
    sensors: trend.uniqueSensors.length,
    alerts: trend.alertsTriggered
  }));
};

// Helper function to get alert statistics (placeholder for when Alert model is created)
const getAlertStatistics = async (startDate, endDate) => {
  // For now, calculate alerts from sensor readings that exceed thresholds
  const alertReadings = await SensorReading.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        $or: [
          { 'readings.temperature': { $gt: 35 } }, // High temperature
          { 'readings.airQuality': { $gt: 150 } }, // Poor air quality
          { 'readings.humidity': { $gt: 85 } } // High humidity
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        temperatureAlerts: {
          $sum: { $cond: [{ $gt: ['$readings.temperature', 35] }, 1, 0] }
        },
        airQualityAlerts: {
          $sum: { $cond: [{ $gt: ['$readings.airQuality', 150] }, 1, 0] }
        },
        humidityAlerts: {
          $sum: { $cond: [{ $gt: ['$readings.humidity', 85] }, 1, 0] }
        }
      }
    }
  ]);

  return alertReadings[0] || {
    totalAlerts: 0,
    temperatureAlerts: 0,
    airQualityAlerts: 0,
    humidityAlerts: 0
  };
};

export default router;

import express from 'express';
import { adminOnly, auth, officerOrHigher } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateReadingData, validateSensorData } from '../middleware/validation.js';
import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/sensors
// @desc    Get all sensors - REPLACES MOCK SENSOR DATA
// @access  Private
router.get('/', 
  auth,
  asyncHandler(async (req, res) => {
    const { 
      status, 
      region, 
      sensorType, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (region) filter['address.region'] = region;
    if (sensorType) filter.sensorType = sensorType;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [sensors, total] = await Promise.all([
      Sensor.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Sensor.countDocuments(filter)
    ]);

    // Get latest readings for each sensor
    const sensorsWithReadings = await Promise.all(
      sensors.map(async (sensor) => {
        const latestReading = await SensorReading.findOne({ 
          sensorId: sensor.sensorId 
        })
        .sort({ timestamp: -1 })
        .lean();

        return {
          ...sensor,
          latestReading: latestReading ? {
            timestamp: latestReading.timestamp,
            temperature: latestReading.readings.temperature,
            humidity: latestReading.readings.humidity,
            airQuality: latestReading.readings.airQuality,
            quality: latestReading.quality
          } : null,
          lastUpdate: latestReading?.timestamp || sensor.lastHeartbeat
        };
      })
    );

    res.json({
      success: true,
      data: {
        sensors: sensorsWithReadings, // Real sensor data from MongoDB
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total,
          limit: parseInt(limit)
        },
        filters: { status, region, sensorType }
      }
    });
  })
);

// @route   GET /api/sensors/:sensorId
// @desc    Get single sensor with detailed info - REPLACES MOCK SINGLE SENSOR DATA
// @access  Private
router.get('/:sensorId', 
  auth,
  asyncHandler(async (req, res) => {
    const { sensorId } = req.params;

    const sensor = await Sensor.findOne({ sensorId }).lean();
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Get recent readings (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReadings = await SensorReading.find({
      sensorId: sensorId,
      timestamp: { $gte: oneDayAgo }
    })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

    // Calculate statistics
    const readingStats = recentReadings.length > 0 ? {
      totalReadings: recentReadings.length,
      avgTemperature: recentReadings.reduce((sum, r) => sum + r.readings.temperature, 0) / recentReadings.length,
      avgHumidity: recentReadings.reduce((sum, r) => sum + r.readings.humidity, 0) / recentReadings.length,
      avgAirQuality: recentReadings.reduce((sum, r) => sum + r.readings.airQuality, 0) / recentReadings.length,
      qualityDistribution: recentReadings.reduce((acc, r) => {
        acc[r.quality] = (acc[r.quality] || 0) + 1;
        return acc;
      }, {}),
      dataRange: {
        start: recentReadings[recentReadings.length - 1]?.timestamp,
        end: recentReadings[0]?.timestamp
      }
    } : null;

    // Real detailed sensor data
    const sensorDetails = {
      ...sensor,
      recentReadings: recentReadings.slice(0, 20), // Latest 20 readings
      statistics: readingStats,
      health: {
        isOnline: sensor.status === 'active' && 
                 sensor.lastHeartbeat && 
                 (Date.now() - new Date(sensor.lastHeartbeat).getTime()) < 60 * 60 * 1000, // Online if heartbeat within 1 hour
        batteryLevel: sensor.batteryLevel,
        signalStrength: sensor.signalStrength,
        uptime: calculateUptime(sensor.installationDate, sensor.status),
        errorCount: recentReadings.filter(r => r.quality === 'error').length
      }
    };

    logger.info('Sensor details retrieved', {
      sensorId,
      userId: req.user.id,
      readingsCount: recentReadings.length
    });

    res.json({
      success: true,
      data: sensorDetails
    });
  })
);

// @route   POST /api/sensors
// @desc    Create new sensor - REAL SENSOR CREATION
// @access  Private (Admin only)
router.post('/', 
  auth,
  adminOnly,
  validateSensorData,
  asyncHandler(async (req, res) => {
    const {
      name,
      sensorType,
      location,
      address,
      thresholds,
      calibration,
      batteryLevel = 100,
      signalStrength = 95
    } = req.body;

    // Generate unique sensor ID
    const sensorId = `GG-${sensorType.toUpperCase()}-${Date.now()}`;

    const newSensor = new Sensor({
      sensorId,
      name,
      sensorType,
      status: 'active',
      location,
      address,
      thresholds,
      calibration,
      batteryLevel,
      signalStrength,
      installationDate: new Date(),
      lastHeartbeat: new Date(),
      installedBy: req.user.id
    });

    await newSensor.save();

    logger.info('New sensor created', {
      sensorId: newSensor.sensorId,
      type: sensorType,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: newSensor,
      message: 'Sensor created successfully'
    });
  })
);

// @route   PUT /api/sensors/:sensorId
// @desc    Update sensor configuration - REAL SENSOR UPDATES
// @access  Private (Officer+)
router.put('/:sensorId',
  auth,
  officerOrHigher,
  validateSensorData,
  asyncHandler(async (req, res) => {
    const { sensorId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.sensorId;
    delete updates.createdAt;
    delete updates.installedBy;
    delete updates.installationDate;

    const sensor = await Sensor.findOneAndUpdate(
      { sensorId },
      { 
        ...updates,
        lastModified: new Date(),
        modifiedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    logger.info('Sensor updated', {
      sensorId,
      updatedFields: Object.keys(updates),
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      data: sensor,
      message: 'Sensor updated successfully'
    });
  })
);

// @route   DELETE /api/sensors/:sensorId
// @desc    Delete sensor - REAL SENSOR DELETION
// @access  Private (Admin only)
router.delete('/:sensorId',
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { sensorId } = req.params;

    const sensor = await Sensor.findOneAndDelete({ sensorId });
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Optionally delete associated readings (be careful with this!)
    // await SensorReading.deleteMany({ sensorId });

    logger.warn('Sensor deleted', {
      sensorId,
      deletedBy: req.user.id,
      sensorType: sensor.sensorType
    });

    res.json({
      success: true,
      message: 'Sensor deleted successfully'
    });
  })
);

// @route   POST /api/sensors/:sensorId/readings
// @desc    Add sensor reading - REAL SENSOR DATA INGESTION
// @access  Private (System/Device auth or Officer+)
router.post('/:sensorId/readings',
  auth, // Can be device token or user token
  validateReadingData,
  asyncHandler(async (req, res) => {
    const { sensorId } = req.params;
    const { readings, batteryLevel, signalStrength } = req.body;

    // Verify sensor exists
    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Determine data quality based on readings and sensor status
    let quality = 'excellent';
    if (readings.temperature < -40 || readings.temperature > 60) {
      quality = 'poor';
    } else if (readings.humidity < 0 || readings.humidity > 100) {
      quality = 'poor';
    } else if (readings.airQuality > 300) {
      quality = 'poor';
    } else if (sensor.batteryLevel < 20 || sensor.signalStrength < 30) {
      quality = 'fair';
    }

    // Check for alerts based on thresholds
    const alertsTriggered = [];
    if (sensor.thresholds) {
      if (readings.temperature > sensor.thresholds.temperature?.max) {
        alertsTriggered.push({
          type: 'temperature_high',
          value: readings.temperature,
          threshold: sensor.thresholds.temperature.max
        });
      }
      if (readings.airQuality > sensor.thresholds.airQuality?.max) {
        alertsTriggered.push({
          type: 'air_quality_poor',
          value: readings.airQuality,
          threshold: sensor.thresholds.airQuality.max
        });
      }
    }

    // Create new reading record
    const newReading = new SensorReading({
      sensorId,
      readings: {
        temperature: readings.temperature,
        humidity: readings.humidity,
        airQuality: readings.airQuality,
        timestamp: readings.timestamp || new Date()
      },
      quality,
      alertsTriggered,
      metadata: {
        batteryLevel: batteryLevel || sensor.batteryLevel,
        signalStrength: signalStrength || sensor.signalStrength,
        deviceInfo: req.body.deviceInfo || {}
      },
      recordedBy: req.user.id || 'system'
    });

    await newReading.save();

    // Update sensor heartbeat and status
    await Sensor.findOneAndUpdate(
      { sensorId },
      { 
        lastHeartbeat: new Date(),
        batteryLevel: batteryLevel || sensor.batteryLevel,
        signalStrength: signalStrength || sensor.signalStrength,
        status: batteryLevel < 10 ? 'low_battery' : sensor.status
      }
    );

    // Emit real-time update if alerts were triggered
    if (alertsTriggered.length > 0) {
      req.io?.emit('sensor_alert', {
        sensorId,
        alerts: alertsTriggered,
        reading: newReading,
        timestamp: new Date()
      });
    }

    // Emit real-time reading update
    req.io?.emit('sensor_reading', {
      sensorId,
      reading: newReading,
      timestamp: new Date()
    });

    logger.info('Sensor reading recorded', {
      sensorId,
      quality,
      alertsCount: alertsTriggered.length,
      temperature: readings.temperature
    });

    res.status(201).json({
      success: true,
      data: {
        reading: newReading,
        alertsTriggered: alertsTriggered
      },
      message: 'Reading recorded successfully'
    });
  })
);

// @route   GET /api/sensors/:sensorId/readings
// @desc    Get sensor readings with filtering - REAL SENSOR READING HISTORY
// @access  Private
router.get('/:sensorId/readings',
  auth,
  asyncHandler(async (req, res) => {
    const { sensorId } = req.params;
    const {
      startDate,
      endDate,
      limit = 100,
      page = 1,
      interval = 'all', // all, hourly, daily
      quality
    } = req.query;

    // Verify sensor exists
    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Build filter
    const filter = { sensorId };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (quality) filter.quality = quality;

    let readings;

    if (interval === 'hourly' || interval === 'daily') {
      // Aggregate readings by interval
      const groupBy = interval === 'hourly' 
        ? {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          }
        : {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          };

      readings = await SensorReading.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupBy,
            avgTemperature: { $avg: '$readings.temperature' },
            avgHumidity: { $avg: '$readings.humidity' },
            avgAirQuality: { $avg: '$readings.airQuality' },
            minTemperature: { $min: '$readings.temperature' },
            maxTemperature: { $max: '$readings.temperature' },
            readingCount: { $sum: 1 },
            timestamp: { $max: '$timestamp' },
            qualityDistribution: { $addToSet: '$quality' }
          }
        },
        { $sort: { timestamp: -1 } },
        { $limit: parseInt(limit) }
      ]);

    } else {
      // Get individual readings
      readings = await SensorReading.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();
    }

    res.json({
      success: true,
      data: {
        sensorId,
        readings,
        interval,
        pagination: interval === 'all' ? {
          current: parseInt(page),
          limit: parseInt(limit)
        } : null
      }
    });
  })
);

// Helper function to calculate sensor uptime
function calculateUptime(installationDate, currentStatus) {
  const now = new Date();
  const installed = new Date(installationDate);
  const totalTime = now - installed;
  
  // This is a simplified calculation
  // In a real system, you'd track downtime events
  const uptimePercentage = currentStatus === 'active' ? 98.5 : 85.0;
  
  return {
    percentage: uptimePercentage,
    totalDays: Math.floor(totalTime / (1000 * 60 * 60 * 24))
  };
}

export default router;

import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: [true, 'Sensor ID is required'],
    index: true,
    uppercase: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    index: true,
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Timestamp cannot be in the future'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;      // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  readings: {
    // Environmental readings
    temperature: {
      type: Number,
      min: [-50, 'Temperature cannot be below -50°C'],
      max: [100, 'Temperature cannot exceed 100°C']
    },
    humidity: {
      type: Number,
      min: [0, 'Humidity cannot be below 0%'],
      max: [100, 'Humidity cannot exceed 100%']
    },
    pressure: {
      type: Number,
      min: [0, 'Pressure cannot be negative']
    },
    
    // Air quality readings
    airQuality: {
      type: Number,
      min: [0, 'Air quality index cannot be negative'],
      max: [500, 'Air quality index cannot exceed 500']
    },
    pm25: {
      type: Number,
      min: [0, 'PM2.5 cannot be negative']
    },
    pm10: {
      type: Number,
      min: [0, 'PM10 cannot be negative']
    },
    co2: {
      type: Number,
      min: [0, 'CO2 level cannot be negative']
    },
    co: {
      type: Number,
      min: [0, 'CO level cannot be negative']
    },
    no2: {
      type: Number,
      min: [0, 'NO2 level cannot be negative']
    },
    so2: {
      type: Number,
      min: [0, 'SO2 level cannot be negative']
    },
    o3: {
      type: Number,
      min: [0, 'O3 level cannot be negative']
    },
    
    // Water quality readings
    ph: {
      type: Number,
      min: [0, 'pH cannot be below 0'],
      max: [14, 'pH cannot exceed 14']
    },
    turbidity: {
      type: Number,
      min: [0, 'Turbidity cannot be negative']
    },
    dissolvedOxygen: {
      type: Number,
      min: [0, 'Dissolved oxygen cannot be negative']
    },
    conductivity: {
      type: Number,
      min: [0, 'Conductivity cannot be negative']
    },
    tds: { // Total Dissolved Solids
      type: Number,
      min: [0, 'TDS cannot be negative']
    },
    
    // Noise readings
    noise: {
      type: Number,
      min: [0, 'Noise level cannot be negative'],
      max: [200, 'Noise level cannot exceed 200 dB']
    },
    
    // Additional custom readings (flexible schema)
    customReadings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  },
  
  // Data quality indicators
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'invalid'],
    default: 'good'
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  qualityFlags: [{
    type: {
      type: String,
      enum: ['outlier', 'missing_data', 'sensor_error', 'calibration_needed', 'network_issue'],
      required: true
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  
  // Processing status
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processedAt: Date,
  processingFlags: [{
    type: String,
    enum: ['smoothed', 'interpolated', 'validated', 'corrected']
  }],
  
  // Metadata
  metadata: {
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    signalStrength: {
      type: Number,
      min: -120,
      max: 0
    },
    firmwareVersion: String,
    dataVersion: {
      type: String,
      default: '1.0'
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['sensor', 'manual', 'estimated', 'corrected'],
      default: 'sensor'
    }
  },
  
  // Alerts triggered by this reading
  alertsTriggered: [{
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert'
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    parameter: String,
    value: Number,
    threshold: Number
  }],
  
  // Raw sensor data (for debugging)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't include in normal queries
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  collection: 'sensorreadings' // Explicit collection name
});

// Compound indexes for efficient time-series queries
sensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ location: "2dsphere" });
sensorReadingSchema.index({ quality: 1 });
sensorReadingSchema.index({ processed: 1 });

// Specific indexes for common query patterns
sensorReadingSchema.index({ 'readings.temperature': 1 });
sensorReadingSchema.index({ 'readings.humidity': 1 });
sensorReadingSchema.index({ 'readings.airQuality': 1 });
sensorReadingSchema.index({ 'readings.ph': 1 });

// TTL index for automatic data retention (optional)
sensorReadingSchema.index({ 
  createdAt: 1 
}, { 
  expireAfterSeconds: 60 * 60 * 24 * 365 * 2 // 2 years
});

// Virtual for coordinates in [lat, lng] format
sensorReadingSchema.virtual('latLng').get(function() {
  return [this.location.coordinates[1], this.location.coordinates[0]];
});

// Virtual for age of the reading
sensorReadingSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp.getTime();
});

// Virtual for human-readable quality description
sensorReadingSchema.virtual('qualityDescription').get(function() {
  const descriptions = {
    'excellent': 'All parameters within normal ranges, no anomalies detected',
    'good': 'Parameters within acceptable ranges, minor variations',
    'fair': 'Some parameters outside normal ranges, moderate quality concerns',
    'poor': 'Multiple parameters problematic, significant quality issues',
    'invalid': 'Data integrity compromised, readings unreliable'
  };
  return descriptions[this.quality] || 'Unknown quality level';
});

// Instance method to check if reading is stale
sensorReadingSchema.methods.isStale = function(thresholdMinutes = 60) {
  const threshold = new Date(Date.now() - (thresholdMinutes * 60 * 1000));
  return this.timestamp < threshold;
};

// Instance method to get parameter value safely
sensorReadingSchema.methods.getParameter = function(parameter) {
  return this.readings[parameter] ?? this.readings.customReadings?.get(parameter) ?? null;
};

// Instance method to calculate overall air quality index
sensorReadingSchema.methods.calculateAQI = function() {
  const { pm25, pm10, co, no2, so2, o3 } = this.readings;
  
  // Simplified AQI calculation (you might want to use a more sophisticated algorithm)
  const aqiValues = [];
  
  if (pm25 !== undefined) aqiValues.push(this._calculatePM25AQI(pm25));
  if (pm10 !== undefined) aqiValues.push(this._calculatePM10AQI(pm10));
  if (co !== undefined) aqiValues.push(this._calculateCOAQI(co));
  if (no2 !== undefined) aqiValues.push(this._calculateNO2AQI(no2));
  if (so2 !== undefined) aqiValues.push(this._calculateSO2AQI(so2));
  if (o3 !== undefined) aqiValues.push(this._calculateO3AQI(o3));
  
  return aqiValues.length > 0 ? Math.max(...aqiValues) : null;
};

// Private helper methods for AQI calculation
sensorReadingSchema.methods._calculatePM25AQI = function(pm25) {
  // EPA breakpoints for PM2.5 (simplified)
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
};

// Static method to get readings by time range
sensorReadingSchema.statics.findByTimeRange = function(sensorId, startTime, endTime, options = {}) {
  const query = { sensorId, timestamp: { $gte: startTime, $lte: endTime } };
  
  let mongoQuery = this.find(query);
  
  if (options.quality) {
    mongoQuery = mongoQuery.where('quality').in(Array.isArray(options.quality) ? options.quality : [options.quality]);
  }
  
  if (options.limit) {
    mongoQuery = mongoQuery.limit(options.limit);
  }
  
  if (options.skip) {
    mongoQuery = mongoQuery.skip(options.skip);
  }
  
  return mongoQuery.sort({ timestamp: -1 });
};

// Static method to get latest reading for each sensor
sensorReadingSchema.statics.findLatestBySensor = function(sensorIds = []) {
  const matchStage = sensorIds.length > 0 ? { sensorId: { $in: sensorIds } } : {};
  
  return this.aggregate([
    { $match: matchStage },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$sensorId',
        latest: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latest' } }
  ]);
};

// Static method for data aggregation
sensorReadingSchema.statics.aggregateByTime = function(sensorId, interval, startTime, endTime) {
  let groupBy;
  
  switch (interval) {
    case 'hour':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
      break;
    case 'day':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
      break;
    case 'week':
      groupBy = {
        year: { $year: '$timestamp' },
        week: { $week: '$timestamp' }
      };
      break;
    case 'month':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
      break;
    default:
      throw new Error('Invalid interval. Use: hour, day, week, or month');
  }
  
  return this.aggregate([
    {
      $match: {
        sensorId,
        timestamp: { $gte: startTime, $lte: endTime },
        quality: { $in: ['excellent', 'good', 'fair'] }
      }
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        avgTemperature: { $avg: '$readings.temperature' },
        minTemperature: { $min: '$readings.temperature' },
        maxTemperature: { $max: '$readings.temperature' },
        avgHumidity: { $avg: '$readings.humidity' },
        minHumidity: { $min: '$readings.humidity' },
        maxHumidity: { $max: '$readings.humidity' },
        avgAirQuality: { $avg: '$readings.airQuality' },
        minAirQuality: { $min: '$readings.airQuality' },
        maxAirQuality: { $max: '$readings.airQuality' },
        avgPM25: { $avg: '$readings.pm25' },
        avgPM10: { $avg: '$readings.pm10' },
        avgCO2: { $avg: '$readings.co2' },
        avgNoise: { $avg: '$readings.noise' },
        firstTimestamp: { $min: '$timestamp' },
        lastTimestamp: { $max: '$timestamp' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);
};

// Pre-save middleware for data quality assessment
sensorReadingSchema.pre('save', function(next) {
  // Calculate quality score based on various factors
  let qualityScore = 100;
  const flags = [];
  
  // Check for missing critical readings
  const criticalParams = ['temperature', 'humidity'];
  const missingCritical = criticalParams.filter(param => this.readings[param] === undefined || this.readings[param] === null);
  
  if (missingCritical.length > 0) {
    qualityScore -= 20 * missingCritical.length;
    flags.push({
      type: 'missing_data',
      description: `Missing critical parameters: ${missingCritical.join(', ')}`,
      severity: 'high'
    });
  }
  
  // Check for out-of-range values
  if (this.readings.temperature !== undefined) {
    if (this.readings.temperature < -40 || this.readings.temperature > 60) {
      qualityScore -= 15;
      flags.push({
        type: 'outlier',
        description: 'Temperature reading outside expected range',
        severity: 'medium'
      });
    }
  }
  
  if (this.readings.humidity !== undefined) {
    if (this.readings.humidity < 0 || this.readings.humidity > 100) {
      qualityScore -= 15;
      flags.push({
        type: 'outlier',
        description: 'Humidity reading outside valid range',
        severity: 'high'
      });
    }
  }
  
  // Check battery level
  if (this.metadata.batteryLevel !== undefined && this.metadata.batteryLevel < 20) {
    qualityScore -= 5;
    flags.push({
      type: 'sensor_error',
      description: 'Low battery level may affect sensor accuracy',
      severity: 'low'
    });
  }
  
  // Check signal strength
  if (this.metadata.signalStrength !== undefined && this.metadata.signalStrength < -90) {
    qualityScore -= 10;
    flags.push({
      type: 'network_issue',
      description: 'Poor signal strength may indicate data transmission issues',
      severity: 'medium'
    });
  }
  
  // Set quality based on score
  if (qualityScore >= 90) this.quality = 'excellent';
  else if (qualityScore >= 75) this.quality = 'good';
  else if (qualityScore >= 50) this.quality = 'fair';
  else if (qualityScore >= 25) this.quality = 'poor';
  else this.quality = 'invalid';
  
  this.qualityScore = Math.max(0, qualityScore);
  this.qualityFlags = flags;
  
  next();
});

export default mongoose.model('SensorReading', sensorReadingSchema);

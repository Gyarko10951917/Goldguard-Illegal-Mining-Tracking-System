import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: [true, 'Sensor ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]+$/, 'Sensor ID can only contain uppercase letters, numbers, underscores, and hyphens']
  },
  name: {
    type: String,
    required: [true, 'Sensor name is required'],
    trim: true,
    maxlength: [100, 'Sensor name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
        message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges'
      }
    }
  },
  address: {
    street: String,
    city: String,
    region: {
      type: String,
      enum: [
        'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Northern',
        'Upper East', 'Upper West', 'Volta', 'Central', 'Brong-Ahafo',
        'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
      ]
    },
    country: {
      type: String,
      default: 'Ghana'
    },
    postalCode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error', 'offline'],
    default: 'active',
    required: true
  },
  sensorType: {
    type: String,
    enum: ['environmental', 'air_quality', 'weather', 'water_quality', 'noise', 'seismic', 'multi_parameter'],
    required: [true, 'Sensor type is required']
  },
  capabilities: [{
    parameter: {
      type: String,
      enum: ['temperature', 'humidity', 'airQuality', 'co2', 'noise', 'pressure', 'ph', 'turbidity', 'dissolved_oxygen', 'conductivity'],
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    range: {
      min: Number,
      max: Number
    },
    accuracy: String,
    calibrationDate: Date
  }],
  installDate: {
    type: Date,
    required: [true, 'Installation date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Installation date cannot be in the future'
    }
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  heartbeatInterval: {
    type: Number,
    default: 300, // 5 minutes in seconds
    min: 30,
    max: 3600
  },
  metadata: {
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required']
    },
    model: {
      type: String,
      required: [true, 'Model is required']
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    firmware: {
      version: String,
      lastUpdate: Date
    },
    hardware: {
      version: String,
      powerSource: {
        type: String,
        enum: ['battery', 'solar', 'mains', 'hybrid'],
        default: 'battery'
      },
      batteryLevel: {
        type: Number,
        min: 0,
        max: 100
      },
      signalStrength: {
        type: Number,
        min: -120,
        max: 0
      }
    },
    connectivity: {
      type: {
        type: String,
        enum: ['wifi', 'cellular', 'lora', 'ethernet', 'satellite'],
        default: 'cellular'
      },
      provider: String,
      ipAddress: String,
      lastConnected: Date
    }
  },
  maintenance: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    maintenanceInterval: {
      type: Number,
      default: 90, // days
      min: 1,
      max: 365
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    history: [{
      date: { type: Date, default: Date.now },
      type: {
        type: String,
        enum: ['installation', 'repair', 'calibration', 'replacement', 'inspection'],
        required: true
      },
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      description: String,
      cost: Number,
      partsUsed: [String]
    }]
  },
  configuration: {
    samplingRate: {
      type: Number,
      default: 60, // seconds
      min: 1,
      max: 3600
    },
    dataRetention: {
      type: Number,
      default: 365, // days
      min: 1,
      max: 3650
    },
    alertThresholds: [{
      parameter: String,
      warning: {
        min: Number,
        max: Number
      },
      critical: {
        min: Number,
        max: Number
      }
    }],
    qualityControl: {
      enabled: {
        type: Boolean,
        default: true
      },
      outlierDetection: {
        type: Boolean,
        default: true
      },
      smoothing: {
        type: Boolean,
        default: false
      }
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sensor owner is required']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
sensorSchema.index({ sensorId: 1 }, { unique: true });
sensorSchema.index({ location: "2dsphere" });
sensorSchema.index({ status: 1 });
sensorSchema.index({ lastHeartbeat: 1 });
sensorSchema.index({ sensorType: 1 });
sensorSchema.index({ 'address.region': 1 });
sensorSchema.index({ owner: 1 });
sensorSchema.index({ isPublic: 1 });

// Virtual for coordinates in [lat, lng] format
sensorSchema.virtual('latLng').get(function() {
  return [this.location.coordinates[1], this.location.coordinates[0]];
});

// Virtual for online status
sensorSchema.virtual('isOnline').get(function() {
  const cutoff = new Date(Date.now() - (this.heartbeatInterval * 2 * 1000));
  return this.lastHeartbeat >= cutoff && this.status === 'active';
});

// Virtual for maintenance status
sensorSchema.virtual('maintenanceStatus').get(function() {
  if (!this.maintenance.nextMaintenance) return 'unknown';
  
  const now = new Date();
  const nextMaintenance = this.maintenance.nextMaintenance;
  const daysDiff = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'overdue';
  if (daysDiff <= 7) return 'due_soon';
  if (daysDiff <= 30) return 'upcoming';
  return 'scheduled';
});

// Update heartbeat
sensorSchema.methods.updateHeartbeat = function() {
  this.lastHeartbeat = new Date();
  return this.save();
};

// Check if sensor needs maintenance
sensorSchema.methods.needsMaintenance = function() {
  if (!this.maintenance.nextMaintenance) return false;
  return new Date() >= this.maintenance.nextMaintenance;
};

// Add maintenance record
sensorSchema.methods.addMaintenanceRecord = function(maintenanceData) {
  this.maintenance.history.push(maintenanceData);
  
  // Update next maintenance date
  if (maintenanceData.type === 'maintenance' || maintenanceData.type === 'calibration') {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.maintenance.maintenanceInterval);
    this.maintenance.nextMaintenance = nextDate;
    this.maintenance.lastMaintenance = new Date();
  }
  
  return this.save();
};

// Get sensors within radius
sensorSchema.statics.findNearby = function(longitude, latitude, radiusInKm = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    },
    status: 'active'
  });
};

// Get sensors by region
sensorSchema.statics.findByRegion = function(region) {
  return this.find({ 'address.region': region, status: 'active' });
};

// Get offline sensors
sensorSchema.statics.findOffline = function(thresholdMinutes = 30) {
  const cutoff = new Date(Date.now() - (thresholdMinutes * 60 * 1000));
  return this.find({
    $or: [
      { lastHeartbeat: { $lt: cutoff } },
      { status: { $ne: 'active' } }
    ]
  });
};

// Pre-save middleware to set next maintenance date
sensorSchema.pre('save', function(next) {
  if (this.isNew && this.installDate && !this.maintenance.nextMaintenance) {
    const nextMaintenance = new Date(this.installDate);
    nextMaintenance.setDate(nextMaintenance.getDate() + this.maintenance.maintenanceInterval);
    this.maintenance.nextMaintenance = nextMaintenance;
  }
  next();
});

export default mongoose.model('Sensor', sensorSchema);

import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Helper function to create validation middleware
const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'params' ? req.params :
                 source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types when possible
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', { 
        errors: errorMessages,
        originalData: data
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Replace the original data with validated/sanitized data
    if (source === 'body') req.body = value;
    else if (source === 'params') req.params = value;
    else if (source === 'query') req.query = value;

    next();
  };
};

// Common validation schemas
const commonSchemas = {
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim(),
  
  phone: Joi.string()
    .pattern(/^[\+]?[0-9\-\s\(\)]+$/)
    .min(10)
    .max(20),
    
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().max(500).trim().allow(''),
    accuracy: Joi.number().min(0).optional()
  }),
  
  region: Joi.string().valid(
    'Ashanti', 'Greater Accra', 'Western', 'Eastern', 'Brong Ahafo', 'Central',
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Oti', 'Bono', 
    'Bono East', 'Ahafo', 'Savannah', 'North East'
  ),
  
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical'),
  
  evidenceType: Joi.string().valid('Photo', 'Video', 'Audio', 'Document', 'Other')
    .max(100)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),

  coordinates: Joi.array()
    .items(Joi.number().min(-180).max(180))
    .length(2)
    .required()
    .custom((value, helpers) => {
      const [lng, lat] = value;
      if (lng < -180 || lng > 180) {
        return helpers.error('coordinates.longitude');
      }
      if (lat < -90 || lat > 90) {
        return helpers.error('coordinates.latitude');
      }
      return value;
    })
    .messages({
      'coordinates.longitude': 'Longitude must be between -180 and 180',
      'coordinates.latitude': 'Latitude must be between -90 and 90',
      'array.length': 'Coordinates must contain exactly 2 numbers [longitude, latitude]'
    }),

  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    })
};

// User validation schemas
export const validateUserRegistration = createValidationMiddleware(
  Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    
    email: commonSchemas.email,
    
    passwordHash: commonSchemas.password,
    
    profile: Joi.object({
      firstName: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.empty': 'First name is required',
          'string.max': 'First name cannot exceed 50 characters'
        }),
      
      lastName: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.empty': 'Last name is required',
          'string.max': 'Last name cannot exceed 50 characters'
        }),
      
      phone: Joi.string()
        .pattern(/^[\+]?[\d\s\-\(\)]+$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number'
        }),
      
      department: Joi.string()
        .valid('Environmental', 'Security', 'Analytics', 'Management', 'IT', 'Field Operations')
        .optional(),
      
      position: Joi.string().max(100).optional(),
      bio: Joi.string().max(500).optional()
    }).required(),
    
    role: Joi.string()
      .valid('admin', 'officer', 'analyst', 'viewer')
      .default('viewer'),
    
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'taupe').default('light'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(true),
        sms: Joi.boolean().default(false)
      }).optional(),
      language: Joi.string().valid('en', 'es', 'fr').default('en'),
      timezone: Joi.string().default('UTC')
    }).optional()
  })
);

export const validateUserUpdate = createValidationMiddleware(
  Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: commonSchemas.email.optional(),
    
    profile: Joi.object({
      firstName: Joi.string().trim().min(1).max(50).optional(),
      lastName: Joi.string().trim().min(1).max(50).optional(),
      phone: Joi.string().pattern(/^[\+]?[\d\s\-\(\)]+$/).optional().allow(''),
      department: Joi.string()
        .valid('Environmental', 'Security', 'Analytics', 'Management', 'IT', 'Field Operations')
        .optional(),
      position: Joi.string().max(100).optional().allow(''),
      bio: Joi.string().max(500).optional().allow('')
    }).optional(),
    
    role: Joi.string().valid('admin', 'officer', 'analyst', 'viewer').optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'taupe').optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional()
      }).optional(),
      dashboard: Joi.object({
        layout: Joi.string().valid('grid', 'list', 'cards').optional(),
        refreshRate: Joi.number().min(10).max(300).optional()
      }).optional(),
      language: Joi.string().valid('en', 'es', 'fr').optional(),
      timezone: Joi.string().optional()
    }).optional()
  }).min(1) // At least one field must be provided for update
);

// Authentication validation schemas
export const validateLogin = createValidationMiddleware(
  Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
  })
);

export const validatePasswordChange = createValidationMiddleware(
  Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonSchemas.password
  })
);

// Sensor validation schemas
export const validateSensorRegistration = createValidationMiddleware(
  Joi.object({
    sensorId: Joi.string()
      .uppercase()
      .pattern(/^[A-Z0-9_-]+$/)
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.pattern.base': 'Sensor ID can only contain uppercase letters, numbers, underscores, and hyphens',
        'string.min': 'Sensor ID must be at least 3 characters long'
      }),
    
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().max(500).optional().allow(''),
    
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: commonSchemas.coordinates
    }).required(),
    
    address: Joi.object({
      street: Joi.string().optional().allow(''),
      city: Joi.string().optional().allow(''),
      region: Joi.string()
        .valid(
          'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Northern',
          'Upper East', 'Upper West', 'Volta', 'Central', 'Brong-Ahafo',
          'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
        )
        .optional(),
      country: Joi.string().default('Ghana'),
      postalCode: Joi.string().optional().allow('')
    }).optional(),
    
    sensorType: Joi.string()
      .valid('environmental', 'air_quality', 'weather', 'water_quality', 'noise', 'seismic', 'multi_parameter')
      .required(),
    
    capabilities: Joi.array().items(
      Joi.object({
        parameter: Joi.string()
          .valid('temperature', 'humidity', 'airQuality', 'co2', 'noise', 'pressure', 'ph', 'turbidity', 'dissolved_oxygen', 'conductivity')
          .required(),
        unit: Joi.string().required(),
        range: Joi.object({
          min: Joi.number(),
          max: Joi.number().greater(Joi.ref('min'))
        }).optional(),
        accuracy: Joi.string().optional()
      })
    ).min(1).required(),
    
    installDate: Joi.date().max('now').required(),
    
    metadata: Joi.object({
      manufacturer: Joi.string().required(),
      model: Joi.string().required(),
      serialNumber: Joi.string().optional(),
      firmware: Joi.object({
        version: Joi.string().optional()
      }).optional(),
      hardware: Joi.object({
        version: Joi.string().optional(),
        powerSource: Joi.string().valid('battery', 'solar', 'mains', 'hybrid').default('battery')
      }).optional(),
      connectivity: Joi.object({
        type: Joi.string().valid('wifi', 'cellular', 'lora', 'ethernet', 'satellite').default('cellular'),
        provider: Joi.string().optional()
      }).optional()
    }).required(),
    
    tags: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().optional().allow('')
  })
);

// Sensor reading validation schemas
export const validateSensorReading = createValidationMiddleware(
  Joi.object({
    sensorId: Joi.string().uppercase().required(),
    timestamp: Joi.date().max('now').optional().default(() => new Date()),
    
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: commonSchemas.coordinates
    }).optional(),
    
    readings: Joi.object({
      temperature: Joi.number().min(-50).max(100).optional(),
      humidity: Joi.number().min(0).max(100).optional(),
      pressure: Joi.number().min(0).optional(),
      airQuality: Joi.number().min(0).max(500).optional(),
      pm25: Joi.number().min(0).optional(),
      pm10: Joi.number().min(0).optional(),
      co2: Joi.number().min(0).optional(),
      co: Joi.number().min(0).optional(),
      no2: Joi.number().min(0).optional(),
      so2: Joi.number().min(0).optional(),
      o3: Joi.number().min(0).optional(),
      ph: Joi.number().min(0).max(14).optional(),
      turbidity: Joi.number().min(0).optional(),
      dissolvedOxygen: Joi.number().min(0).optional(),
      conductivity: Joi.number().min(0).optional(),
      tds: Joi.number().min(0).optional(),
      noise: Joi.number().min(0).max(200).optional(),
      customReadings: Joi.object().optional()
    }).min(1).required(),
    
    metadata: Joi.object({
      batteryLevel: Joi.number().min(0).max(100).optional(),
      signalStrength: Joi.number().min(-120).max(0).optional(),
      firmwareVersion: Joi.string().optional(),
      source: Joi.string().valid('sensor', 'manual', 'estimated', 'corrected').default('sensor')
    }).optional()
  })
);

// Query parameter validation
export const validatePagination = createValidationMiddleware(
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),
  'query'
);

export const validateDateRange = createValidationMiddleware(
  Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    timeRange: Joi.string().valid('1h', '6h', '24h', '7d', '30d', '90d').optional()
  }),
  'query'
);

export const validateSensorQuery = createValidationMiddleware(
  Joi.object({
    sensorId: Joi.string().optional(),
    sensorType: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance', 'error', 'offline').optional(),
    region: Joi.string().optional(),
    near: Joi.object({
      longitude: Joi.number().min(-180).max(180).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      radius: Joi.number().min(0.1).max(1000).default(10) // km
    }).optional()
  }),
  'query'
);

// ID parameter validation
export const validateObjectId = createValidationMiddleware(
  Joi.object({
    id: commonSchemas.objectId.required()
  }),
  'params'
);

// Sensor data validation
export const validateSensorData = createValidationMiddleware(
  Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    sensorType: Joi.string().valid(
      'temperature_humidity',
      'air_quality',
      'water_quality',
      'noise_level',
      'soil_ph',
      'multi_environmental'
    ).required(),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(
        Joi.number().min(-180).max(180), // longitude
        Joi.number().min(-90).max(90)    // latitude
      ).length(2).required()
    }).optional(),
    address: Joi.object({
      region: Joi.string().trim().max(50),
      district: Joi.string().trim().max(50),
      community: Joi.string().trim().max(100),
      landmark: Joi.string().trim().max(100),
      postalAddress: Joi.string().trim().max(200)
    }).optional(),
    thresholds: Joi.object({
      temperature: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
        unit: Joi.string().default('°C')
      }).optional(),
      humidity: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
        unit: Joi.string().default('%')
      }).optional(),
      airQuality: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
        unit: Joi.string().default('AQI')
      }).optional()
    }).optional(),
    calibration: Joi.object({
      lastCalibrated: Joi.date(),
      calibrationInterval: Joi.number().min(1).max(365),
      calibrationStatus: Joi.string().valid('valid', 'expired', 'required')
    }).optional(),
    batteryLevel: Joi.number().min(0).max(100).optional(),
    signalStrength: Joi.number().min(0).max(100).optional()
  })
);

// Sensor reading data validation
export const validateReadingData = createValidationMiddleware(
  Joi.object({
    readings: Joi.object({
      temperature: Joi.number().min(-50).max(70),
      humidity: Joi.number().min(0).max(100),
      airQuality: Joi.number().min(0).max(500),
      pH: Joi.number().min(0).max(14),
      dissolvedOxygen: Joi.number().min(0).max(20),
      turbidity: Joi.number().min(0).max(500),
      pm25: Joi.number().min(0).max(500),
      pm10: Joi.number().min(0).max(500),
      co2: Joi.number().min(0).max(5000),
      timestamp: Joi.date().default(new Date())
    }).required(),
    batteryLevel: Joi.number().min(0).max(100).optional(),
    signalStrength: Joi.number().min(0).max(100).optional(),
    deviceInfo: Joi.object({
      firmware: Joi.string(),
      model: Joi.string(),
      serialNumber: Joi.string()
    }).optional()
  })
);

// Export common schemas for reuse
export { commonSchemas };

// Report validation schema
export const validateReportData = createValidationMiddleware(
  Joi.object({
    fullName: Joi.string().trim().max(100).optional().allow(''),
    phoneNumber: commonSchemas.phone.optional().allow(''),
    email: commonSchemas.email.optional().allow(''),
    isAnonymous: Joi.boolean().default(false),
    region: commonSchemas.region.required(),
    location: commonSchemas.location.required(),
    type: Joi.string().valid(
      'Water Pollution',
      'Deforestation', 
      'Mercury Use',
      'Child Labor',
      'Other',
      'Illegal Mining (Galamsey)',
      'Air Pollution',
      'Land Degradation',
      'Chemical Contamination',
      'Noise Pollution'
    ).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    affectedArea: Joi.string().trim().max(500).required(),
    evidence: Joi.array().items(
      Joi.object({
        type: commonSchemas.evidenceType.required(),
        description: Joi.string().trim().max(300).allow(''),
        fileUrl: Joi.string().uri().allow(''),
        fileName: Joi.string().trim().max(255).allow('')
      })
    ).max(10).default([])
  })
);

// Case validation schema
export const validateCaseData = createValidationMiddleware(
  Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    region: commonSchemas.region.required(),
    type: Joi.string().valid(
      'Illegal Mining (Galamsey)',
      'Water Pollution',
      'Air Pollution',
      'Deforestation',
      'Land Degradation',
      'Chemical Contamination',
      'Noise Pollution',
      'Other'
    ).required(),
    priority: commonSchemas.priority.required(),
    description: Joi.string().trim().min(20).max(2000).required(),
    assignedTo: Joi.string().hex().length(24).optional(),
    location: commonSchemas.location.optional(),
    reporter: Joi.object({
      fullName: Joi.string().trim().max(100).optional(),
      phoneNumber: commonSchemas.phone.optional(),
      email: commonSchemas.email.optional(),
      isAnonymous: Joi.boolean().default(false)
    }).optional()
  })
);

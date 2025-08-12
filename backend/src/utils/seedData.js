import bcrypt from 'bcryptjs';
import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// Sample data for seeding the database
const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
];

const SENSOR_TYPES = [
  'temperature_humidity',
  'air_quality',
  'water_quality',
  'noise_level',
  'soil_ph',
  'multi_parameter'
];

const MINING_LOCATIONS = [
  { name: 'Obuasi Mining Zone', region: 'Ashanti', coordinates: [-1.6593, 6.2027] },
  { name: 'Tarkwa Mining Area', region: 'Western', coordinates: [-1.9915, 5.3007] },
  { name: 'Prestea Mining District', region: 'Western', coordinates: [-2.1431, 5.4353] },
  { name: 'Ahafo Mining Region', region: 'Ahafo', coordinates: [-2.5215, 7.3089] },
  { name: 'Konongo Mining Area', region: 'Ashanti', coordinates: [-1.2167, 6.6167] },
  { name: 'Damang Mining Site', region: 'Western', coordinates: [-1.8833, 5.2667] },
  { name: 'Bibiani Mining Zone', region: 'Western North', coordinates: [-2.3167, 6.4667] },
  { name: 'Bogoso Mining Area', region: 'Western', coordinates: [-1.9833, 5.5833] },
  { name: 'Chirano Mining District', region: 'Western North', coordinates: [-2.7833, 6.7833] },
  { name: 'Asanko Mining Area', region: 'Ashanti', coordinates: [-1.4167, 6.9167] },
  { name: 'Akyem Mining Zone', region: 'Eastern', coordinates: [-0.8833, 6.2500] },
  { name: 'Kwahu Environmental Monitor', region: 'Eastern', coordinates: [-0.7500, 6.5000] },
  { name: 'Lake Volta Monitor', region: 'Volta', coordinates: [0.0333, 6.7333] },
  { name: 'Accra Urban Monitor', region: 'Greater Accra', coordinates: [-0.1870, 5.6037] },
  { name: 'Kumasi Urban Monitor', region: 'Ashanti', coordinates: [-1.6244, 6.6885] },
  { name: 'Tamale Monitor', region: 'Northern', coordinates: [-0.8333, 9.4000] }
];

// Seed Users (Administrators, Officers, Analysts)
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    const users = [
      // System Administrator
      {
        username: 'admin',
        email: 'admin@goldguard.gov.gh',
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          department: 'IT',
          phone: '+233 20 123 4567'
        },
        role: 'admin',
        passwordHash: await bcrypt.hash('Admin@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'alerts', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'users', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'reports', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'dashboard', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'settings', actions: ['read', 'write', 'delete', 'manage'] }
        ],
        lastLogin: new Date(),
        createdAt: new Date('2024-01-01')
      },

      // Environmental Officers
      {
        username: 'officer1',
        email: 'kwame.mensah@goldguard.gov.gh',
        profile: {
          firstName: 'Kwame',
          lastName: 'Mensah',
          department: 'Environmental',
          phone: '+233 24 234 5678'
        },
        role: 'officer',
        passwordHash: await bcrypt.hash('Officer@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read', 'write', 'manage'] },
          { resource: 'alerts', actions: ['read', 'write'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ],
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date('2024-01-15')
      },

      {
        username: 'officer2',
        email: 'ama.asante@goldguard.gov.gh',
        profile: {
          firstName: 'Ama',
          lastName: 'Asante',
          department: 'Field Operations',
          phone: '+233 26 345 6789'
        },
        role: 'officer',
        passwordHash: await bcrypt.hash('Officer@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read', 'write', 'manage'] },
          { resource: 'alerts', actions: ['read', 'write'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ],
        lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        createdAt: new Date('2024-01-20')
      },

      // Data Analysts
      {
        username: 'analyst1',
        email: 'kofi.darko@goldguard.gov.gh',
        profile: {
          firstName: 'Kofi',
          lastName: 'Darko',
          department: 'Analytics',
          phone: '+233 27 456 7890'
        },
        role: 'analyst',
        passwordHash: await bcrypt.hash('Analyst@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read'] },
          { resource: 'alerts', actions: ['read'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ],
        lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date('2024-02-01')
      },

      {
        username: 'analyst2',
        email: 'akosua.oppong@goldguard.gov.gh',
        profile: {
          firstName: 'Akosua',
          lastName: 'Oppong',
          department: 'Analytics',
          phone: '+233 28 567 8901'
        },
        role: 'analyst',
        passwordHash: await bcrypt.hash('Analyst@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read'] },
          { resource: 'alerts', actions: ['read'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ],
        lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        createdAt: new Date('2024-02-05')
      },

      // Regional Coordinator
      {
        username: 'regional1',
        email: 'yaw.boateng@goldguard.gov.gh',
        profile: {
          firstName: 'Yaw',
          lastName: 'Boateng',
          department: 'Management',
          phone: '+233 50 678 9012'
        },
        role: 'officer',
        passwordHash: await bcrypt.hash('Regional@123', 12),
        status: 'active',
        permissions: [
          { resource: 'sensors', actions: ['read', 'write'] },
          { resource: 'alerts', actions: ['read', 'write'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ],
        lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date('2024-01-30')
      }
    ];

    const createdUsers = await User.insertMany(users);
    logger.info(`Seeded ${createdUsers.length} users successfully`);
    
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Seed Sensors across Ghana mining areas
const seedSensors = async () => {
  try {
    // Clear existing sensors
    await Sensor.deleteMany({});

    // Get the admin user to assign as sensor owner
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Cannot create sensors without an owner.');
    }

    const sensors = [];
    let sensorCounter = 1000;

    // Create sensors for each mining location
    MINING_LOCATIONS.forEach((location, index) => {
      // Main environmental sensor
      sensors.push({
        sensorId: `GG-ENV-${sensorCounter++}`,
        name: `${location.name} - Main Environmental Sensor`,
        sensorType: 'multi_parameter',
        status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'maintenance' : 'error'),
        location: {
          type: 'Point',
          coordinates: location.coordinates
        },
        address: {
          region: location.region,
          city: `${location.name.split(' ')[0]} City`,
          street: 'Mining Monitoring Station',
          country: 'Ghana'
        },
        capabilities: [
          {
            parameter: 'temperature',
            unit: '°C',
            range: { min: -10, max: 50 },
            accuracy: '±0.5°C'
          },
          {
            parameter: 'humidity', 
            unit: '%',
            range: { min: 0, max: 100 },
            accuracy: '±2%'
          },
          {
            parameter: 'airQuality',
            unit: 'AQI',
            range: { min: 0, max: 500 },
            accuracy: '±5'
          }
        ],
        installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastHeartbeat: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Within last hour
        metadata: {
          manufacturer: 'GoldGuard Systems',
          model: 'GG-ENV-2024',
          serialNumber: `GGS${String(sensorCounter).padStart(6, '0')}`,
          firmware: {
            version: '2.1.4',
            lastUpdate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          },
          hardware: {
            powerSource: 'solar',
            batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
            signalStrength: Math.floor(Math.random() * 30) - 100 // -100 to -70 dBm
          },
          connectivity: {
            type: 'cellular',
            provider: 'MTN Ghana',
            lastConnected: new Date(Date.now() - Math.random() * 60 * 60 * 1000)
          }
        },
        configuration: {
          samplingRate: 300, // 5 minutes
          alertThresholds: [
            {
              parameter: 'temperature',
              warning: { min: 5, max: 35 },
              critical: { min: 0, max: 45 }
            },
            {
              parameter: 'airQuality',
              warning: { min: 0, max: 150 },
              critical: { min: 0, max: 300 }
            }
          ]
        },
        owner: adminUser._id,
        isPublic: true,
        tags: ['environmental', 'mining', 'monitoring']
      });

      // Water quality sensor (if near water bodies)
      if (location.name.includes('Lake') || Math.random() > 0.7) {
        sensors.push({
          sensorId: `GG-WATER-${sensorCounter++}`,
          name: `${location.name} - Water Quality Sensor`,
          sensorType: 'water_quality',
          status: Math.random() > 0.15 ? 'active' : 'maintenance',
          location: {
            type: 'Point',
            coordinates: [
              location.coordinates[0] + (Math.random() - 0.5) * 0.01,
              location.coordinates[1] + (Math.random() - 0.5) * 0.01
            ]
          },
          address: {
            region: location.region,
            city: `${location.name.split(' ')[0]} City`,
            street: 'Water Source Monitoring Point',
            country: 'Ghana'
          },
          capabilities: [
            {
              parameter: 'ph',
              unit: 'pH',
              range: { min: 0, max: 14 },
              accuracy: '±0.1'
            },
            {
              parameter: 'dissolved_oxygen',
              unit: 'mg/L',
              range: { min: 0, max: 20 },
              accuracy: '±0.2'
            },
            {
              parameter: 'turbidity',
              unit: 'NTU',
              range: { min: 0, max: 100 },
              accuracy: '±2'
            }
          ],
          installDate: new Date(Date.now() - Math.random() * 300 * 24 * 60 * 60 * 1000),
          lastHeartbeat: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
          metadata: {
            manufacturer: 'AquaGuard Tech',
            model: 'AG-WATER-2023',
            serialNumber: `AGT${String(sensorCounter).padStart(6, '0')}`,
            firmware: {
              version: '2.0.8'
            },
            hardware: {
              powerSource: 'battery',
              batteryLevel: Math.floor(Math.random() * 50) + 50,
              signalStrength: Math.floor(Math.random() * 40) - 100
            },
            connectivity: {
              type: 'cellular',
              provider: 'Vodafone Ghana'
            }
          },
          configuration: {
            samplingRate: 600, // 10 minutes
            alertThresholds: [
              {
                parameter: 'ph',
                warning: { min: 6.5, max: 8.5 },
                critical: { min: 5.0, max: 9.0 }
              }
            ]
          },
          owner: adminUser._id,
          isPublic: true,
          tags: ['water', 'quality', 'monitoring']
        });
      }

      // Air quality sensor for urban areas
      if (location.name.includes('Urban') || location.name.includes('Accra') || location.name.includes('Kumasi')) {
        sensors.push({
          sensorId: `GG-AIR-${sensorCounter++}`,
          name: `${location.name} - Air Quality Sensor`,
          sensorType: 'air_quality',
          status: Math.random() > 0.08 ? 'active' : 'error',
          location: {
            type: 'Point',
            coordinates: [
              location.coordinates[0] + (Math.random() - 0.5) * 0.005,
              location.coordinates[1] + (Math.random() - 0.5) * 0.005
            ]
          },
          address: {
            region: location.region,
            city: `${location.name.split(' ')[0]} City`,
            street: 'Urban Air Quality Station',
            country: 'Ghana'
          },
          capabilities: [
            {
              parameter: 'airQuality',
              unit: 'AQI',
              range: { min: 0, max: 500 },
              accuracy: '±5'
            },
            {
              parameter: 'co2',
              unit: 'ppm',
              range: { min: 300, max: 5000 },
              accuracy: '±50ppm'
            }
          ],
          installDate: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000),
          lastHeartbeat: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
          metadata: {
            manufacturer: 'CleanAir Systems',
            model: 'CAS-AIR-2024',
            serialNumber: `CAS${String(sensorCounter).padStart(6, '0')}`,
            firmware: {
              version: '3.2.1'
            },
            hardware: {
              powerSource: 'mains',
              batteryLevel: Math.floor(Math.random() * 30) + 70,
              signalStrength: Math.floor(Math.random() * 25) - 75
            },
            connectivity: {
              type: 'ethernet',
              provider: 'Ghana Telecom'
            }
          },
          configuration: {
            samplingRate: 180, // 3 minutes
            alertThresholds: [
              {
                parameter: 'airQuality',
                warning: { min: 0, max: 100 },
                critical: { min: 0, max: 200 }
              }
            ]
          },
          owner: adminUser._id,
          isPublic: true,
          tags: ['air', 'quality', 'urban', 'monitoring']
        });
      }
    });

    const createdSensors = await Sensor.insertMany(sensors);
    logger.info(`Seeded ${createdSensors.length} sensors successfully`);
    
    return createdSensors;
  } catch (error) {
    logger.error('Error seeding sensors:', error);
    throw error;
  }
};

// Seed Sensor Readings (Historical and Recent Data)
const seedSensorReadings = async (sensors) => {
  try {
    // Clear existing readings
    await SensorReading.deleteMany({});

    const readings = [];
    const now = new Date();
    
    // Generate readings for each sensor
    for (const sensor of sensors) {
      // Generate readings for the last 30 days
      for (let days = 30; days >= 0; days--) {
        const numReadingsPerDay = Math.floor(Math.random() * 8) + 16; // 16-24 readings per day
        
        for (let reading = 0; reading < numReadingsPerDay; reading++) {
          const timestamp = new Date(now - days * 24 * 60 * 60 * 1000 - reading * 60 * 60 * 1000);
          
          // Generate realistic readings based on sensor type and location
          const readingData = generateRealisticReading(sensor, timestamp);
          
          readings.push({
            sensorId: sensor.sensorId,
            timestamp: timestamp,
            location: {
              type: 'Point',
              coordinates: sensor.location.coordinates
            },
            readings: readingData.readings,
            quality: readingData.quality,
            alertsTriggered: readingData.alertsTriggered,
            metadata: {
              batteryLevel: sensor.batteryLevel,
              signalStrength: sensor.signalStrength,
              deviceInfo: {
                firmware: sensor.firmware,
                model: sensor.metadata?.model
              }
            },
            recordedBy: 'system'
          });
        }
      }
    }

    // Insert readings in batches to avoid memory issues
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize);
      await SensorReading.insertMany(batch);
      insertedCount += batch.length;
      
      if (insertedCount % 5000 === 0) {
        logger.info(`Inserted ${insertedCount} sensor readings...`);
      }
    }

    logger.info(`Seeded ${insertedCount} sensor readings successfully`);
    return readings.length;
  } catch (error) {
    logger.error('Error seeding sensor readings:', error);
    throw error;
  }
};

// Generate realistic sensor readings based on sensor type and environmental factors
const generateRealisticReading = (sensor, timestamp) => {
  const hour = timestamp.getHours();
  const month = timestamp.getMonth();
  const isRainySeason = month >= 4 && month <= 9; // May to October
  const isMiningArea = sensor.name.includes('Mining');
  
  let readings = {};
  let quality = 'excellent';
  let alertsTriggered = [];

  // Base temperature (varies by time of day and season)
  let baseTemp = 25; // Base temperature in Celsius
  if (isRainySeason) baseTemp -= 2;
  if (hour >= 10 && hour <= 16) baseTemp += Math.random() * 8; // Hotter during day
  if (hour >= 18 || hour <= 6) baseTemp -= Math.random() * 3; // Cooler at night
  
  // Base humidity (higher during rainy season)
  let baseHumidity = isRainySeason ? 75 : 55;
  if (hour >= 6 && hour <= 10) baseHumidity += 10; // Higher in morning
  
  // Base air quality (worse in mining areas)
  let baseAQI = isMiningArea ? 80 : 45;

  switch (sensor.sensorType) {
    case 'multi_parameter':
      readings.temperature = Math.max(0, Math.min(50, baseTemp + (Math.random() - 0.5) * 6));
      readings.humidity = Math.max(0, Math.min(100, baseHumidity + (Math.random() - 0.5) * 20));
      readings.airQuality = Math.max(0, Math.min(500, baseAQI + (Math.random() - 0.5) * 40));
      
      // Check for alerts
      if (readings.temperature > 35) {
        alertsTriggered.push({
          type: 'temperature_high',
          value: readings.temperature,
          threshold: 35
        });
        quality = 'fair';
      }
      if (readings.airQuality > 150) {
        alertsTriggered.push({
          type: 'air_quality_poor',
          value: readings.airQuality,
          threshold: 150
        });
        quality = 'poor';
      }
      break;

    case 'air_quality':
      readings.pm25 = Math.max(0, Math.min(150, (baseAQI * 0.4) + (Math.random() - 0.5) * 20));
      readings.pm10 = Math.max(0, Math.min(200, readings.pm25 * 1.5 + (Math.random() - 0.5) * 15));
      readings.co2 = Math.max(300, Math.min(2000, 400 + (isMiningArea ? 100 : 0) + (Math.random() - 0.5) * 200));
      readings.airQuality = Math.max(0, Math.min(300, baseAQI + (Math.random() - 0.5) * 50));
      
      if (readings.airQuality > 150) {
        alertsTriggered.push({
          type: 'air_quality_poor',
          value: readings.airQuality,
          threshold: 150
        });
        quality = 'poor';
      }
      break;

    case 'water_quality':
      readings.pH = Math.max(4, Math.min(10, 7 + (Math.random() - 0.5) * 2));
      readings.dissolvedOxygen = Math.max(2, Math.min(18, 8 + (Math.random() - 0.5) * 4));
      readings.turbidity = Math.max(0, Math.min(100, (isMiningArea ? 15 : 5) + (Math.random() - 0.5) * 10));
      readings.temperature = Math.max(15, Math.min(35, baseTemp + (Math.random() - 0.5) * 4));
      
      if (readings.pH < 6.5 || readings.pH > 8.5) {
        alertsTriggered.push({
          type: 'water_ph_abnormal',
          value: readings.pH,
          threshold: readings.pH < 6.5 ? 6.5 : 8.5
        });
        quality = 'fair';
      }
      break;

    case 'temperature_humidity':
      readings.temperature = Math.max(15, Math.min(45, baseTemp + (Math.random() - 0.5) * 5));
      readings.humidity = Math.max(20, Math.min(95, baseHumidity + (Math.random() - 0.5) * 15));
      
      if (readings.temperature > 35) {
        alertsTriggered.push({
          type: 'temperature_high',
          value: readings.temperature,
          threshold: 35
        });
        quality = 'fair';
      }
      break;

    default:
      readings.temperature = Math.max(15, Math.min(45, baseTemp + (Math.random() - 0.5) * 6));
      readings.humidity = Math.max(20, Math.min(95, baseHumidity + (Math.random() - 0.5) * 20));
      readings.airQuality = Math.max(0, Math.min(300, baseAQI + (Math.random() - 0.5) * 40));
  }

  // Simulate occasional sensor errors
  if (Math.random() < 0.02) { // 2% chance of error
    quality = 'invalid';
    // Set readings to null for invalid quality (sensor malfunction)
    Object.keys(readings).forEach(key => {
      readings[key] = null; // Invalid reading
    });
    alertsTriggered.push({
      type: 'sensor_malfunction',
      severity: 'critical',
      timestamp: timestamp
    });
  }

  return { readings, quality, alertsTriggered };
};

// Main seeding function
export const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Check if database is already seeded
    const userCount = await User.countDocuments();
    const sensorCount = await Sensor.countDocuments();
    
    if (userCount > 0 || sensorCount > 0) {
      logger.info(`Database already contains data (${userCount} users, ${sensorCount} sensors)`);
      const shouldReset = process.env.FORCE_RESEED === 'true';
      
      if (!shouldReset) {
        logger.info('Skipping seeding. Set FORCE_RESEED=true to force reseed.');
        return;
      }
      
      logger.warn('FORCE_RESEED is true. Clearing existing data...');
    }
    
    // Seed data in order
    const users = await seedUsers();
    const sensors = await seedSensors();
    const readingsCount = await seedSensorReadings(sensors);
    
    logger.info('Database seeding completed successfully!');
    logger.info(`Seeded: ${users.length} users, ${sensors.length} sensors, ${readingsCount} readings`);
    
    return {
      users: users.length,
      sensors: sensors.length,
      readings: readingsCount
    };
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

// Export individual seeding functions for selective use
export { seedSensorReadings, seedSensors, seedUsers };


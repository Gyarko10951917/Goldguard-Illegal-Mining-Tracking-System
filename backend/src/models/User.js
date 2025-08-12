import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Comprehensive email validation regex
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          return !phone || /^[\+]?[\d\s\-\(\)]+$/.test(phone);
        },
        message: 'Please provide a valid phone number'
      }
    },
    avatar: {
      type: String,
      default: null
    },
    department: {
      type: String,
      enum: ['Environmental', 'Security', 'Analytics', 'Management', 'IT', 'Field Operations'],
      default: 'Environmental'
    },
    position: {
      type: String,
      maxlength: [100, 'Position cannot exceed 100 characters']
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  role: {
    type: String,
    enum: ['admin', 'officer', 'analyst', 'viewer'],
    default: 'viewer',
    required: true
  },
  permissions: [{
    resource: {
      type: String,
      enum: ['sensors', 'alerts', 'users', 'reports', 'dashboard', 'settings'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'manage'],
      required: true
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'taupe'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      alertTypes: [{
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: ['critical', 'high']
      }]
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['grid', 'list', 'cards'],
        default: 'grid'
      },
      widgets: [{
        type: String,
        enum: ['sensors', 'alerts', 'charts', 'map', 'reports', 'weather'],
        default: ['sensors', 'alerts', 'charts']
      }],
      refreshRate: {
        type: Number,
        default: 30, // seconds
        min: 10,
        max: 300
      }
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  apiKeys: [{
    name: String,
    key: String,
    permissions: [String],
    lastUsed: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive information when converting to JSON
      delete ret.passwordHash;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.twoFactorAuth;
      delete ret.apiKeys;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastLogin: 1 });
userSchema.index({ 'profile.department': 1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for initials
userSchema.virtual('profile.initials').get(function() {
  const firstName = this.profile.firstName || '';
  const lastName = this.profile.lastName || '';
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role') && this.permissions.length === 0) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          { resource: 'sensors', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'alerts', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'users', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'reports', actions: ['read', 'write', 'delete', 'manage'] },
          { resource: 'dashboard', actions: ['read', 'write', 'manage'] },
          { resource: 'settings', actions: ['read', 'write', 'manage'] }
        ];
        break;
      case 'officer':
        this.permissions = [
          { resource: 'sensors', actions: ['read', 'write'] },
          { resource: 'alerts', actions: ['read', 'write'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ];
        break;
      case 'analyst':
        this.permissions = [
          { resource: 'sensors', actions: ['read'] },
          { resource: 'alerts', actions: ['read', 'write'] },
          { resource: 'reports', actions: ['read', 'write'] },
          { resource: 'dashboard', actions: ['read', 'write'] }
        ];
        break;
      case 'viewer':
        this.permissions = [
          { resource: 'sensors', actions: ['read'] },
          { resource: 'alerts', actions: ['read'] },
          { resource: 'reports', actions: ['read'] },
          { resource: 'dashboard', actions: ['read'] }
        ];
        break;
    }
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw error;
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check permissions
userSchema.methods.hasPermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email, status: 'active' });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

export default mongoose.model('User', userSchema);

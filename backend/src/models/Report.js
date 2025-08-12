import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: function() { return !this.isAnonymous; },
    trim: true
  },
  phoneNumber: {
    type: String,
    required: function() { return !this.isAnonymous; },
    trim: true
  },
  email: {
    type: String,
    required: function() { return !this.isAnonymous; },
    trim: true,
    lowercase: true
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: [
      'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Northern',
      'Upper East', 'Upper West', 'Volta', 'Central', 'Brong-Ahafo',
      'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
    ]
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'Illegal Mining', 'Environmental Damage', 'Water Pollution',
      'Forest Destruction', 'Land Degradation', 'Community Impact',
      'Safety Concerns', 'General Inquiry', 'Technical Support', 'Other'
    ]
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Assigned', 'Completed'],
    default: 'Submitted'
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
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
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    sessionId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for case reference
reportSchema.virtual('case', {
  ref: 'Case',
  localField: '_id',
  foreignField: 'reportId',
  justOne: true
});

// Indexes for better performance
reportSchema.index({ reportId: 1 }, { unique: true });
reportSchema.index({ region: 1 });
reportSchema.index({ subject: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ location: '2dsphere' });

// Generate report ID before validation
reportSchema.pre('validate', function(next) {
  if (!this.reportId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    this.reportId = `RPT-${timestamp}-${randomStr}`.toUpperCase();
  }
  next();
});

// Determine priority based on subject and message
reportSchema.pre('save', function(next) {
  if (!this.priority || this.priority === 'Medium') {
    const highPriorityKeywords = ['urgent', 'emergency', 'immediate', 'danger', 'toxic', 'health', 'contamination'];
    const criticalKeywords = ['death', 'poison', 'severe', 'massive', 'widespread'];
    
    const content = (this.subject + ' ' + this.message).toLowerCase();
    
    if (criticalKeywords.some(keyword => content.includes(keyword))) {
      this.priority = 'Critical';
    } else if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
      this.priority = 'High';
    } else if (this.subject.includes('Illegal Mining') || this.subject.includes('Water Pollution')) {
      this.priority = 'High';
    }
  }
  next();
});

// Static methods for analytics
reportSchema.statics.getReportsByRegion = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$region',
        count: { $sum: 1 },
        highPriority: { $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

reportSchema.statics.getReportsByStatus = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

reportSchema.statics.getTrendingSubjects = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        avgPriority: { $avg: { $cond: [
          { $eq: ['$priority', 'Low'] }, 1,
          { $cond: [
            { $eq: ['$priority', 'Medium'] }, 2,
            { $cond: [
              { $eq: ['$priority', 'High'] }, 3,
              4
            ]}
          ]}
        ]}}
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const Report = mongoose.model('Report', reportSchema);

export default Report;

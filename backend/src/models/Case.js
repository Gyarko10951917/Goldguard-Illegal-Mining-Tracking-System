import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
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
  type: {
    type: String,
    required: [true, 'Case type is required'],
    enum: [
      'Illegal Mining', 'Environmental', 'Water Pollution',
      'Forest Destruction', 'Land Degradation', 'Community',
      'Safety', 'General', 'Technical'
    ]
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Under Investigation', 'Pending', 'Resolved', 'Closed', 'New'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  description: {
    type: String,
    required: [true, 'Case description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedOfficer: {
    name: String,
    badgeNumber: String,
    department: String,
    contactInfo: {
      phone: String,
      email: String
    }
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  location: {
    address: String,
    coordinates: {
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
    }
  },
  reporter: {
    type: {
      type: String,
      enum: ['identified', 'anonymous'],
      default: 'identified'
    },
    name: String,
    phone: String,
    email: String,
    anonymous: { type: Boolean, default: false }
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio', 'sensor_data'],
      required: true
    },
    filename: String,
    url: String,
    description: String,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  timeline: [{
    date: { type: Date, default: Date.now },
    action: {
      type: String,
      enum: ['created', 'assigned', 'status_changed', 'evidence_added', 'comment_added', 'closed'],
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousValue: String,
    newValue: String
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  investigation: {
    startDate: Date,
    endDate: Date,
    findings: String,
    recommendations: String,
    actionsTaken: [{
      action: String,
      date: Date,
      responsibleParty: String,
      status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
        default: 'planned'
      }
    }]
  },
  legalActions: [{
    type: {
      type: String,
      enum: ['warning', 'fine', 'prosecution', 'license_revocation', 'court_order']
    },
    amount: Number, // for fines
    description: String,
    date: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'appealed'],
      default: 'pending'
    }
  }],
  relatedCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  resolutionDate: Date,
  resolutionSummary: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for case age
caseSchema.virtual('ageInDays').get(function() {
  const today = new Date();
  const createdDate = this.createdAt;
  const diffTime = Math.abs(today - createdDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for urgency score
caseSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  
  // Priority scoring
  const priorityScore = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Critical': 4
  };
  score += priorityScore[this.priority] * 10;
  
  // Age scoring (older cases get higher urgency)
  score += this.ageInDays;
  
  // Status scoring
  if (this.status === 'Open' || this.status === 'New') {
    score += 20;
  }
  
  return score;
});

// Indexes for better performance
caseSchema.index({ caseId: 1 }, { unique: true });
caseSchema.index({ status: 1 });
caseSchema.index({ priority: 1 });
caseSchema.index({ assignedTo: 1 });
caseSchema.index({ region: 1 });
caseSchema.index({ type: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ 'location.coordinates': '2dsphere' });
caseSchema.index({ tags: 1 });

// Generate case ID before saving
caseSchema.pre('save', function(next) {
  if (!this.caseId && this.isNew) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    this.caseId = `CASE-${timestamp}-${randomStr}`.toUpperCase();
  }
  next();
});

// Add timeline entry for status changes
caseSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      action: 'status_changed',
      description: `Status changed to ${this.status}`,
      previousValue: this.getChanges()?.status,
      newValue: this.status
    });
  }
  next();
});

// Static methods for analytics
caseSchema.statics.getCasesByStatus = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

caseSchema.statics.getCasesByRegion = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$region',
        count: { $sum: 1 },
        openCases: { $sum: { $cond: [{ $in: ['$status', ['Open', 'New', 'In Progress']] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

caseSchema.statics.getCasesByPriority = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
};

caseSchema.statics.getOpenCasesByOfficer = function() {
  return this.aggregate([
    { $match: { status: { $in: ['Open', 'New', 'In Progress'] } } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'officer'
      }
    },
    { $unwind: { path: '$officer', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$officer._id',
        officerName: { $first: '$officer.profile.firstName' },
        officerLastName: { $first: '$officer.profile.lastName' },
        department: { $first: '$officer.profile.department' },
        count: { $sum: 1 },
        highPriority: { $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const Case = mongoose.model('Case', caseSchema);

export default Case;

import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: [
      'sick',
      'casual',
      'emergency',
      'festive',
      'exam',
      'personal',
      'other'
    ],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'testing', 'approved', 'rejected', 'auto-rejected'],
    default: 'pending'
  },
  testRounds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSession'
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  passingThreshold: {
    type: Number,
    default: 70
  },
  autoApproved: {
    type: Boolean,
    default: false
  },
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comments: String,
    manualOverride: Boolean
  }
}, {
  timestamps: true
});

leaveRequestSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);

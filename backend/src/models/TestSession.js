import mongoose from 'mongoose';

const testSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  },
  leaveRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveRequest',
    required: false 
  },
  testType: {
    type: String,
    enum: ['mcq', 'coding'],
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.Mixed
  }],
  duration: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  startedAt: Date,
  submittedAt: Date,
  antiCheatFlags: {
  tabSwitches: { type: Number, default: 0 },
  copyAttempts: { type: Number, default: 0 },
  suspiciousActivity: {
    type: [String],
    default: []
  }
}

}, {
  timestamps: true
});

export default mongoose.model('TestSession', testSessionSchema);

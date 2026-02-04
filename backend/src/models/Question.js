import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'coding'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['mathematics', 'programming', 'data-structures', 'algorithms', 'database', 'web-development', 'general', 'general-knowledge', 'science', 'english', 'computer-science']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.type === 'coding' || (v && v.length >= 2);
      },
      message: 'MCQ must have at least 2 options'
    }
  },
  correctAnswer: {
    type: String,
    required: function() { return this.type === 'mcq'; }
  },
  explanation: String,
  codeTemplate: {
    type: String,
    required: function() { return this.type === 'coding'; }
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  constraints: String,
  points: {
    type: Number,
    default: 1
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Question', questionSchema);

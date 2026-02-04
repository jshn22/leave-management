import LeaveRequest from '../models/LeaveRequest.js';
import TestSession from '../models/TestSession.js';
import aiService from '../services/aiService.js';
import { AppError } from '../utils/errorHandler.js';

export const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, topic, difficulty } = req.body;
    const studentId = req.user._id;
    if (!leaveType || !startDate || !endDate || !reason) {
      throw new AppError('All fields are required', 400);
    }
    if (new Date(endDate) < new Date(startDate)) {
      throw new AppError('End date cannot be before start date', 400);
    }

    const existing = await LeaveRequest.findOne({
      student: studentId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for leave in this date range.'
      });
    }

    const leaveRequest = new LeaveRequest({
      student: studentId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'testing',
      testRounds: [],
    });
    await leaveRequest.save();

    let mcqQuestions, codingQuestions, aiWarning = null;
    try {
      mcqQuestions = await aiService.generateTest({
        topic: topic || 'General',
        type: 'mcq',
        numQuestions: 10,
        difficulty: difficulty || 'mixed'
      });
      codingQuestions = await aiService.generateTest({
        topic: topic || 'General',
        type: 'coding',
        numQuestions: 2,
        difficulty: difficulty || 'mixed'
      });
    } catch (err) {
      aiWarning = 'AI question generation failed, using mock questions.';
      mcqQuestions = await aiService.generateTest({
        topic: topic || 'General',
        type: 'mcq',
        numQuestions: 10,
        difficulty: difficulty || 'mixed'
      });
      codingQuestions = await aiService.generateTest({
        topic: topic || 'General',
        type: 'coding',
        numQuestions: 2,
        difficulty: difficulty || 'mixed'
      });
    }

    const mcqTest = new TestSession({
      user: studentId,
      leaveRequest: leaveRequest._id,
      testType: 'mcq',
      roundNumber: 1,
      questions: mcqQuestions,
      duration: 20,
      totalPoints: mcqQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
      status: 'not-started',
    });
    await mcqTest.save();

    const codingTest = new TestSession({
      user: studentId,
      leaveRequest: leaveRequest._id,
      testType: 'coding',
      roundNumber: 2,
      questions: codingQuestions,
      duration: 45,
      totalPoints: codingQuestions.reduce((sum, q) => sum + (q.points || 10), 0),
      status: 'not-started',
    });
    await codingTest.save();

    leaveRequest.testRounds.push(mcqTest._id, codingTest._id);
    await leaveRequest.save();

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully! Tests have been assigned.',
      data: leaveRequest,
      aiWarning 
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLeaveRequests = async (req, res, next) => {
  try {
    const leaveRequests = await LeaveRequest.find({ student: req.user._id })
      .populate({
        path: 'testRounds',
        model: 'TestSession',
      })
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      leaveRequests: leaveRequests || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message,
    });
  }
};

export const getLeaveRequestById = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findById(req.params.id)
      .populate('student', 'fullName email studentId department')
      .populate('testRounds')
      .populate('adminReview.reviewedBy', 'fullName');

    if (!request) {
      throw new AppError('Leave request not found', 404);
    }
    if (req.user.role === 'student' && request.student._id.toString() !== req.user._id.toString()) {
      throw new AppError('Unauthorized access', 403);
    }

    res.json({
      success: true,
      leaveRequest: request
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLeaveRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const requests = await LeaveRequest.find(query)
      .populate('student', 'fullName email studentId department semester')
      .populate('testRounds')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(query);

    res.json({
      success: true,
      leaveRequests: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments, manualOverride } = req.body;

    const leaveRequest = await LeaveRequest.findById(id)
      .populate('testRounds');

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }
    let totalScore = 0;
    let totalPoints = 0;
    
    leaveRequest.testRounds.forEach(session => {
      if (session.status === 'completed') {
        totalScore += session.score;
        totalPoints += session.totalPoints;
      }
    });

    const overallPercentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    leaveRequest.overallScore = overallPercentage;

    leaveRequest.adminReview = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      comments,
      manualOverride: manualOverride || false
    };

    if (status === 'approved' || status === 'rejected') {
      leaveRequest.status = status;
    } else if (manualOverride) {
      leaveRequest.status = 'approved';
      leaveRequest.autoApproved = false;
    } else if (overallPercentage >= leaveRequest.passingThreshold) {
      leaveRequest.status = 'approved';
      leaveRequest.autoApproved = true;
    } else {
      leaveRequest.status = 'auto-rejected';
    }

    await leaveRequest.save();

    res.json({
      success: true,
      message: 'Leave request reviewed successfully',
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentTestSession = async (req, res, next) => {
  try {
    const { leaveRequestId } = req.params;
    const testSession = await TestSession.findOne({
      leaveRequest: leaveRequestId,
      status: { $in: ['not-started', 'in-progress'] },
      user: req.user._id
    });

    if (!testSession) {
      return res.status(404).json({ success: false, message: 'No in-progress or not-started test found.' });
    }

    if (testSession.status === 'in-progress') {
      testSession.status = 'completed';
      testSession.endTime = new Date();
      await testSession.save();

      return res.status(200).json({
        success: false,
        message: 'Test terminated because you navigated away or refreshed the page.',
        testSession
      });
    }

    res.json({ success: true, testSession });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyLeaveStats = async (req, res, next) => {
  try {
    const stats = await LeaveRequest.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthlyData = months.map((name, idx) => {
      const found = stats.find(s => s._id === idx + 1);
      return { month: name, count: found ? found.count : 0 };
    });

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await LeaveRequest.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: {
            department: '$studentInfo.department',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const departments = {};
    stats.forEach(s => {
      const dept = s._id.department || 'Unknown';
      if (!departments[dept]) {
        departments[dept] = { department: dept, approved: 0, pending: 0, rejected: 0, total: 0 };
      }
      if (s._id.status === 'approved') departments[dept].approved = s.count;
      else if (s._id.status === 'pending' || s._id.status === 'testing') departments[dept].pending += s.count;
      else if (s._id.status === 'rejected' || s._id.status === 'auto-rejected') departments[dept].rejected += s.count;
      departments[dept].total += s.count;
    });

    res.json({ success: true, data: Object.values(departments) });
  } catch (error) {
    next(error);
  }
};
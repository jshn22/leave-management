import TestSession from '../models/TestSession.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { AppError } from '../utils/errorHandler.js';
import aiService from '../services/aiService.js';

export const startTest = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await TestSession.findById(sessionId);

    if (!session) {
      throw new AppError('Test session not found', 404);
    }
    if (session.user && session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Unauthorized access', 403);
    }

    if (session.status === 'completed') {
      throw new AppError('Test already completed', 400);
    }

    if (session.status === 'expired') {
      throw new AppError('Test has expired', 400);
    }

    if (session.roundNumber > 1) {
      const leaveRequest = await LeaveRequest.findById(session.leaveRequest)
        .populate('testRounds');
      
      const previousRound = leaveRequest.testRounds.find(
        r => r.roundNumber === session.roundNumber - 1
      );

      if (!previousRound || previousRound.status !== 'completed') {
        throw new AppError('Complete previous round first', 400);
      }
    }

    // If test is already in-progress, return the session (allow re-entry)
    if (session.status === 'in-progress') {
      console.log('🔄 Test already in progress, allowing re-entry');
      
      const sanitizedQuestions = session.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        codeTemplate: q.codeTemplate,
        points: q.points,
      }));

      return res.json({
        success: true,
        message: 'Test resumed',
        session: {
          _id: session._id,
          testType: session.testType,
          roundNumber: session.roundNumber,
          duration: session.duration,
          startTime: session.startTime,
          totalPoints: session.totalPoints,
          questions: sanitizedQuestions,
          status: session.status
        }
      });
    }

    // Start the test
    session.status = 'in-progress';
    session.startTime = new Date();
    await session.save();

    console.log('🧠 QUESTIONS COUNT:', session.questions.length);

    const sanitizedQuestions = session.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      codeTemplate: q.codeTemplate,
      points: q.points,
    }));

    res.json({
      success: true,
      message: 'Test started',
      session: {
        _id: session._id,
        testType: session.testType,
        roundNumber: session.roundNumber,
        duration: session.duration,
        startTime: session.startTime,
        totalPoints: session.totalPoints,
        questions: sanitizedQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitMCQAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId } = req.params;
    const { selectedAnswer } = req.body;

    const session = await TestSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Invalid session', 404);
    }

    if (session.status !== 'in-progress') {
      throw new AppError('Test is not active', 400);
    }

    const elapsed = (Date.now() - session.startTime) / 1000 / 60;
    if (elapsed > session.duration) {
      session.status = 'expired';
      await session.save();
      throw new AppError('Test time expired', 400);
    }
    const question = session.questions.find(
  q => q._id?.toString() === questionId
);


    if (!question) {
      throw new AppError('Question not found', 404);
    }

    question.selectedAnswer = selectedAnswer;

    await session.save();

    res.json({
      success: true,
      message: 'Answer saved'
    });
  } catch (error) {
    next(error);
  }
};

export const submitCodingAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId } = req.params;
    const { code } = req.body;

    const session = await TestSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Invalid session', 404);
    }

    if (session.status !== 'in-progress') {
      throw new AppError('Test is not active', 400);
    }
    const elapsed = (Date.now() - session.startTime) / 1000 / 60;
    if (elapsed > session.duration) {
      session.status = 'expired';
      await session.save();
      throw new AppError('Test time expired', 400);
    }

    const question = session.questions.id(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    question.submittedCode = code;

    await session.save();

    res.json({
      success: true,
      message: 'Code saved'
    });
  } catch (error) {
    next(error);
  }
};

export const submitTest = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answers, antiCheatData } = req.body;

    const session = await TestSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Invalid session', 404);
    }

    if (session.status === 'completed') {
      return res.json({
        success: true,
        message: 'Test already submitted',
        result: {
          score: session.score,
          totalPoints: session.totalPoints,
          percentage: session.percentage
        }
      });
    }

    // Mark as completed FIRST
    session.status = 'completed';
    session.endTime = new Date();
    session.submittedAt = new Date();

    if (antiCheatData) {
      session.antiCheatFlags = antiCheatData;
    }

    console.log('📊 Evaluating test submission...');

    if (session.testType === 'mcq') {
      let score = 0;
      let totalPoints = 0;

      session.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const correctAnswer = question.correctAnswer;
        const points = question.points || 1;

        totalPoints += points;

        const isCorrect = userAnswer && userAnswer === correctAnswer;

        if (isCorrect) {
          score += points;
          question.isCorrect = true;
        } else {
          question.isCorrect = false;
        }
        question.userAnswer = userAnswer;
      });

      session.score = score;
      session.totalPoints = totalPoints;
      session.percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    } else if (session.testType === 'coding') {
      let totalScore = 0;
      let totalPoints = 0;

      for (let i = 0; i < session.questions.length; i++) {
        const question = session.questions[i];
        const submittedCode = answers[i];
        
        totalPoints += question.points || 10;

        if (submittedCode) {
          const result = await aiService.evaluateCoding(
            submittedCode,
            question.testCases
          );

          question.testCases = result.testCaseResults || question.testCases;
          const passedRatio = result.failed ? (result.passed / (result.passed + result.failed)) : 0;
          const questionScore = Math.round((question.points || 10) * passedRatio);
          
          totalScore += questionScore;
        }
      }

      session.score = totalScore;
      session.totalPoints = totalPoints;
      session.percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    }

    await session.save();

    console.log('✅ Test submitted successfully:', {
      score: session.score,
      totalPoints: session.totalPoints,
      percentage: session.percentage.toFixed(2),
      status: session.status
    });

    if (session.leaveRequest) {
      await checkAndUpdateLeaveStatus(session.leaveRequest);
    }

    res.json({
      success: true,
      message: 'Test submitted successfully',
      result: {
        score: session.score,
        totalPoints: session.totalPoints,
        percentage: session.percentage
      }
    });
  } catch (error) {
    next(error);
  }
};

async function checkAndUpdateLeaveStatus(leaveRequestId) {
  const leaveRequest = await LeaveRequest.findById(leaveRequestId)
    .populate('testRounds');

  const allCompleted = leaveRequest.testRounds.every(
    session => session.status === 'completed'
  );

  if (allCompleted) {
    let totalScore = 0;
    let totalPoints = 0;

    leaveRequest.testRounds.forEach(session => {
      totalScore += session.score;
      totalPoints += session.totalPoints;
    });

    const overallPercentage = (totalScore / totalPoints) * 100;
    leaveRequest.overallScore = overallPercentage;

    if (overallPercentage >= leaveRequest.passingThreshold) {
      leaveRequest.status = 'approved';
      leaveRequest.autoApproved = true;
    } else {
      leaveRequest.status = 'auto-rejected';
    }

    await leaveRequest.save();
  }
}

export const getTestSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await TestSession.findById(sessionId);

    if (!session) {
      throw new AppError('Test session not found', 404);
    }

    if (req.user.role === 'student' && session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Unauthorized access', 403);
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

export const reportAntiCheat = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { type, details } = req.body;

    const session = await TestSession.findById(sessionId);

    if (!session || session.user.toString() !== req.user._id.toString()) {
      throw new AppError('Invalid session', 404);
    }

    if (type === 'tab-switch') {
      session.antiCheatFlags.tabSwitches += 1;
    } else if (type === 'copy-attempt') {
      session.antiCheatFlags.copyAttempts += 1;
    }

    if (details) {
      session.antiCheatFlags.suspiciousActivity.push(
        `${type}: ${details} at ${new Date().toISOString()}`
      );
    }

    await session.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const createAITestSession = async (req, res, next) => {
  try {
    const { topic, type, difficulty, numQuestions, duration } = req.body;
    const questions = await aiService.generateTest({
      topic,
      type,
      difficulty,
      numQuestions
    });

    const session = await TestSession.create({
      user: req.user._id,   
      testType: type,       
      roundNumber: 1,
      questions,           
      duration,
      status: 'not-started'
    });

    res.status(201).json({
      success: true,
      sessionId: session._id
    });

  } catch (error) {
    next(error);
  }
};

import { generateAIQuestions } from '../utils/aiQuestionGenerator.js';
import TestSession from '../models/TestSession.js';

class AIService {

  async generateTest({ topic, type, numQuestions, difficulty }) {
    try {
      const questions = await generateAIQuestions({
        topic,
        difficulty,
        numQuestions,
        type
      });

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.warn('⚠️ AI returned empty questions, using fallback');
        return this.getFallbackQuestions(type, numQuestions, topic);
      }

      return questions;

    } catch (error) {
      console.error('❌ AI generation failed, using fallback:', error.message);
      return this.getFallbackQuestions(type, numQuestions, topic);
    }
  }

  getFallbackQuestions(type, count, topic) {
    if (type === 'mcq') {
      const mcqQuestions = [
        {
          question: 'What is the time complexity of binary search?',
          options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
          correctAnswer: 'O(log n)',
          points: 1
        },
        {
          question: 'Which data structure uses LIFO principle?',
          options: ['Queue', 'Stack', 'Array', 'Tree'],
          correctAnswer: 'Stack',
          points: 1
        },
        {
          question: 'What does API stand for?',
          options: ['Application Programming Interface', 'Applied Programming Integration', 'Application Process Integration', 'Advanced Programming Interface'],
          correctAnswer: 'Application Programming Interface',
          points: 1
        },
        {
          question: 'Which sorting algorithm has O(n log n) average case complexity?',
          options: ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'],
          correctAnswer: 'Merge Sort',
          points: 1
        },
        {
          question: 'What is the main advantage of hash tables?',
          options: ['O(1) average lookup time', 'Sorted data', 'Less memory usage', 'No collisions'],
          correctAnswer: 'O(1) average lookup time',
          points: 1
        },
        {
          question: 'Which of the following is NOT a programming paradigm?',
          options: ['Object-Oriented', 'Functional', 'Procedural', 'Mythical'],
          correctAnswer: 'Mythical',
          points: 1
        }
      ];

      return mcqQuestions.slice(0, count).map((q, i) => ({
        ...q,
        question: q.question
      }));
    }
    const codingQuestions = [
      {
        question: 'Write a function to find the factorial of a number',
        testCases: [
          { input: '5', expectedOutput: '120' },
          { input: '3', expectedOutput: '6' }
        ],
        points: 10
      },
      {
        question: 'Write a function to check if a number is prime',
        testCases: [
          { input: '7', expectedOutput: 'true' },
          { input: '10', expectedOutput: 'false' }
        ],
        points: 10
      },
      {
        question: 'Write a function to reverse a string',
        testCases: [
          { input: 'hello', expectedOutput: 'olleh' },
          { input: 'test', expectedOutput: 'tset' }
        ],
        points: 10
      }
    ];

    return codingQuestions.slice(0, count);
  }
  evaluateMCQ(questions) {
    let score = 0;
    let totalPoints = 0;

    questions.forEach(q => {
      totalPoints += q.points || 1;
      if (q.selectedAnswer === q.correctAnswer) {
        score += q.points || 1;
      }
    });

    return {
      score,
      totalPoints,
      percentage: totalPoints ? (score / totalPoints) * 100 : 0
    };
  }

  async calculateScore(sessionId, userAnswers) {
    try {
      const test = await TestSession.findById(sessionId).populate('questions');
      if (!test) {
        throw new Error('Test session not found');
      }

      let score = 0;
      const feedback = [];

      for (const answer of userAnswers) {
        const question = test.questions.find(
          (q) => q._id.toString() === answer.questionId
        );

        if (question) {
          const isCorrect = question.correctAnswer === answer.answer;
          if (isCorrect) {
            score++;
          }
          feedback.push({
            question: question.question,
            userAnswer: answer.answer,
            correctAnswer: question.correctAnswer,
            isCorrect,
          });
        }
      }

      test.score = score;
      test.status = 'completed';
      test.userAnswers = userAnswers;
      await test.save();

      return { score, total: test.questions.length, feedback };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw new Error('Failed to calculate score');
    }
  }
  async evaluateCoding(code, testCases) {
    let passed = 0;

    for (const testCase of testCases) {
      try {
        const output = this.executeSafeCode(code, testCase.input);
        if (String(output).trim() === String(testCase.expectedOutput).trim()) {
          passed++;
        }
      } catch (err) {
        // ignore
      }
    }

    return {
      passed,
      failed: testCases.length - passed
    };
  }

  executeSafeCode(code, input) {
    const fn = new Function('input', `
      ${code}
      return typeof solution === 'function' ? solution(input) : null;
    `);
    return fn(input);
  }
}

export default new AIService();

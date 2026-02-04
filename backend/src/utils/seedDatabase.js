import Question from '../models/Question.js';
import User from '../models/User.js';

export const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@university.edu' });
    if (!adminExists) {
      await User.create({
        email: 'admin@university.edu',
        password: 'admin123',
        fullName: 'System Admin',
        role: 'admin'
      });
    }

    const questionCount = await Question.countDocuments();
    if (questionCount > 0) {
      console.log('✅ Database already seeded with questions');
      return;
    }

    const mcqQuestions = [
      {
        subject: 'web-development',
        type: 'mcq',
        difficulty: 'easy',
        question: 'What does HTML stand for?',
        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
        correctAnswer: 'Hyper Text Markup Language',
        points: 1
      },
      {
        subject: 'web-development',
        type: 'mcq',
        difficulty: 'easy',
        question: 'Which language is primarily used for web development?',
        options: ['Python', 'JavaScript', 'C++', 'Java'],
        correctAnswer: 'JavaScript',
        points: 1
      },
      {
        subject: 'data-structures',
        type: 'mcq',
        difficulty: 'medium',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
        correctAnswer: 'O(log n)',
        points: 2
      },
      {
        subject: 'data-structures',
        type: 'mcq',
        difficulty: 'medium',
        question: 'Which data structure uses LIFO?',
        options: ['Queue', 'Stack', 'Array', 'Tree'],
        correctAnswer: 'Stack',
        points: 2
      },
      {
        subject: 'algorithms',
        type: 'mcq',
        difficulty: 'hard',
        question: 'What is the space complexity of merge sort?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(n)',
        points: 3
      },
    ];

    const codingQuestions = [
      {
        subject: 'programming',
        type: 'coding',
        difficulty: 'easy',
        question: 'Write a function that returns the sum of two numbers.',
        testCases: [
          { input: '2,3', expectedOutput: '5' },
          { input: '10,5', expectedOutput: '15' },
          { input: '-1,1', expectedOutput: '0' }
        ],
        codeTemplate: `function solution(input) {
        // TODO
          return input;
         }`,
        points: 10
      },
      {
        subject: 'programming',
        type: 'coding',
        difficulty: 'medium',
        question: 'Write a function that checks if a string is a palindrome.',
        testCases: [
          { input: 'racecar', expectedOutput: 'true' },
          { input: 'hello', expectedOutput: 'false' },
          { input: 'noon', expectedOutput: 'true' }
        ],
        codeTemplate: `function solution(input) {
         // TODO
        return input;
}`,
        points: 15
      },
    ];

    await Question.insertMany([...mcqQuestions, ...codingQuestions]);
    console.log('✅ Database seeded with sample questions');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};
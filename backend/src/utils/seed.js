import Question from '../models/Question.js';
import User from '../models/User.js';

export async function seedDatabase() {
  try {
    const questionCount = await Question.countDocuments();
    if (questionCount > 0) {
      return;
    }
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        email: 'admin@university.edu',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'admin'
      });
    }

    const mcqQuestions = [
      {
        type: 'mcq',
        subject: 'programming',
        difficulty: 'easy',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        correctAnswer: 'O(log n)',
        explanation: 'Binary search divides the search space in half with each iteration.',
        points: 1,
        tags: ['algorithms', 'complexity']
      },
      {
        type: 'mcq',
        subject: 'data-structures',
        difficulty: 'easy',
        question: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Tree'],
        correctAnswer: 'Stack',
        explanation: 'Stack follows Last-In-First-Out principle.',
        points: 1,
        tags: ['data-structures', 'basics']
      },
      {
        type: 'mcq',
        subject: 'programming',
        difficulty: 'medium',
        question: 'What is a closure in JavaScript?',
        options: [
          'A loop structure',
          'A function with access to outer scope',
          'A class method',
          'An error handling mechanism'
        ],
        correctAnswer: 'A function with access to outer scope',
        explanation: 'A closure gives access to an outer function\'s scope from an inner function.',
        points: 2,
        tags: ['javascript', 'functions']
      },
      {
        type: 'mcq',
        subject: 'algorithms',
        difficulty: 'medium',
        question: 'Which sorting algorithm has O(n²) worst-case complexity?',
        options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Heap Sort'],
        correctAnswer: 'Bubble Sort',
        explanation: 'Bubble sort has O(n²) time complexity in worst and average cases.',
        points: 2,
        tags: ['sorting', 'complexity']
      },
      {
        type: 'mcq',
        subject: 'database',
        difficulty: 'medium',
        question: 'What is a primary key in a database?',
        options: [
          'A key that opens the database',
          'A unique identifier for each record',
          'The first column in a table',
          'A password for database access'
        ],
        correctAnswer: 'A unique identifier for each record',
        explanation: 'Primary key uniquely identifies each record in a database table.',
        points: 2,
        tags: ['database', 'keys']
      },
      {
        type: 'mcq',
        subject: 'programming',
        difficulty: 'hard',
        question: 'What is the difference between process and thread?',
        options: [
          'No difference',
          'Process is lighter than thread',
          'Thread is an execution unit within a process',
          'Thread has separate memory space'
        ],
        correctAnswer: 'Thread is an execution unit within a process',
        explanation: 'Threads share the same memory space within a process.',
        points: 3,
        tags: ['operating-systems', 'concurrency']
      },
      {
        type: 'mcq',
        subject: 'algorithms',
        difficulty: 'hard',
        question: 'Which algorithm is best for finding shortest paths in a graph?',
        options: ['DFS', 'BFS', 'Dijkstra', 'Binary Search'],
        correctAnswer: 'Dijkstra',
        explanation: 'Dijkstra\'s algorithm finds shortest paths from source to all vertices.',
        points: 3,
        tags: ['graphs', 'shortest-path']
      },
      {
        type: 'mcq',
        subject: 'web-development',
        difficulty: 'easy',
        question: 'What does HTTP stand for?',
        options: [
          'Hyper Text Transfer Protocol',
          'High Transfer Text Protocol',
          'Hyper Transfer Text Protocol',
          'High Text Transfer Protocol'
        ],
        correctAnswer: 'Hyper Text Transfer Protocol',
        points: 1,
        tags: ['web', 'protocols']
      },
      {
        type: 'mcq',
        subject: 'programming',
        difficulty: 'medium',
        question: 'What is recursion?',
        options: [
          'A loop structure',
          'A function calling itself',
          'A data structure',
          'An error type'
        ],
        correctAnswer: 'A function calling itself',
        explanation: 'Recursion is when a function calls itself to solve a problem.',
        points: 2,
        tags: ['functions', 'algorithms']
      },
      {
        type: 'mcq',
        subject: 'data-structures',
        difficulty: 'hard',
        question: 'What is the space complexity of merge sort?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(n)',
        explanation: 'Merge sort requires O(n) additional space for merging.',
        points: 3,
        tags: ['sorting', 'space-complexity']
      }
    ];

    const codingQuestions = [
      {
        type: 'coding',
        subject: 'programming',
        difficulty: 'easy',
        question: 'Write a function that returns the sum of two numbers.',
        codeTemplate: `function solution(a, b) {
  // Write your code here
  
}`,
        testCases: [
          { input: '2,3', expectedOutput: '5' },
          { input: '10,20', expectedOutput: '30' },
          { input: '-5,5', expectedOutput: '0' },
          { input: '0,0', expectedOutput: '0', isHidden: true }
        ],
        points: 10,
        tags: ['basics', 'functions']
      },
      {
        type: 'coding',
        subject: 'algorithms',
        difficulty: 'easy',
        question: 'Write a function to check if a number is even.',
        codeTemplate: `function solution(num) {
  // Return true if even, false if odd
  
}`,
        testCases: [
          { input: '4', expectedOutput: 'true' },
          { input: '7', expectedOutput: 'false' },
          { input: '0', expectedOutput: 'true' },
          { input: '-2', expectedOutput: 'true', isHidden: true }
        ],
        points: 10,
        tags: ['basics', 'conditionals']
      },
      {
        type: 'coding',
        subject: 'data-structures',
        difficulty: 'medium',
        question: 'Write a function to reverse a string.',
        codeTemplate: `function solution(str) {
  // Write your code here
  
}`,
        testCases: [
          { input: 'hello', expectedOutput: 'olleh' },
          { input: 'world', expectedOutput: 'dlrow' },
          { input: 'a', expectedOutput: 'a' },
          { input: '', expectedOutput: '', isHidden: true }
        ],
        points: 15,
        tags: ['strings', 'manipulation']
      },
      {
        type: 'coding',
        subject: 'algorithms',
        difficulty: 'medium',
        question: 'Write a function to find the maximum number in an array.',
        codeTemplate: `function solution(arr) {
  // arr is an array of numbers
  // Return the maximum value
  
}`,
        testCases: [
          { input: '[1,2,3,4,5]', expectedOutput: '5' },
          { input: '[10,5,8,3]', expectedOutput: '10' },
          { input: '[-1,-5,-3]', expectedOutput: '-1' },
          { input: '[42]', expectedOutput: '42', isHidden: true }
        ],
        points: 15,
        tags: ['arrays', 'search']
      }
    ];

    await Question.insertMany([...mcqQuestions, ...codingQuestions]);
  } catch (error) {
    console.error(' Error seeding database:', error);
  }
}

import axios from 'axios';

export async function generateAIQuestions({ topic, difficulty, numQuestions, type }) {
  console.log('🔥 AI QUESTION GENERATION STARTED');
  console.log(`📋 Parameters: Topic="${topic}", Type="${type}", Difficulty="${difficulty}", Count=${numQuestions}`);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY is missing from .env file!');
    return fallbackQuestions(type, numQuestions);
  }

  console.log('✅ Gemini API Key found');

  const prompt = type === 'mcq'
    ? `You are a test generator. Create ${numQuestions} multiple-choice questions about ${topic || 'programming'} at ${difficulty} difficulty.

IMPORTANT: Return ONLY a valid JSON array. No text before or after. No markdown formatting.

[
  {
    "question": "Clear question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "points": 1,
    "explanation": "Why this answer is correct"
  }
]

Requirements:
- Make questions practical and educational
- All 4 options must be plausible
- correctAnswer must exactly match one option
- Each question tests a different concept`
    : `You are a coding problem generator. Create ${numQuestions} coding problems about ${topic || 'programming'} at ${difficulty} difficulty.

IMPORTANT: Return ONLY a valid JSON array. No text before or after. No markdown formatting.

[
  {
    "question": "Problem statement with example",
    "codeTemplate": "function solution(input) {\\n  // Your code here\\n  return result;\\n}",
    "testCases": [
      {"input": "test1", "expectedOutput": "output1"},
      {"input": "test2", "expectedOutput": "output2"},
      {"input": "test3", "expectedOutput": "output3"}
    ],
    "points": 10,
    "constraints": "Time: 2s, Memory: 256MB"
  }
]

Requirements:
- Include clear problem descriptions
- Provide 3 diverse test cases
- Make problems solvable in 5-10 minutes`;

  try {
    console.log('📤 Sending request to Gemini API...');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
    
    const response = await axios.post(
      apiUrl,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    console.log('✅ Gemini API responded successfully');

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error('❌ Empty response from Gemini API');
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      return fallbackQuestions(type, numQuestions);
    }

    console.log('📝 Response received, length:', rawText.length);
    console.log('📝 First 200 chars:', rawText.substring(0, 200));

    const questions = parseJsonResponse(rawText);

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('❌ Failed to parse questions from response');
      console.log('Raw text:', rawText);
      return fallbackQuestions(type, numQuestions);
    }

    const validQuestions = questions
      .filter(q => validateQuestion(q, type))
      .slice(0, numQuestions);

    if (validQuestions.length === 0) {
      console.error('❌ No valid questions after validation');
      console.log('Sample question:', questions[0]);
      return fallbackQuestions(type, numQuestions);
    }

    console.log(`✅ SUCCESS! Generated ${validQuestions.length} REAL AI questions from Gemini!`);
    console.log('Sample question:', validQuestions[0].question);
    
    return validQuestions;

  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error('Bad Request - Check API key or request format');
      } else if (error.response.status === 403) {
        console.error('Forbidden - API key may be invalid or restricted');
      } else if (error.response.status === 429) {
        console.error('Rate limit exceeded - Please wait before trying again');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - API took too long to respond');
    } else {
      console.error('Network or unknown error');
    }
    
    return fallbackQuestions(type, numQuestions);
  }
}

function parseJsonResponse(text) {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.log('Direct JSON parse failed, trying extraction...');
  }

  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find JSON array
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd === -1) {
    console.error('❌ No JSON array found in text');
    return null;
  }

  const jsonStr = cleaned.substring(arrayStart, arrayEnd + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ JSON parse error:', error.message);
    console.log('Attempted to parse:', jsonStr.substring(0, 200));
    return null;
  }
}

function validateQuestion(q, type) {
  if (type === 'mcq') {
    const isValid = 
      q.question && 
      q.options && 
      Array.isArray(q.options) && 
      q.options.length >= 2 && 
      q.correctAnswer && 
      typeof q.points === 'number';
    
    if (!isValid) {
      console.warn('Invalid MCQ question:', q);
    }
    return isValid;
  }
  
  const isValid = 
    q.question && 
    q.testCases && 
    Array.isArray(q.testCases) && 
    q.testCases.length >= 2 &&
    typeof q.points === 'number';
  
  if (!isValid) {
    console.warn('Invalid coding question:', q);
  }
  return isValid;
}

function fallbackQuestions(type, count) {
  console.warn('⚠️ USING FALLBACK QUESTIONS - AI generation failed');
  
  if (type === 'mcq') {
    const questions = [
      {
        question: 'What is the time complexity of binary search algorithm?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
        correctAnswer: 'O(log n)',
        points: 1,
        explanation: 'Binary search divides the search space in half each time'
      },
      {
        question: 'Which data structure follows LIFO (Last In First Out)?',
        options: ['Queue', 'Stack', 'Array', 'Tree'],
        correctAnswer: 'Stack',
        points: 1,
        explanation: 'Stack operates on LIFO principle'
      },
      {
        question: 'What does REST stand for in web APIs?',
        options: ['Representational State Transfer', 'Remote End Server Technology', 'Resource Enumeration Standard', 'Reactive Execution Service'],
        correctAnswer: 'Representational State Transfer',
        points: 1,
        explanation: 'REST is an architectural style for web services'
      },
      {
        question: 'Which sorting algorithm has O(n log n) average complexity?',
        options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
        correctAnswer: 'Quick Sort',
        points: 1,
        explanation: 'Quick Sort uses divide and conquer approach'
      },
      {
        question: 'What is the main advantage of hash tables?',
        options: ['Sorted data', 'O(1) average lookup', 'Less memory', 'No collisions'],
        correctAnswer: 'O(1) average lookup',
        points: 1,
        explanation: 'Hash tables provide constant-time average lookups'
      }
    ];
    return questions.slice(0, count);
  }

  const questions = [
    {
      question: 'Write a function to calculate factorial of a number.\nExample: factorial(5) = 120',
      codeTemplate: 'function factorial(n) {\n  // Your code here\n  return result;\n}',
      testCases: [
        { input: '5', expectedOutput: '120' },
        { input: '3', expectedOutput: '6' },
        { input: '0', expectedOutput: '1' }
      ],
      points: 10,
      constraints: 'Time: 2s, Memory: 256MB'
    },
    {
      question: 'Write a function to check if a number is prime.\nExample: isPrime(7) = true',
      codeTemplate: 'function isPrime(n) {\n  // Your code here\n  return true/false;\n}',
      testCases: [
        { input: '7', expectedOutput: 'true' },
        { input: '10', expectedOutput: 'false' },
        { input: '2', expectedOutput: 'true' }
      ],
      points: 10,
      constraints: 'Time: 2s, Memory: 256MB'
    },
    {
      question: 'Write a function to reverse a string.\nExample: reverse("hello") = "olleh"',
      codeTemplate: 'function reverse(str) {\n  // Your code here\n  return reversed;\n}',
      testCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'world', expectedOutput: 'dlrow' },
        { input: 'a', expectedOutput: 'a' }
      ],
      points: 10,
      constraints: 'Time: 2s, Memory: 256MB'
    }
  ];
  return questions.slice(0, count);
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TestResult() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/tests/${sessionId}`);
      setSession(response.data.session);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" />
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Test results not found</p>
        </div>
      </Layout>
    );
  }

  const isPassed = session.percentage >= 70;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Results</h1>

        {/* Score Card */}
        <div className={`rounded-lg shadow p-8 mb-8 ${isPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="text-center">
            <div className={`text-6xl font-bold mb-4 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {session.percentage.toFixed(1)}%
            </div>
            <div className="text-2xl font-semibold mb-2">
              {session.score} / {session.totalPoints} points
            </div>
            <div className={`text-lg ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
              {isPassed ? '✓ Passed' : '✗ Below Threshold'}
            </div>
          </div>
        </div>

        {/* Test Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Test Type:</span>
              <span className="ml-2 font-medium">{session.testType === 'mcq' ? 'Multiple Choice' : 'Coding'}</span>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="ml-2 font-medium">{session.duration} minutes</span>
            </div>
            <div>
              <span className="text-gray-600">Questions:</span>
              <span className="ml-2 font-medium">{session.questions?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-medium">{new Date(session.submittedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Question Review</h2>
          <div className="space-y-6">
            {session.questions && session.questions.map((q, index) => {
              const userAnswerTrimmed = (q.userAnswer || '').trim();
              const correctAnswerTrimmed = (q.correctAnswer || '').trim();
             const normalize = (val) => (val || '').toString().trim().toLowerCase();
             const isCorrect = normalize(q.userAnswer) === normalize(q.correctAnswer);

              
              return (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'} - {q.points || 1} points
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{q.question}</p>

                  {session.testType === 'mcq' && q.options && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((option, i) => {
                        const optionTrimmed = (option || '').trim();
                        
                        // Determine styling based on a single check
                        let bgColor = 'bg-gray-50';
                        let borderColor = 'border-gray-200';
                        let label = null;
                        
                        if (optionTrimmed === correctAnswerTrimmed) {
                          // This is the correct answer - always show in green
                          bgColor = 'bg-green-100';
                          borderColor = 'border-green-300';
                          label = <span className="text-green-700 font-medium">✓ Correct Answer</span>;
                        } else if (optionTrimmed === userAnswerTrimmed) {
                          // This was user's wrong answer - show in red
                          bgColor = 'bg-red-100';
                          borderColor = 'border-red-300';
                          label = <span className="text-red-700 font-medium">✗ Your Answer</span>;
                        }

                        return (
                          <div key={i} className={`p-3 rounded-md border-2 ${bgColor} ${borderColor}`}>
                            <div className="flex justify-between items-center">
                              <span>{option}</span>
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <Link
            to={session.leaveRequest ? `/leaves/${session.leaveRequest}` : '/dashboard'}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}
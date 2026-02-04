import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function TestSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const antiCheatRef = useRef({ tabSwitches: 0, copyAttempts: 0 });
  const sessionRef = useRef(session);
  const answersRef = useRef(answers);
  const hasNavigatedRef = useRef(false);

  const autoSubmitTestOnLeave = useCallback(async () => {
    if (sessionRef.current && sessionRef.current.status === 'in-progress') {
      console.log('🚨 AUTO-SUBMITTING TEST...');
      
      const baseURL = api.defaults?.baseURL || 'http://localhost:5002/api';
      const cleanBaseURL = baseURL.replace(/\/$/, '');
      const url = `${cleanBaseURL}/tests/${sessionId}/submit`;
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const data = {
        answers: answersRef.current,
        antiCheatData: antiCheatRef.current
      };
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          keepalive: true,
        });
        console.log('✅ Auto-submit successful');
        if (sessionRef.current) sessionRef.current.status = 'completed';
      } catch (err) {
        console.error("❌ Auto-submit failed:", err);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
  const originalPush = navigate;

  return () => {
    if (!hasNavigatedRef.current && sessionRef.current?.status === 'in-progress') {
      hasNavigatedRef.current = true;
      autoSubmitTestOnLeave();
    }
  };
}, [navigate, autoSubmitTestOnLeave]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (autoSubmit) {
      return autoSubmitTestOnLeave();
    }

    const confirm = window.confirm('Are you sure you want to submit? You cannot change answers after submission.');
    if (!confirm) return;

    setSubmitting(true);
    
    try {
      await api.post(`/tests/${sessionId}/submit`, {
        answers: answersRef.current,
        antiCheatData: antiCheatRef.current
      });
      
      toast.success('Test submitted successfully!');
      navigate(`/tests/${sessionId}/result`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  }, [sessionId, navigate, autoSubmitTestOnLeave]);

  const updateTimer = useCallback((endTime) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    setTimeRemaining(remaining);
    
    if (remaining === 0) {
      handleSubmit(true);
    }
  }, [handleSubmit]);

  const pauseTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPaused(true);
  }, []);

  const resumeTest = useCallback(() => {
    enterFullscreen();
    setIsPaused(false);
    const newEndTime = Date.now() + timeRemaining;
    timerRef.current = setInterval(() => updateTimer(newEndTime), 1000);
  }, [timeRemaining, updateTimer]);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
      pauseTest();
    }
  }, [pauseTest]);

  const handleBeforeUnload = useCallback((e) => {
    if (sessionRef.current && sessionRef.current.status === 'in-progress') {
      e.returnValue = 'Are you sure you want to leave? Your test will be submitted automatically.';
      autoSubmitTestOnLeave();
      return e.returnValue;
    }
  }, [autoSubmitTestOnLeave]);

  const startTest = useCallback(async () => {
    try {
      enterFullscreen();
      const response = await api.post(`/tests/${sessionId}/start`);
      const sessionData = response.data.testSession || response.data.session;

      if (response.data.success === false) {
        toast.error(response.data.message || 'Test terminated.');
        navigate('/dashboard');
        return;
      }

      if (!sessionData) {
        throw new Error('Invalid session data received');
      }

      setSession(sessionData);
      
      const duration = (sessionData.duration || 20) * 60 * 1000;
      const endTime = Date.now() + duration;
      
      updateTimer(endTime);
      timerRef.current = setInterval(() => updateTimer(endTime), 1000);
      
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start test');
      navigate('/dashboard');
    }
  }, [navigate, sessionId, updateTimer]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
    } else if (elem.mozRequestFullScreen) { 
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { 
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { 
      elem.msRequestFullscreen();
    }
  };

  const setupAntiCheat = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        antiCheatRef.current.tabSwitches += 1;
        reportAntiCheat('tab-switch', 'User switched tabs');
        toast.error('⚠️ Tab switch detected!');
      }
    };

    const handleCopy = (e) => {
      antiCheatRef.current.copyAttempts += 1;
      reportAntiCheat('copy-attempt', 'Copy attempt detected');
      toast.error('⚠️ Copy is not allowed!');
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
    };
  }, [sessionId]);

  useEffect(() => {
    startTest();
    const cleanupAntiCheat = setupAntiCheat();
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      autoSubmitTestOnLeave();
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAntiCheat();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [sessionId, startTest, setupAntiCheat, handleBeforeUnload, handleFullscreenChange, autoSubmitTestOnLeave]);

  const reportAntiCheat = async (type, details) => {
    try {
      await api.post(`/tests/${sessionId}/anti-cheat`, { type, details });
    } catch (error) {
      console.error('Failed to report anti-cheat:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };
  
  if (isPaused) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex flex-col items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Test Paused</h2>
          <p className="text-lg mb-8">You must be in fullscreen mode to continue the test.</p>
          <button
            onClick={resumeTest}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xl font-semibold"
          >
            Re-enter Fullscreen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" />
      </Layout>
    );
  }

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to load test session</h2>
          <p className="text-gray-600 mb-6">The test session could not be initialized properly.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session.testType === 'mcq' ? 'MCQ Test' : 'Coding Test'} - Round {session.roundNumber}
            </h1>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </div>
          </div>
          <div className={`text-2xl font-bold ${timeRemaining < 300000 ? 'text-red-600' : 'text-blue-600'}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {session.questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-md font-medium transition ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[index]
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentQuestion?.points || 1} points
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{currentQuestion?.question}</p>
          </div>

          {session.testType === 'mcq' && currentQuestion?.options ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    answers[currentQuestionIndex] === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          ) : session.testType === 'coding' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write your code:
              </label>
              <textarea
                value={answers[currentQuestionIndex] || currentQuestion?.codeTemplate || ''}
                onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="// Write your solution here"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Unable to display question
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <div className="flex gap-4">
            {currentQuestionIndex < session.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

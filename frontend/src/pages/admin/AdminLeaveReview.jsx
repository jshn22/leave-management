import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminLeaveReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    comments: '',
    manualOverride: false
  });

  useEffect(() => {
    fetchLeaveDetails();
  }, [id]);

  const fetchLeaveDetails = async () => {
    try {
      const response = await api.get(`/leaves/${id}`);
      setLeave(response.data.leaveRequest);
    } catch (error) {
      console.error('Error fetching leave details:', error);
      toast.error('Failed to load leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!reviewData.comments.trim() && status === 'rejected') {
      toast.error('Please provide comments for rejection');
      return;
    }

    setReviewing(true);
    try {
      const payload = {
        status,
        comments: reviewData.comments || '',
        manualOverride: reviewData.manualOverride
      };
      
      console.log('Sending review request:', payload); 
      
      const response = await api.put(`/leaves/${id}/review`, payload);
      console.log('Review response:', response.data); 
      
      toast.success(`Leave request ${status}!`);
      
      setTimeout(() => {
        navigate('/admin/leaves');
      }, 1000);
    } catch (error) {
      console.error('Review error:', error); 
      const errorMessage = error.response?.data?.message || error.message || 'Failed to review request';
      toast.error(errorMessage);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" />
      </Layout>
    );
  }

  if (!leave) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Leave request not found</p>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'auto-rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canReview = ['pending', 'auto-rejected'].includes(leave.status);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/leaves" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Manage Leaves
        </Link>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Information</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <p className="font-medium">{leave.student.fullName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Student ID</label>
              <p className="font-medium">{leave.student.studentId}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Department</label>
              <p className="font-medium">{leave.student.department}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Semester</label>
              <p className="font-medium">{leave.student.semester}</p>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Leave Request Details</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
              {leave.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm text-gray-600">Start Date</label>
              <p className="text-lg font-medium">{new Date(leave.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">End Date</label>
              <p className="text-lg font-medium">{new Date(leave.endDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-600">Reason</label>
            <p className="text-gray-900 mt-1">{leave.reason}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-600">Submitted On</label>
            <p className="text-gray-900 mt-1">{new Date(leave.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {leave.testRounds.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Test Performance</h2>
            
            {leave.overallScore > 0 && (
              <div className={`rounded-lg p-6 mb-6 ${
                leave.overallScore >= leave.passingThreshold ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${
                    leave.overallScore >= leave.passingThreshold ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {leave.overallScore.toFixed(1)}%
                  </div>
                  <div className="text-lg">
                    {leave.overallScore >= leave.passingThreshold ? '✓ Above Threshold' : '✗ Below Threshold'} (Required: {leave.passingThreshold}%)
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {leave.testRounds.map((round) => (
                <div key={round._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Round {round.roundNumber}: {round.testType === 'mcq' ? 'MCQ Test' : 'Coding Test'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {round.questions.length} questions • {round.duration} minutes
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      round.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {round.status}
                    </span>
                  </div>

                  {round.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{round.score}</div>
                          <div className="text-sm text-gray-600">Score</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{round.totalPoints}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{round.percentage.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Percentage</div>
                        </div>
                      </div>

                      {round.antiCheatFlags && (round.antiCheatFlags.tabSwitches > 0 || round.antiCheatFlags.copyAttempts > 0) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm font-medium text-yellow-800">⚠️ Anti-Cheat Flags:</p>
                          <ul className="text-sm text-yellow-700 mt-1">
                            {round.antiCheatFlags.tabSwitches > 0 && (
                              <li>• Tab switches: {round.antiCheatFlags.tabSwitches}</li>
                            )}
                            {round.antiCheatFlags.copyAttempts > 0 && (
                              <li>• Copy attempts: {round.antiCheatFlags.copyAttempts}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {canReview && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Decision</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add your comments..."
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reviewData.manualOverride}
                  onChange={(e) => setReviewData({ ...reviewData, manualOverride: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Manual Override (Approve regardless of test score)
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleReview('approved')}
                disabled={reviewing}
                className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-green-400 transition font-medium"
              >
                {reviewing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReview('rejected')}
                disabled={reviewing}
                className="flex-1 bg-red-600 text-white py-3 rounded-md hover:bg-red-700 disabled:bg-red-400 transition font-medium"
              >
                {reviewing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
        {leave.adminReview?.comments && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Previous Admin Review</h3>
            <p className="text-gray-700 mb-2">{leave.adminReview.comments}</p>
            <p className="text-sm text-gray-500">
              Reviewed by: {leave.adminReview.reviewedBy?.fullName} on {new Date(leave.adminReview.reviewedAt).toLocaleDateString()}
            </p>
            {leave.adminReview.manualOverride && (
              <p className="text-sm text-blue-600 mt-2">✓ Manual override applied</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

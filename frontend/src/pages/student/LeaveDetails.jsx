import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function LeaveDetails() {
  const { id } = useParams();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveDetails();
  }, [id]);

  const fetchLeaveDetails = async () => {
    try {
      const response = await api.get(`/leaves/${id}`);
      setLeave(response.data.leaveRequest);
    } catch (error) {
      console.error('Error fetching leave details:', error);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link to="/leaves" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Leave Requests
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
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

          {leave.overallScore > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Test Performance</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {leave.overallScore.toFixed(1)}%
              </div>
              <p className="text-sm text-blue-800">
                {leave.overallScore >= leave.passingThreshold ? '✓ Passed' : '✗ Below threshold'} (Required: {leave.passingThreshold}%)
              </p>
            </div>
          )}

          {leave.adminReview?.comments && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Admin Comments</h3>
              <p className="text-gray-700">{leave.adminReview.comments}</p>
              <p className="text-sm text-gray-500 mt-2">
                Reviewed by: {leave.adminReview.reviewedBy?.fullName} on {new Date(leave.adminReview.reviewedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Rounds</h2>
          <div className="space-y-4">
            {leave.testRounds.map((round, index) => (
              <div key={round._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Round {round.roundNumber}: {round.testType === 'mcq' ? 'MCQ Test' : 'Coding Test'}
                    </h3>
                    <p className="text-sm text-gray-600">Duration: {round.duration} minutes</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    round.status === 'completed' ? 'bg-green-100 text-green-800' :
                    round.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {round.status}
                  </span>
                </div>

                {round.status === 'completed' && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">Score: </span>
                      <span className="font-bold text-lg">
                        {round.score}/{round.totalPoints} ({round.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Link
                      to={`/tests/${round._id}/result`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Results →
                    </Link>
                  </div>
                )}

                {round.status === 'not-started' && leave.status === 'testing' && (
                  <Link
                    to={`/tests/${round._id}`}
                    className="mt-3 block text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    Start Test
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

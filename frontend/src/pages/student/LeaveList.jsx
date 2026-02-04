import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'approved':
      return <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>;
    case 'pending':
    case 'testing':
      return <div className="w-6 h-6 rounded-full flex items-center justify-center bg-yellow-100"><svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg></div>;
    case 'rejected':
    case 'auto-rejected':
      return <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100"><svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>;
    default:
      return null;
  }
};

const StatusBadge = ({ status }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full capitalize';
  switch (status) {
    case 'approved':
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>Approved</span>;
    case 'pending':
    case 'testing':
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>Pending</span>;
    case 'rejected':
    case 'auto-rejected':
      return <span className={`${baseClasses} bg-red-100 text-red-700`}>Rejected</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{status}</span>;
  }
};

const LeaveCard = ({ leave }) => {
  const getDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <Link to={`/leaves/${leave._id}`} className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-accent-blue transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 capitalize">{leave.leaveType} Leave</h3>
            <StatusBadge status={leave.status} />
          </div>
          <p className="text-sm text-gray-600">{leave.reason}</p>
        </div>
        <StatusIcon status={leave.status} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Start Date</p>
          <p className="font-semibold text-gray-800">{new Date(leave.startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">End Date</p>
          <p className="font-semibold text-gray-800">{new Date(leave.endDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold text-gray-800">{getDuration(leave.startDate, leave.endDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Applied On</p>
          <p className="font-semibold text-gray-800">{new Date(leave.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </Link>
  );
};

export default function LeaveList() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await api.get('/leaves/my-requests');
        setLeaves(response.data.leaveRequests);
      } catch (error) {
        console.error("Failed to fetch leave requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
          <Link
            to="/leaves/new"
            className="flex items-center space-x-2 bg-accent-blue text-white px-5 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>New Request</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {leaves.length > 0 ? (
              leaves.map(leave => <LeaveCard key={leave._id} leave={leave} />)
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">No Leave Requests Found</h3>
                <p className="text-gray-500 mt-2">You haven't submitted any leave requests yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
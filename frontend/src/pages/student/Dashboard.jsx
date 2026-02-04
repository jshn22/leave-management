import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  approved: {
    badge: 'bg-green-100 text-green-700',
    icon: (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
        </svg>
      </span>
    ),
  },
  pending: {
    badge: 'bg-yellow-100 text-yellow-700',
    icon: (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100">
        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2" />
        </svg>
      </span>
    ),
  },
  rejected: {
    badge: 'bg-red-100 text-red-700',
    icon: (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6m0-6l6 6" />
        </svg>
      </span>
    ),
  },
  testing: {
    badge: 'bg-yellow-100 text-yellow-700',
    icon: (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100">
        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2" />
        </svg>
      </span>
    ),
  },
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await api.get('/leaves/my-requests');
        const leaves = response.data.leaveRequests || [];
        setRecentLeaves(leaves.slice(0, 3));
        setStats({
          total: leaves.length,
          approved: leaves.filter(l => l.status === 'approved').length,
          pending: leaves.filter(l => l.status === 'pending' || l.status === 'testing').length,
          rejected: leaves.filter(l => l.status === 'rejected' || l.status === 'auto-rejected').length,
        });
      } catch (error) {
        setStats({ total: 0, approved: 0, pending: 0, rejected: 0 });
        setRecentLeaves([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-2 px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-8 px-0">
          <div className="bg-white rounded-xl shadow border p-8 flex flex-col items-start w-full">
            <div className="mb-2">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h4" />
              </svg>
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Applications</div>
          </div>
          <div className="bg-white rounded-xl shadow border p-8 flex flex-col items-start w-full">
            <div className="mb-2">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
              </svg>
            </div>
            <div className="text-3xl font-bold">{stats.approved}</div>
            <div className="text-sm text-gray-500 mt-1">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow border p-8 flex flex-col items-start w-full">
            <div className="mb-2">
              <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2" />
              </svg>
            </div>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="text-sm text-gray-500 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow border p-8 flex flex-col items-start w-full">
            <div className="mb-2">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6m0-6l6 6" />
              </svg>
            </div>
            <div className="text-3xl font-bold">{stats.rejected}</div>
            <div className="text-sm text-gray-500 mt-1">Rejected</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border p-8 mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
          {recentLeaves.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No recent applications.</div>
          ) : (
            <div>
              {recentLeaves.map((leave) => {
                const statusKey = leave.status === 'auto-rejected' ? 'rejected' : leave.status;
                const style = statusStyles[statusKey] || statusStyles.pending;
                return (
                  <div key={leave._id} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b last:border-b-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) + ' Leave' : 'Leave'}</span>
                        <StatusBadge status={statusKey} />
                      </div>
                      <div className="text-gray-500 text-sm">{leave.reason}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {leave.startDate && leave.endDate && (
                          <>
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            {' • '}
                            {Math.max(1, Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1)} days
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-4 flex-shrink-0">
                      {style.icon}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
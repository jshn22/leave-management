import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchMonthlyStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/leaves?limit=10');
      const leaves = response.data.leaveRequests;
      
      setRecentRequests(leaves.slice(0, 5));
      
      const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending' || l.status === 'testing').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected' || l.status === 'auto-rejected').length,
        autoApproved: leaves.filter(l => l.autoApproved).length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = () => {
    api.get('/leaves/stats/monthly')
      .then(res => setMonthlyStats(res.data.data))
      .catch(() => setMonthlyStats([]));
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        setDeptLoading(true);
        const res = await api.get('/leaves/stats/departments');
        setDepartmentStats(res.data.data || []);
      } catch (err) {
        console.error('Error fetching department stats:', err);
        setDepartmentStats([]);
      } finally {
        setDeptLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" />
      </Layout>
    );
  }

  const chartData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' }
  ];

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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Request Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approval Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Auto-Approval Rate</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.approved > 0 ? ((stats.autoApproved / stats.approved) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rejection Rate</span>
                <span className="text-lg font-bold text-red-600">
                  {stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Link
              to="/admin/leaves"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="p-6">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No requests yet</p>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((leave) => (
                  <Link
                    key={leave._id}
                    to={`/admin/leaves/${leave._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {leave.student?.fullName || 'Unknown'} ({leave.student?.studentId || 'N/A'})
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{leave.reason}</div>
                        {leave.overallScore > 0 && (
                          <div className="text-sm font-medium text-blue-600 mt-2">
                            Test Score: {leave.overallScore.toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Monthly Applications Trend</h2>
          <div className="flex items-end space-x-6 h-32">
            {monthlyStats.map(({ month, count }) => (
              <div key={month} className="flex flex-col items-center">
                <div
                  className="bg-blue-600 rounded-t-lg"
                  style={{
                    width: 80,
                    height: `${count * 2}px`,
                    minHeight: 8
                  }}
                ></div>
                <div className="mt-2 font-bold">{count}</div>
                <div className="text-sm text-gray-500">{month}</div>
              </div>
            ))}
          </div>
        </div>
       </div>
    </Layout>
  );
}

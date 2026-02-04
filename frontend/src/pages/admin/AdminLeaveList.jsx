import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

const TABS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Testing", value: "testing" },
  { label: "Auto-Rejected", value: "auto-rejected" }
];

export default function AdminLeaveList() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves');
      setLeaves(response.data.leaveRequests || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredLeaves = leaves
    .filter(leave => leave.status === activeTab)
    .filter(leave =>
      leave.student?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.student?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Leaves</h1>
        <p className="text-gray-500 mb-6">Review and process student leave requests</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.value}
              className={`px-5 py-2 rounded-full font-medium transition ${
                activeTab === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100"
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              <span className="ml-1 text-xs font-semibold">
                {leaves.filter(l => l.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by student name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeaves.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                No leave requests found.
              </div>
            ) : (
              filteredLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition-shadow max-w-md w-full">
                  <div className="flex justify-between items-center mb-2">
                    <div className="truncate w-2/3">
                      <span className="font-semibold text-lg truncate">{leave.student?.fullName || 'Unknown Student'}</span>
                      <span className="ml-3 text-gray-500 truncate">{leave.student?.studentId || 'N/A'}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="mb-2 text-gray-700">
                    <div>
                      <span className="font-medium">Dates:</span>{" "}
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                    <div className="italic mt-2 break-words truncate w-full">
                      <span className="font-medium">Reason:</span>{" "}
                      {leave.reason}
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link
                      to={`/admin/leaves/${leave._id}`}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
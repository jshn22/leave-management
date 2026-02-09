import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function DepartmentStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/leaves/stats/departments');
        setStats(response.data.data || []);
      } catch (error) {
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-500">Loading statistics...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">Department Statistics</h1>
        <p className="text-gray-500 mb-8">Leave statistics by department</p>
        <div className="space-y-8">
          {stats.map(dept => (
            <div
              key={dept.department}
              className="bg-white rounded-xl shadow border p-6 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-bold text-xl mb-2">{dept.department}</div>
                <div className="flex space-x-6 mb-2">
                  <span className="bg-green-50 text-green-700 px-4 py-2 rounded font-semibold">{dept.approved} Approved</span>
                  <span className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded font-semibold">{dept.pending} Pending</span>
                  <span className="bg-red-50 text-red-700 px-4 py-2 rounded font-semibold">{dept.rejected} Rejected</span>
                </div>
              </div>
              <div className="text-blue-700 bg-blue-50 px-4 py-2 rounded font-bold text-lg">
                {dept.total} Total
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No department statistics available.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
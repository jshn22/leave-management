import { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Departments() {
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentStats();
  }, []);

  const fetchDepartmentStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves/stats/departments');
      setDepartmentStats(res.data.data || []);
    } catch (err) {
      console.error('Error fetching department stats:', err);
      setDepartmentStats([]);
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

  return (
    <Layout>
      <div className="mx-auto px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Department Statistics</h1>
          <p className="text-gray-500">Leave statistics by department</p>
        </div>

        {departmentStats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No department statistics available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {departmentStats.map((dept, index) => {
              const total = dept.total || 0;
              const approved = dept.approved || 0;
              const pending = dept.pending || 0;
              const rejected = dept.rejected || 0;

              const approvedPercent = total > 0 ? (approved / total) * 100 : 0;
              const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
              const rejectedPercent = total > 0 ? (rejected / total) * 100 : 0;

              return (
                <div key={index} className="bg-white rounded-lg shadow p-5 mx-2">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{dept.department}</h2>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Total Requests</div>
                      <div className="text-2xl font-bold text-blue-600">{total}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{approved}</div>
                      <div className="text-xs text-green-700 font-medium">Approved</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{pending}</div>
                      <div className="text-xs text-yellow-700 font-medium">Pending</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{rejected}</div>
                      <div className="text-xs text-red-700 font-medium">Rejected</div>
                    </div>
                  </div>

                  <div className="flex h-6 rounded-full overflow-hidden bg-gray-200">
                    {approvedPercent > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${approvedPercent}%` }}
                      ></div>
                    )}
                    {pendingPercent > 0 && (
                      <div
                        className="bg-yellow-400"
                        style={{ width: `${pendingPercent}%` }}
                      ></div>
                    )}
                    {rejectedPercent > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${rejectedPercent}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
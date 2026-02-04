import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

export default function NewLeaveRequest() {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || submitted) return; 
    setLoading(true);
    setSubmitted(true);

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date cannot be before the start date.');
      setLoading(false);
      setSubmitted(false);
      return;
    }

    try {
      const res = await api.post('/leaves/new', formData);
      console.log('Leave request response:', res); 

      if (res.data && res.data.success === true) {
        toast.success('Leave request submitted successfully!');
        setLoading(false);
        setSubmitted(false);
        navigate('/leaves');
      } else {
        const msg = res.data?.message || 'Failed to submit leave request.';
        toast.error(msg);
        setLoading(false);
        setSubmitted(false);
      }
    } catch (error) {
      console.error('Leave request error:', error);
      const message = error.response?.data?.message || 'Failed to submit leave request.';
      toast.error(message);
      setLoading(false);
      setSubmitted(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Leave Application</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition"
              >
                <option value="" disabled>Select leave type</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="festive">Festive Leave</option>
                <option value="exam">Exam Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">Reason for Leave</label>
              <textarea
                id="reason"
                name="reason"
                rows="5"
                value={formData.reason}
                onChange={handleChange}
                required
                placeholder="Please provide a detailed reason for your leave..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition"
              ></textarea>
            </div>

            <div className="bg-blue-50 border-l-4 border-accent-blue text-blue-800 p-4 rounded-r-lg">
              <div className="flex">
                <div className="py-1">
                  <svg className="w-6 h-6 text-accent-blue mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm">Your leave application will be sent to your class teacher for approval. You will receive a notification once the status is updated.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || submitted}
                className="px-8 py-3 bg-accent-blue text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
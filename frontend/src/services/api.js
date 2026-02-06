import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://leave-management-backend-k689.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('API request:', config.url, 'Token:', token, 'Data:', config.data);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API error response:', error.config.url, error.response.status, error.response.data);
    } else {
      console.error('API error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
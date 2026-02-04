import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';

import Dashboard from './pages/student/Dashboard';
import NewLeaveRequest from './pages/student/NewLeaveRequest';
import LeaveList from './pages/student/LeaveList';
import LeaveDetails from './pages/student/LeaveDetails';
import TestSession from './pages/student/TestSession';
import TestResult from './pages/student/TestResult';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLeaveList from './pages/admin/AdminLeaveList';
import AdminLeaveReview from './pages/admin/AdminLeaveReview';
import Departments from './pages/admin/Departments';
import DepartmentStats from './pages/DepartmentStats';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />} 
      />
      <Route 
        path="/register" 
        element={!user ? <Register /> : <Navigate to="/dashboard" replace />} 
      />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
      <Route path="/verify-otp" element={!user ? <VerifyOtp /> : <Navigate to="/dashboard" replace />} />
      <Route path="/reset-password/:token" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" replace />} />

      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leaves/new" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <NewLeaveRequest />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leaves" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <LeaveList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leaves/:id" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <LeaveDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tests/:sessionId" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <TestSession />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tests/:sessionId/result" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <TestResult />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/leaves" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLeaveList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/leaves/:id" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLeaveReview />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/departments" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Departments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/departments" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'student']}>
            <DepartmentStats />
          </ProtectedRoute>
        } 
      />

      {/* Default Route */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} 
            replace 
          />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

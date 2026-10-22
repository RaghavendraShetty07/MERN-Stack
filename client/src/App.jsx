import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import MyTokensPage from './pages/MyTokensPage';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicDisplayPage from './pages/PublicDisplayPage';

import AdminLoginPage from './pages/AdminLoginPage';

// Smart Home redirection based on logged in role
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public & Student/Staff Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/display" element={<PublicDisplayPage />} />

                {/* Separate Dedicated Admin Login Portal */}
                <Route path="/admin-login" element={<AdminLoginPage />} />

                {/* Root Redirect */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Student Pages - Only accessible to Students */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-tokens"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyTokensPage />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Pages - Only accessible to Staff */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Separate Admin Portal - Only accessible to Admin */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

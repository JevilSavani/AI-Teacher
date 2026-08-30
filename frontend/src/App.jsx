import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Navbar from './components/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';

/**
 * Root redirect — send authenticated users to dashboard, guests to home
 */
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />;
}

/**
 * Auth page wrapper — redirect to dashboard if already logged in
 */
function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public pages with Navbar + footer layout */}
      <Route
        path="/home"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />

      {/* Auth pages — no sidebar/footer, full-screen */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <>
              <Navbar />
              <LoginPage />
            </>
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <>
              <Navbar />
              <RegisterPage />
            </>
          </AuthRoute>
        }
      />

      {/* Protected: Profile setup (Navbar but no sidebar) */}
      <Route
        path="/profile/setup"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <ProfileSetupPage />
            </>
          </ProtectedRoute>
        }
      />

      {/* Protected: Dashboard (full-screen layout with its own sidebar) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

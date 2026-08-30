import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users without a profile to /profile/setup (unless already there).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, hasProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has not set up profile yet, redirect to setup (avoid infinite loop)
  if (!hasProfile && location.pathname !== '/profile/setup') {
    return <Navigate to="/profile/setup" replace />;
  }

  return children;
}

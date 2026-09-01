import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true); // true while hydrating from stored token
  const [authError, setAuthError] = useState(null);

  /**
   * Hydrate user state from stored JWT on app load
   */
  useEffect(() => {
    const hydrateUser = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getMe();
        if (res.ok && res.data) {
          setUser(res.data.user);
          setProfile(res.data.profile);
          setToken(storedToken);
        } else {
          // Token is invalid or expired — clear it
          localStorage.removeItem('token');
          localStorage.removeItem('ai_teacher_token');
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('ai_teacher_token');
        setToken(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  /**
   * Register a new user and log them in immediately
   */
  const register = useCallback(async (name, email, password) => {
    setAuthError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('ai_teacher_token');

    const res = await authService.register(name, email, password);
    if (res.ok && res.data) {
      const { user: newUser, token: newToken } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setProfile(null); // Profile not yet set up
      return { success: true };
    }
    const message = res.message || 'Registration failed. Please try again.';
    setAuthError(message);
    return { success: false, message };
  }, []);

  /**
   * Login an existing user
   */
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('ai_teacher_token');

    const res = await authService.login(email, password);
    if (res.ok && res.data) {
      const { user: loggedInUser, token: newToken } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(loggedInUser);

      // Fetch profile after login
      try {
        const profileRes = await authService.getMe();
        if (profileRes.ok && profileRes.data) {
          setProfile(profileRes.data.profile);
        }
      } catch {
        setProfile(null);
      }

      return { success: true };
    }
    const message = res.message || 'Login failed. Please check your credentials.';
    setAuthError(message);
    return { success: false, message };
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors — always clear local state
    }
    localStorage.removeItem('token');
    localStorage.removeItem('ai_teacher_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setAuthError(null);
  }, []);

  /**
   * Update profile in context after save
   */
  const updateProfile = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
  }, []);

  const isAuthenticated = !!user && !!token;
  const hasProfile = !!profile?.knowledge_level; // Profile considered complete if key field set

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        authError,
        isAuthenticated,
        hasProfile,
        register,
        login,
        logout,
        updateProfile,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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
      let userHasProfile = false;
      try {
        const profileRes = await authService.getMe();
        if (profileRes.ok && profileRes.data) {
          setProfile(profileRes.data.profile);
          const p = profileRes.data.profile;
          userHasProfile = Boolean(
            p?.profile_completed ||
            p?.preferences?.profile_completed ||
            p?.knowledge_level ||
            p?.preferences?.knowledge_level
          );
        }
      } catch {
        setProfile(null);
      }

      return { success: true, hasProfile: userHasProfile };
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
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      await authService.logout();
    } catch {
      // Ignore logout API errors — always clear local state
    }
    localStorage.clear();
    sessionStorage.clear();
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
  const hasProfile = Boolean(
    profile?.profile_completed ||
    profile?.preferences?.profile_completed ||
    profile?.knowledge_level ||
    profile?.preferences?.knowledge_level
  );

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

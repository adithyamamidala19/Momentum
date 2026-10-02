import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setOnUnauthorizedHandler, setAuthToken, clearAuthToken } from '../services/apiClient.js';
import { signInWithGoogleAndGetIdToken } from '../services/firebaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [intendedRoute, setIntendedRoute] = useState(null);
  const wasAuthenticatedRef = useRef(false);

  // Check authenticated status on mount via /api/auth/me
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/auth/me');
      if (data?.user) {
        if (data.token) {
          setAuthToken(data.token);
        }
        setUser(data.user);
        wasAuthenticatedRef.current = true;
        setSessionExpiredNotice(false);
      } else {
        clearAuthToken();
        setUser(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Register 401 callback for expired sessions (only if user was previously authenticated)
    setOnUnauthorizedHandler(() => {
      clearAuthToken();
      setUser(null);
      if (wasAuthenticatedRef.current) {
        setSessionExpiredNotice(true);
        wasAuthenticatedRef.current = false;
      }
    });
  }, [checkAuth]);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Google sign-in flow:
   * 1. Popup Google Sign-In via Firebase
   * 2. Receive ID token (and client signs out immediately)
   * 3. Send ID token to POST /api/auth/session
   * 4. Server sets httpOnly session cookie and returns user + session token
   */
  const loginWithGoogle = async () => {
    if (isAuthenticating) {
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { idToken } = await signInWithGoogleAndGetIdToken();
      const response = await api.post('/auth/session', { idToken });

      if (response?.user) {
        if (response.token) {
          setAuthToken(response.token);
        }
        setUser(response.user);
        wasAuthenticatedRef.current = true;
        setSessionExpiredNotice(false);
        return { success: true, user: response.user, isNewUser: response.isNewUser };
      }
      throw new Error('Failed to create session on sanctuary server');
    } catch (err) {
      const message = err.message || 'Authentication failed. Please try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Logout flow:
   * 1. Call POST /api/auth/logout to revoke tokens and clear cookie
   * 2. Clear user state and in-memory token
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      console.warn('Logout API notification failed:', e);
    } finally {
      clearAuthToken();
      wasAuthenticatedRef.current = false;
      setUser(null);
      window.location.hash = 'home';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        authError,
        setAuthError,
        sessionExpiredNotice,
        setSessionExpiredNotice,
        intendedRoute,
        setIntendedRoute,
        isAuthenticating,
        loginWithGoogle,
        logout,
        refreshUser: checkAuth
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

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi, setToken, clearToken, getToken } from '../api/lmsClient';

// ─────────────────────────────────────────────────────────────
// AuthContext — autenticación real del LMS (F2.A2)
// Conecta el login existente a POST /api/auth/login del servidor
// Express (web/server). El token JWT se guarda en localStorage
// ('acn_lms_token') y lo usa lmsClient en cada petición.
// El usuario autenticado expone rol: 'STUDENT' | 'TEACHER' | 'ADMIN'
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: error.message || 'Authentication required' });
      }
    }
  }, []);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings({ id: 'local', public_settings: { auth_required: true } });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const login = async (email, password) => {
    const { token, user: u } = await authApi.login(email, password);
    setToken(token);
    setUser(u);
    setIsAuthenticated(true);
    setAuthError(null);
    return u;
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authApi.logout();
    } catch {
      /* token local se limpia igualmente */
    }
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        login,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

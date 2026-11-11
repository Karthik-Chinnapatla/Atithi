import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import {
  clearCsrfToken,
  registerUnauthorizedHandler,
  setCsrfToken,
} from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      setUser(data.user || null);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data.user || null;
    } catch {
      setUser(null);
      try {
        const csrfRes = await authApi.getCsrf();
        if (csrfRes.data?.csrfToken) {
          setCsrfToken(csrfRes.data.csrfToken);
        }
      } catch {
        // Ignore if server offline on boot
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
      clearCsrfToken();
    });
  }, []);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  };

  const verifyOtp = async (payload) => {
    const { data } = await authApi.verifyOtp(payload);
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (email) => {
    const { data } = await authApi.resendOtp({ email });
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      clearCsrfToken();
    }
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser: fetchCurrentUser,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}

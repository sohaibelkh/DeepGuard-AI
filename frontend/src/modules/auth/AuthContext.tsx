import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { AuthResponse, AuthUser } from './types';
import { clearTokens, getAccessToken, setTokens } from './storage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
        setUser(res.data.user);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
  };

  const login = async (identifier: string, password: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', {
      identifier,
      password
    });
    handleAuthSuccess(res.data);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      full_name: fullName,
      email,
      password
    });
    handleAuthSuccess(res.data);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    navigate('/login');
  };

  const updateUser = (next: AuthUser) => {
    setUser(next);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};


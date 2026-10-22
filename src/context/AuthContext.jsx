import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('smarthr_token');
    const savedUser = localStorage.getItem('smarthr_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('smarthr_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: userData } = data.data;
    localStorage.setItem('smarthr_token', token);
    localStorage.setItem('smarthr_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smarthr_token');
    localStorage.removeItem('smarthr_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const freshUser = data.data.user;
      localStorage.setItem('smarthr_user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch {
      logout();
    }
  }, [logout]);

  const loginWithData = useCallback((token, userData) => {
    localStorage.setItem('smarthr_token', token);
    localStorage.setItem('smarthr_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, loginWithData, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

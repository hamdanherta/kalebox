import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kalebox_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('kalebox_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (user?.role?.slug || user?.role?.name || '').toLowerCase() || null;
  const isInternal = ['owner', 'manager', 'admin', 'design', 'staff', 'keuangan'].includes(role);
  const isMember = role === 'member';

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success || res.data?.status === 'success') {
            const userData = res.data.data?.user || res.data.data;
            setUser(userData);
            localStorage.setItem('kalebox_user', JSON.stringify(userData));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const loginInternal = async (email, password) => {
    const res = await api.post('/auth/internal/login', { email, password });
    if (res.data?.success || res.data?.status === 'success') {
      const userData = res.data.data?.user || res.data.data;
      const userToken = res.data.data?.token || res.data.token;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('kalebox_token', userToken);
      localStorage.setItem('kalebox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Login gagal');
  };

  const loginMember = async (email, password) => {
    const res = await api.post('/auth/member/login', { email, password });
    if (res.data?.success || res.data?.status === 'success') {
      const userData = res.data.data?.user || res.data.data;
      const userToken = res.data.data?.token || res.data.token;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('kalebox_token', userToken);
      localStorage.setItem('kalebox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Login gagal');
  };

  const registerInternal = async (payload) => {
    const res = await api.post('/auth/internal/register', payload);
    if (res.data?.success || res.data?.status === 'success') {
      const userData = res.data.data?.user || res.data.data;
      const userToken = res.data.data?.token || res.data.token;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('kalebox_token', userToken);
      localStorage.setItem('kalebox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Registrasi gagal');
  };

  const registerMember = async (payload) => {
    const res = await api.post('/auth/member/register', payload);
    if (res.data?.success || res.data?.status === 'success') {
      const userData = res.data.data?.user || res.data.data;
      const userToken = res.data.data?.token || res.data.token;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('kalebox_token', userToken);
      localStorage.setItem('kalebox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data?.message || 'Pendaftaran member gagal');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('kalebox_token');
      localStorage.removeItem('kalebox_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success || res.data?.status === 'success') {
        const userData = res.data.data?.user || res.data.data;
        setUser(userData);
        localStorage.setItem('kalebox_user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user && !!token,
        isInternal,
        isMember,
        isLoading,
        loginInternal,
        loginMember,
        registerInternal,
        registerMember,
        logout,
        refreshUser,
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

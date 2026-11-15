import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { setOnAuthFailure } from '../api/http.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
    });

    const initAuth = async () => {
      try {
        await authApi.refresh();
        const me = await authApi.getMe();
        setUser(me);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const data = await authApi.register(formData);
    setUser(data.user);
    return data.user;
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout: handleLogout, updateUser }}>
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

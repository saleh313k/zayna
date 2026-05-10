<<<<<<< HEAD
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);

        if (parsed?.userId && typeof parsed?.role === 'number') {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const persistAuth = (response) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
    setUser(response);
  };

  const login = async (phoneNumber, otpCode) => {
    const response = await authService.login(phoneNumber, otpCode);
    persistAuth(response);
    return response;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    persistAuth(response);
    return response;
  };

  const socialLogin = async (provider, accessToken, email, fullName, externalId) => {
    const response = await authService.socialLogin(provider, accessToken, email, fullName, externalId);
    persistAuth(response);
    return response;
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, socialLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
=======
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);

        if (parsed?.userId && typeof parsed?.role === 'number') {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const persistAuth = (response) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
    setUser(response);
  };

  const login = async (phoneNumber, otpCode) => {
    const response = await authService.login(phoneNumber, otpCode);
    persistAuth(response);
    return response;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    persistAuth(response);
    return response;
  };

  const socialLogin = async (provider, accessToken, email, fullName, externalId) => {
    const response = await authService.socialLogin(provider, accessToken, email, fullName, externalId);
    persistAuth(response);
    return response;
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, socialLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7

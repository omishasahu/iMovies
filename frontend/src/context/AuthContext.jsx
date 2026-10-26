import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('imovies_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('imovies_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('imovies_token');
      if (storedToken) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          localStorage.removeItem('imovies_token');
          localStorage.removeItem('imovies_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('imovies_token', res.data.token);
      localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (username, email, password, confirmPassword, phone) => {
    const res = await API.post('/auth/register', {
      username,
      email,
      password,
      confirmPassword,
      phone
    });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('imovies_token', res.data.token);
      localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('imovies_token');
    localStorage.removeItem('imovies_user');
  };

  const toggleWatchlist = async (movieId) => {
    if (!user) return { success: false, message: 'Please log in first' };
    const res = await API.post(`/auth/watchlist/${movieId}`);
    if (res.data.success) {
      const updatedUser = { ...user, watchlist: res.data.watchlist };
      setUser(updatedUser);
      localStorage.setItem('imovies_user', JSON.stringify(updatedUser));
    }
    return res.data;
  };

  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const isWatchlisted = (movieId) => {
    if (!user || !user.watchlist) return false;
    return user.watchlist.some((item) => {
      const id = typeof item === 'object' ? item._id : item;
      return id === movieId;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        toggleWatchlist,
        updateProfile,
        isWatchlisted
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

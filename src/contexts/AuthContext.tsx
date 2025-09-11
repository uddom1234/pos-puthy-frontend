import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      const { token, user: userData } = response;
      
      // Clear previous cart data when logging in
      localStorage.removeItem('pos_cart_items');
      localStorage.removeItem('pos_selected_customer');
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear cart data when user logs out
    localStorage.removeItem('pos_cart_items');
    localStorage.removeItem('pos_selected_customer');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
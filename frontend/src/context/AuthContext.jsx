import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tenantStatus, setTenantStatus] = useState('approved');

  const getAuthHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
      });
      setUser(response.data);
      setIsSuperAdmin(response.data.is_super_admin || false);
      setTenantStatus(response.data.tenant_status || 'approved');
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    const { access_token, user_id, tenant_id, username, is_super_admin, tenant_status: status } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser({ id: user_id, tenant_id, username, email });
    setIsSuperAdmin(is_super_admin || false);
    setTenantStatus(status || 'approved');
    
    return response.data;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsSuperAdmin(false);
    setTenantStatus('approved');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isSuperAdmin,
    tenantStatus,
    login,
    register,
    logout,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

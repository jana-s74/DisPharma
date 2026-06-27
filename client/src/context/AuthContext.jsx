import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dispharma_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('dispharma_token');
      const storedUser = localStorage.getItem('dispharma_user');
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('dispharma_user', JSON.stringify(res.data));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('dispharma_token', newToken);
    localStorage.setItem('dispharma_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.verificationRequired) {
      return res.data;
    }
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('dispharma_token', newToken);
    localStorage.setItem('dispharma_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // Verify OTP for new registration
  const verifyRegisterOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-registration-otp', { email, otp });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('dispharma_token', newToken);
    localStorage.setItem('dispharma_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // Resend OTP for new registration
  const resendRegisterOtp = async (email) => {
    const res = await api.post('/auth/resend-verification-otp', { email });
    return res.data;
  };

  // Send OTP to existing email for passwordless login
  const sendLoginOtp = async (email) => {
    const res = await api.post('/auth/send-login-otp', { email });
    return res.data;
  };

  // Verify OTP and log the user in
  const verifyLoginOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-login-otp', { email, otp });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('dispharma_token', newToken);
    localStorage.setItem('dispharma_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('dispharma_token');
    localStorage.removeItem('dispharma_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('dispharma_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, sendLoginOtp, verifyLoginOtp, verifyRegisterOtp, resendRegisterOtp, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;

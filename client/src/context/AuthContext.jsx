import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// ── Helper: get current GPS (resolves null if denied / unavailable) ────────────
const getGPS = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 }
    );
  });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dispharma_user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('dispharma_token') || null);
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
    const gps = await getGPS();
    const res = await api.post('/auth/login', {
      identifier,
      password,
      loginLat: gps?.lat ?? null,
      loginLng: gps?.lng ?? null,
    });
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
    const gps = await getGPS();
    const res = await api.post('/auth/send-login-otp', {
      email,
      loginLat: gps?.lat ?? null,
      loginLng: gps?.lng ?? null,
    });
    // Persist GPS so verifyLoginOtp can use it
    if (gps) {
      sessionStorage.setItem('loginGps', JSON.stringify(gps));
    } else {
      sessionStorage.removeItem('loginGps');
    }
    return res.data;
  };

  // Verify OTP and log the user in
  const verifyLoginOtp = async (email, otp) => {
    const gps = JSON.parse(sessionStorage.getItem('loginGps') || 'null');
    const res = await api.post('/auth/verify-login-otp', {
      email,
      otp,
      loginLat: gps?.lat ?? null,
      loginLng: gps?.lng ?? null,
    });
    sessionStorage.removeItem('loginGps');
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

  // Update user security/settings (e.g. maxLoginDistanceKm)
  const updateSettings = async (settings) => {
    const res = await api.put('/auth/settings', settings);
    // Sync the returned fields into local user state
    updateUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      updateSettings,
      sendLoginOtp,
      verifyLoginOtp,
      verifyRegisterOtp,
      resendRegisterOtp,
      // isAuthenticated is derived purely from React state (not localStorage)
      // to avoid stale-token flash during initAuth
      isAuthenticated: !!token,
    }}>
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

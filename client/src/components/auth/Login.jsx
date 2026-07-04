import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Eye Icons ────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.084-3.41M6.53 6.53A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.357 2.617M6.53 6.53L3 3m3.53 3.53l11.94 11.94M17.47 17.47L21 21" />
  </svg>
);

const Login = () => {
  const { login, sendLoginOtp, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  // ── Mode: 'password' | 'otp-email' | 'otp-verify' ──────────────────────
  const [mode, setMode] = useState('password');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState(null); // { distanceKm }
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // GPS status
  const [gpsStatus, setGpsStatus] = useState('checking'); // 'checking' | 'ok' | 'denied'

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resent, setResent] = useState(false);

  // Probe GPS on mount so status is ready before form submit
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('ok'),
      () => setGpsStatus('denied'),
      { timeout: 6000 }
    );
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setLocationError(null);
  };

  // ── Password login ────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setError('Email/Phone and password are required');
      return;
    }
    setLoading(true);
    setLocationError(null);
    try {
      await login(form.identifier, form.password);
      navigate('/search');
    } catch (err) {
      const data = err.response?.data || {};
      if (data.locationError) {
        setLocationError({ distanceKm: data.distanceKm });
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP for email login ──────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail || !/^\S+@\S+\.\S+$/.test(otpEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    setOtpSending(true);
    setError('');
    try {
      await sendLoginOtp(otpEmail);
      setOtpSent(true);
      setMode('otp-verify');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Is this email registered?');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setOtpSending(true);
    setError('');
    try {
      await sendLoginOtp(otpEmail);
      setOtp(['', '', '', '', '', '']);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    setLocationError(null);
    try {
      await verifyLoginOtp(otpEmail, code);
      navigate('/search');
    } catch (err) {
      const data = err.response?.data || {};
      if (data.locationError) {
        setLocationError({ distanceKm: data.distanceKm });
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
      setLoading(false);
    }
  };

  // ── OTP box handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 5) document.getElementById(`login-otp-${idx + 1}`)?.focus();
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`login-otp-${idx - 1}`)?.focus();
  };
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      document.getElementById('login-otp-5')?.focus();
    }
  };

  // ─── Left branding panel ────────────────────────────────────────────────
  const BrandPanel = () => (
    <div className="md:w-5/12 bg-[#0f3b2d] p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#16a34a]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-3 mb-16 w-max">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">DisPharma</span>
        </Link>
        <h2 className="text-3xl font-bold leading-tight mb-6">
          Welcome back to <br />
          <span className="text-[#a3e635]">DisPharma</span>
        </h2>
        <p className="text-emerald-100/90 text-base leading-relaxed max-w-[250px]">
          Access your dashboard to check real-time stock, manage bills, and earn referrals.
        </p>
      </div>
      <div className="relative z-10 mt-10">
        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Your Network</p>
            <p className="text-sm text-white font-medium">Earn 4% margin instantly</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Error / success alert ───────────────────────────────────────────────
  const ErrorAlert = ({ msg }) => msg ? (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
  ) : null;

  // Location-blocked card
  const LocationBlockedAlert = ({ data }) => data ? (
    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm">
      <div className="flex items-center gap-2 font-bold text-amber-700 mb-1">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Login Blocked — Location Mismatch
      </div>
      <p className="text-amber-700">
        Your device is <strong>{data.distanceKm} km</strong> away from your registered pharmacy.
        Please log in from within your pharmacy premises.
      </p>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row overflow-hidden border border-slate-100">

        <BrandPanel />

        {/* Right Panel */}
        <div className="md:w-7/12 p-8 md:p-14 flex flex-col justify-center">

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black text-[#0f3b2d]">DisPharma</span>
          </div>

          {/* ── PASSWORD LOGIN ─────────────────────────────────────────────── */}
          {mode === 'password' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
                <p className="text-slate-500">Enter your credentials to access your account.</p>
              </div>

              {/* GPS status pill */}
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 ${
                gpsStatus === 'ok'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : gpsStatus === 'denied'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {gpsStatus === 'ok' && <><span>📍</span> Location detected — location check active</>}
                {gpsStatus === 'denied' && <><span>⚠️</span> Location unavailable — skipping location check</>}
                {gpsStatus === 'checking' && <><span>🔄</span> Detecting location...</>}
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <ErrorAlert msg={error} />
                <LocationBlockedAlert data={locationError} />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email or Phone Number</label>
                  <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    value={form.identifier}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#16a34a] focus:ring-[#16a34a]/20 text-slate-900 transition-all outline-none focus:ring-4"
                    placeholder="Enter email or 10-digit mobile"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <Link to="/forgot-password" className="text-sm font-bold text-[#16a34a] hover:text-[#15803d]">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#16a34a] focus:ring-[#16a34a]/20 text-slate-900 transition-all outline-none focus:ring-4"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f3b2d] hover:bg-[#0a271e] text-white py-3.5 rounded-xl font-bold text-lg shadow-xl shadow-[#0f3b2d]/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <><Spinner /> Signing in...</> : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* OTP Login option */}
              <button
                onClick={() => { setMode('otp-email'); setError(''); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-[#16a34a] text-slate-600 hover:text-[#16a34a] font-semibold text-sm transition-all hover:bg-[#16a34a]/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Sign in with OTP (Email)
              </button>

              <p className="text-center text-slate-500 font-medium mt-8">
                New to DisPharma?{' '}
                <Link to="/register" className="text-[#16a34a] hover:text-[#15803d] font-bold">
                  Register your pharmacy
                </Link>
              </p>
            </>
          )}

          {/* ── OTP: ENTER EMAIL ─────────────────────────────────────────── */}
          {mode === 'otp-email' && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setMode('password'); setError(''); }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Sign In
                </button>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In with OTP</h1>
                <p className="text-slate-500">Enter your registered email and we'll send you a one-time code.</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                <ErrorAlert msg={error} />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registered Email</label>
                  <input
                    id="otp-email-input"
                    type="email"
                    value={otpEmail}
                    onChange={(e) => { setOtpEmail(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#16a34a] focus:ring-[#16a34a]/20 text-slate-900 transition-all outline-none focus:ring-4"
                    placeholder="contact@pharmacy.com"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-[#16a34a]/30 transition-all flex items-center justify-center gap-2"
                >
                  {otpSending ? <><Spinner /> Sending OTP...</> : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── OTP: VERIFY CODE ─────────────────────────────────────────── */}
          {mode === 'otp-verify' && (
            <div className="flex flex-col items-center text-center">
              {/* Email icon */}
              <div className="w-20 h-20 bg-[#16a34a]/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
              <p className="text-slate-500 text-sm mb-1">We sent a 6-digit OTP to:</p>
              <p className="text-[#16a34a] font-bold text-sm mb-8 break-all">{otpEmail}</p>

              {resent && (
                <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                  ✅ New OTP sent!
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="w-full">
                <ErrorAlert msg={error} />

                <div className="flex justify-center gap-3 my-6" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`login-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                        focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/20 bg-slate-50 focus:bg-white text-slate-900
                        border-slate-200 caret-transparent"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f3b2d] hover:bg-[#0a271e] text-white py-3.5 rounded-xl font-bold text-lg shadow-xl shadow-[#0f3b2d]/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner /> Verifying...</> : 'Verify & Sign In'}
                </button>
              </form>

              <div className="flex items-center gap-4 mt-6 text-sm">
                <button
                  onClick={handleResend}
                  disabled={otpSending}
                  className="text-[#16a34a] hover:text-[#15803d] font-bold disabled:opacity-50 transition-colors"
                >
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => { setMode('password'); setError(''); setOtp(['','','','','','']); }}
                  className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  ← Sign in with Password
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;

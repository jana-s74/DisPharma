import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Icons ───────────────────────────────────────────────────────────────────
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

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── InputField ───────────────────────────────────────────────────────────────
const InputField = ({ name, label, type = 'text', placeholder, maxLength, form, errors, onChange, showToggle, show, onToggle }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        id={`register-${name}`}
        name={name}
        type={showToggle ? (show ? 'text' : 'password') : type}
        value={form[name]}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-xl border ${
          errors[name] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-[#16a34a] focus:ring-[#16a34a]/20'
        } bg-slate-50 focus:bg-white text-slate-900 text-sm transition-all outline-none focus:ring-4 ${showToggle ? 'pr-11' : ''}`}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
    {errors[name] && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors[name]}</p>}
  </div>
);

// ─── OTP Step (shown for email verification) ─────────────────────────────────
const OtpLoginStep = ({ email, isRegisterOtp, onSuccess, onBack }) => {
  const { verifyLoginOtp, sendLoginOtp, verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 5) {
      document.getElementById(`otp-box-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-box-${idx - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      document.getElementById('otp-box-5')?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      if (isRegisterOtp) {
        await verifyRegisterOtp(email, code);
      } else {
        await verifyLoginOtp(email, code);
      }
      navigate('/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      if (isRegisterOtp) {
        await resendRegisterOtp(email);
      } else {
        await sendLoginOtp(email);
      }
      setOtp(['', '', '', '', '', '']);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Email icon */}
      <div className="w-20 h-20 bg-[#16a34a]/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
      <p className="text-slate-500 text-sm mb-1">
        {isRegisterOtp
          ? "We've sent a 6-digit verification OTP to:"
          : "This email is already registered. We've sent a 6-digit OTP to:"}
      </p>
      <p className="text-[#16a34a] font-bold text-sm mb-8 break-all">{email}</p>

      {error && (
        <div className="w-full mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {resent && (
        <div className="w-full mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          ✅ New OTP sent to your email!
        </div>
      )}

      <form onSubmit={handleVerify} className="w-full">
        {/* OTP boxes */}
        <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-box-${idx}`}
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
          className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-[#16a34a]/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Verifying...</> : 'Verify & Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-4 mt-6 text-sm">
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-[#16a34a] hover:text-[#15803d] font-bold transition-colors disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          ← Back to Register
        </button>
      </div>
    </div>
  );
};

// ─── Main Register Component ──────────────────────────────────────────────────
const Register = () => {
  const { register, sendLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    medicalName: '', ownerName: '', email: '', phone: '', licenseNo: '',
    address: '', pincode: '', password: '', confirmPassword: '',
  });
  const [location, setLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | success | error
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP flow state
  const [otpStep, setOtpStep] = useState(false); // true = show OTP screen
  const [otpEmail, setOtpEmail] = useState('');
  const [isRegisterOtp, setIsRegisterOtp] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processed = name === 'licenseNo' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: processed }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setGeoStatus('error'); return; }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] });
        setGeoStatus('success');
      },
      () => setGeoStatus('error')
    );
  };

  const validate = () => {
    const e = {};
    if (!form.medicalName.trim()) e.medicalName = 'Medical name required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name required';
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter 10-digit phone';
    if (!form.licenseNo.trim()) e.licenseNo = 'License number required';
    if (!form.address.trim()) e.address = 'Address required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter 6-digit pincode';
    if (form.password.length < 6) e.password = 'Password must be 6+ chars';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const res = await register({ ...data, location: location || { type: 'Point', coordinates: [0, 0] } });
      if (res && res.verificationRequired) {
        setOtpEmail(res.email);
        setIsRegisterOtp(true);
        setOtpStep(true);
      } else {
        navigate('/search');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      // If email already registered → trigger OTP login flow
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('registered')) {
        try {
          await sendLoginOtp(form.email);
          setOtpEmail(form.email);
          setIsRegisterOtp(false);
          setOtpStep(true);
        } catch (otpErr) {
          setErrors({ general: otpErr.response?.data?.message || 'Failed to send OTP. Try Sign In instead.' });
        }
      } else {
        setErrors({ general: msg || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Left branding panel (shared) ──────────────────────────────────────────
  const BrandPanel = () => (
    <div className="md:w-[45%] bg-[#0f3b2d] p-12 text-white flex flex-col relative overflow-hidden hidden md:flex">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#16a34a]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex-1 flex flex-col">
        <Link to="/" className="flex items-center gap-3 w-max">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">DisPharma</span>
        </Link>
        <div className="mt-20">
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Join India's <br />
            <span className="text-[#a3e635]">Largest Pharmacy</span> <br />
            Network
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-[280px]">
            Connect with nearby medicals, solve stock shortages, and boost your sales.
          </p>
          <div className="space-y-6">
            {[
              { icon: '📦', title: 'Smart Inventory', desc: 'Find medicines instantly' },
              { icon: '🤝', title: 'Referral Margin', desc: 'Earn 4% on every referral' },
              { icon: '🧾', title: 'Quick Billing', desc: 'Generate professional bills' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl flex-shrink-0">{f.icon}</div>
                <div>
                  <h4 className="font-bold text-white">{f.title}</h4>
                  <p className="text-sm text-emerald-200/80">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── OTP screen ────────────────────────────────────────────────────────────
  if (otpStep) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row overflow-hidden border border-slate-100">
          <BrandPanel />
          <div className="md:w-[55%] p-8 md:p-12 flex flex-col justify-center">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-black text-[#0f3b2d]">DisPharma</span>
            </div>
            <OtpLoginStep
              email={otpEmail}
              isRegisterOtp={isRegisterOtp}
              onBack={() => setOtpStep(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row overflow-hidden border border-slate-100">

        <BrandPanel />

        {/* Right Form Panel */}
        <div className="md:w-[55%] p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">

          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black text-[#0f3b2d]">DisPharma</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h1>
            <p className="text-slate-500">Register your pharmacy to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errors.general}
              </div>
            )}

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField name="medicalName" label="Pharmacy Name" placeholder="e.g. Apollo Pharmacy" form={form} errors={errors} onChange={handleChange} />
                <InputField name="ownerName" label="Owner Name" placeholder="e.g. Rajesh Kumar" form={form} errors={errors} onChange={handleChange} />
                <InputField name="email" label="Email Address" type="email" placeholder="contact@pharmacy.com" form={form} errors={errors} onChange={handleChange} />
                <InputField name="phone" label="Phone Number" type="tel" placeholder="10-digit number" maxLength={10} form={form} errors={errors} onChange={handleChange} />
                <InputField name="licenseNo" label="Drug License No." placeholder="e.g. DL-MH-123456" form={form} errors={errors} onChange={handleChange} />
                <InputField name="pincode" label="Pincode" placeholder="6-digit pincode" maxLength={6} form={form} errors={errors} onChange={handleChange} />
              </div>

              <InputField name="address" label="Full Address" placeholder="Shop address with street, area" form={form} errors={errors} onChange={handleChange} />

              {/* GPS Location */}
              <div className="mt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">GPS Location</label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={geoStatus === 'loading'}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                    geoStatus === 'success'
                      ? 'bg-[#16a34a]/10 border-[#16a34a]/30 text-[#16a34a]'
                      : geoStatus === 'error'
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {geoStatus === 'loading' ? (
                    <><Spinner /> Locating...</>
                  ) : geoStatus === 'success' ? (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Location Saved</>
                  ) : geoStatus === 'error' ? (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Try Again</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Auto-Detect Location</>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <InputField name="password" label="Password" placeholder="Min 6 characters" form={form} errors={errors} onChange={handleChange} showToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
                <InputField name="confirmPassword" label="Confirm Password" placeholder="Repeat password" form={form} errors={errors} onChange={handleChange} showToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-[#16a34a]/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <><Spinner /> Creating Account...</> : 'Register Pharmacy'}
              </button>
            </div>
          </form>

          <p className="text-center text-slate-500 font-medium mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#16a34a] hover:text-[#15803d] font-bold">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;

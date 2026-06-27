import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../search/SearchBar';
import PharmacyMapModal from './PharmacyMapModal';
import api from '../../utils/api';

const Navbar = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Location widget state
  const [locationLabel, setLocationLabel] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Auto-detect location via GPS on mount
  const detectLocation = (onDone) => {
    if (!navigator.geolocation) {
      if (onDone) onDone();
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addrData = data.address || {};
          const city =
            addrData.suburb ||
            addrData.city_district ||
            addrData.city ||
            addrData.town ||
            addrData.village ||
            addrData.county ||
            addrData.state_district ||
            'Unknown';
          const pincode = addrData.postcode || user?.pincode || '';
          setLocationLabel({ city, pincode });
        } catch {
          // fallback to profile pincode
          setLocationLabel({ city: 'Your Location', pincode: user?.pincode || '' });
        } finally {
          setLocLoading(false);
          if (onDone) onDone();
        }
      },
      () => {
        // Permission denied — fallback to profile pincode
        setLocationLabel({ city: 'Your Location', pincode: user?.pincode || '' });
        setLocLoading(false);
        if (onDone) onDone();
      },
      { timeout: 8000 }
    );
  };

  // Auto-detect on mount when user is loaded
  useEffect(() => {
    if (user) detectLocation();
  }, [user]);

  const handleDetectLocation = () => {
    detectLocation();
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await api.post('/auth/upload-photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ profilePhoto: res.data.profilePhoto });
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Explore', path: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { name: 'My Stock', path: '/profile', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'Bills', path: '/bill', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Main Navbar */}
      <div className="h-16 flex items-center px-4 md:px-8 gap-4 max-w-[1600px] mx-auto">
        {/* Logo */}
        <Link to="/search" className="flex items-center gap-2 min-w-fit group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
            <img src="/logo.png" alt="DisPharma" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#0f3b2d]">
            DisPharma
          </span>
        </Link>

        {/* Location Widget — Apollo style */}
        <button
          onClick={() => setShowMap(true)}
          title="View pharmacy network map"
          className="hidden md:flex items-center gap-2 min-w-[140px] px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#16a34a] hover:bg-green-50 transition-all duration-200 group"
        >
          {locLoading ? (
            <svg className="w-4 h-4 text-[#16a34a] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-[#16a34a] flex-shrink-0 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          )}
          <div className="text-left leading-tight overflow-hidden">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Location</p>
            <p className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
              {locationLabel
                ? `${locationLabel.city}${locationLabel.pincode ? ' ' + locationLabel.pincode : ''}`
                : 'Detect location'}
            </p>
          </div>

        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-3xl mx-auto hidden md:block">
          <SearchBar compact ecomStyle />
        </div>

        {/* Right Quick Links */}
        <div className="flex items-center gap-6 min-w-fit ml-auto">
          {/* Main Nav Links (Icons only on desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map(link => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${isActive ? 'text-[#16a34a]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={link.icon} />
                  </svg>
                  <span className="text-[10px] font-semibold">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-medium text-slate-500 leading-tight">Hello, {user?.ownerName?.split(' ')[0] || 'User'}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.medicalName}</p>
              </div>
              {/* Avatar with camera overlay */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0f3b2d] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.profilePhoto
                    ? <img src={user.profilePhoto} alt="avatar" className="w-full h-full object-cover" />
                    : <span>{user?.medicalName?.[0]?.toUpperCase() || 'M'}</span>
                  }
                </div>
                {/* Camera icon — triggers upload */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-green-50 hover:border-[#16a34a] transition-colors shadow-sm"
                  title="Change photo"
                >
                  {photoUploading
                    ? <svg className="w-2.5 h-2.5 text-[#16a34a] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 hidden sm:block ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in origin-top-right">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <p className="text-base font-bold text-slate-900">{user?.medicalName}</p>
                  <p className="text-sm text-slate-600">{user?.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">License: <span className="font-medium text-slate-700">{user?.licenseNo}</span></p>
                </div>
                <div className="p-2">
                  <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:text-[#16a34a] hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    My Store Profile
                  </Link>
                  <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:text-[#16a34a] hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Dashboard
                  </Link>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>

      {/* Pharmacy Network Map Modal */}
      {showMap && <PharmacyMapModal onClose={() => setShowMap(false)} />}
    </>
  );
};

export default Navbar;

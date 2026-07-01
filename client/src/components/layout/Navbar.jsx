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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const photoInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Location widget state
  const [locationLabel, setLocationLabel] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = (onDone) => {
    if (!navigator.geolocation) { if (onDone) onDone(); return; }
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
          const city = addrData.suburb || addrData.city_district || addrData.city || addrData.town || addrData.village || addrData.county || 'Unknown';
          const pincode = addrData.postcode || user?.pincode || '';
          setLocationLabel({ city, pincode });
        } catch {
          setLocationLabel({ city: 'Your Location', pincode: user?.pincode || '' });
        } finally {
          setLocLoading(false);
          if (onDone) onDone();
        }
      },
      () => {
        setLocationLabel({ city: 'Your Location', pincode: user?.pincode || '' });
        setLocLoading(false);
        if (onDone) onDone();
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => { if (user) detectLocation(); }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await api.post('/auth/upload-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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

        {/* ── Main top bar ── */}
        <div className="h-14 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3 max-w-[1600px] mx-auto">

          {/* Logo */}
          <Link to="/search" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-100">
              <img src="/logo.png" alt="DisPharma" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-[#0f3b2d] hidden xs:block">
              DisPharma
            </span>
          </Link>

          {/* Location — desktop only */}
          <button
            onClick={() => setShowMap(true)}
            title="View pharmacy network map"
            className="hidden lg:flex items-center gap-1.5 min-w-[120px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#16a34a] hover:bg-green-50 transition-all duration-200 group flex-shrink-0"
          >
            {locLoading
              ? <svg className="w-4 h-4 text-[#16a34a] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <svg className="w-4 h-4 text-[#16a34a] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            }
            <div className="text-left leading-tight overflow-hidden">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Location</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                {locationLabel ? `${locationLabel.city}${locationLabel.pincode ? ' ' + locationLabel.pincode : ''}` : 'Detect location'}
              </p>
            </div>
          </button>

          {/* Search Bar — desktop/tablet */}
          <div className="flex-1 max-w-2xl mx-auto hidden md:block min-w-0">
            <SearchBar compact ecomStyle />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Toggle search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Nav links — large desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link key={link.path} to={link.path}
                    className={`flex flex-col items-center justify-center w-14 h-11 rounded-lg transition-colors ${isActive ? 'text-[#16a34a]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={link.icon} />
                    </svg>
                    <span className="text-[9px] font-semibold">{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-7 w-px bg-slate-200 hidden lg:block" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">Hello, {user?.ownerName?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user?.medicalName}</p>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0f3b2d] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user?.profilePhoto
                      ? <img src={user.profilePhoto} alt="avatar" className="w-full h-full object-cover" />
                      : <span>{user?.medicalName?.[0]?.toUpperCase() || 'M'}</span>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-green-50 hover:border-[#16a34a] transition-colors shadow-sm"
                    title="Change photo"
                  >
                    {photoUploading
                      ? <svg className="w-2.5 h-2.5 text-[#16a34a] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
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
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.medicalName}</p>
                    <p className="text-xs text-slate-600">{user?.phone}</p>
                    <p className="text-xs text-slate-500 mt-0.5">License: <span className="font-medium text-slate-700">{user?.licenseNo}</span></p>
                  </div>
                  <div className="p-2">
                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:text-[#16a34a] hover:bg-green-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Store Profile
                    </Link>
                    <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:text-[#16a34a] hover:bg-green-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Dashboard
                    </Link>
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* ── Mobile Search Bar ── */}
        {mobileSearchOpen && (
          <div className="md:hidden px-3 pb-3 border-t border-slate-100 bg-white">
            <div className="pt-2">
              <SearchBar compact ecomStyle />
            </div>
          </div>
        )}

        {/* ── Mobile Nav Menu ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-3 py-2 grid grid-cols-4 gap-1">
              {navLinks.map(link => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-colors ${isActive ? 'text-[#16a34a] bg-green-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={link.icon} />
                    </svg>
                    <span className="text-[10px] font-semibold">{link.name}</span>
                  </Link>
                );
              })}
            </div>
            {/* Location in mobile menu */}
            <div className="px-3 pb-3">
              <button
                onClick={() => { setShowMap(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-[#16a34a] hover:bg-green-50 transition-all"
              >
                <svg className="w-4 h-4 text-[#16a34a] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Location</p>
                  <p className="text-xs font-bold text-slate-800">
                    {locationLabel ? `${locationLabel.city}${locationLabel.pincode ? ' ' + locationLabel.pincode : ''}` : 'Detect location'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>

      {showMap && <PharmacyMapModal onClose={() => setShowMap(false)} />}
    </>
  );
};

export default Navbar;

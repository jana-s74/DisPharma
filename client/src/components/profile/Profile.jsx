import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StockList from './StockList';
import AddMedicine from './AddMedicine';

// ── InfoBadge ─────────────────────────────────────────────────────────────────
const InfoBadge = ({ label, value, icon, wide = false }) => (
  <div className={`flex flex-col gap-1 min-w-0 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
      <span>{icon}</span>{label}
    </p>
    <p
      className="text-sm font-semibold text-slate-800 leading-tight truncate"
      title={value || '—'}
    >
      {value || '—'}
    </p>
  </div>
);

// ── Security Settings Card ────────────────────────────────────────────────────
const SecuritySettings = () => {
  const { user, updateSettings } = useAuth();
  const GLOBAL_DEFAULT = 10; // mirrors server env default

  const [kmValue, setKmValue] = useState(
    user?.maxLoginDistanceKm != null ? user.maxLoginDistanceKm : GLOBAL_DEFAULT
  );
  const [useCustom, setUseCustom] = useState(user?.maxLoginDistanceKm != null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync if user context updates externally
  useEffect(() => {
    if (user?.maxLoginDistanceKm != null) {
      setKmValue(user.maxLoginDistanceKm);
      setUseCustom(true);
    } else {
      setKmValue(GLOBAL_DEFAULT);
      setUseCustom(false);
    }
  }, [user?.maxLoginDistanceKm]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateSettings({
        maxLoginDistanceKm: useCustom ? parseFloat(kmValue) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const effectiveKm = useCustom ? kmValue : GLOBAL_DEFAULT;

  // Zone colour changes dynamically based on radius size
  const zoneColor =
    effectiveKm <= 2  ? '#ef4444' :
    effectiveKm <= 10 ? '#16a34a' :
    effectiveKm <= 50 ? '#f59e0b' : '#6366f1';

  const zoneLabel =
    effectiveKm <= 1  ? 'Very tight — pharmacy-only access' :
    effectiveKm <= 5  ? 'Strict — nearby area access' :
    effectiveKm <= 20 ? 'Moderate — same town/city area' :
    effectiveKm <= 100 ? 'Wide — district-level access' :
    'Very wide — state/region-level access';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${zoneColor}18` }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={zoneColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Login Location Radius</h3>
          <p className="text-xs text-slate-500 mt-0.5">Set how far from your pharmacy you can log in</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Toggle: use global default OR custom */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Custom Radius</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {useCustom
                ? `Your personal limit: ${kmValue} km`
                : `Using system default: ${GLOBAL_DEFAULT} km`}
            </p>
          </div>
          <button
            type="button"
            id="custom-radius-toggle"
            onClick={() => setUseCustom(v => !v)}
            aria-pressed={useCustom}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              useCustom ? 'bg-[#16a34a]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                useCustom ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Slider + presets (shown only when custom is ON) */}
        {useCustom && (
          <div className="space-y-4">
            {/* Live zone indicator */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{ borderColor: `${zoneColor}40`, background: `${zoneColor}08` }}
            >
              {/* Concentric circles icon */}
              <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <div className="absolute w-10 h-10 rounded-full border-2 opacity-20" style={{ borderColor: zoneColor }} />
                <div className="absolute w-6 h-6 rounded-full border-2 opacity-40" style={{ borderColor: zoneColor }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: zoneColor }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: zoneColor }}>
                  {effectiveKm} km radius
                </p>
                <p className="text-xs text-slate-500">{zoneLabel}</p>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>0.5 km</span>
                <span className="font-bold text-slate-700">{kmValue} km</span>
                <span>500 km</span>
              </div>
              <input
                id="login-radius-slider"
                type="range"
                min="0.5"
                max="500"
                step="0.5"
                value={kmValue}
                onChange={e => setKmValue(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${zoneColor} 0%, ${zoneColor} ${(kmValue / 500) * 100}%, #e2e8f0 ${(kmValue / 500) * 100}%, #e2e8f0 100%)`
                }}
              />

              {/* Quick preset buttons + manual input */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 5, 10, 25, 50, 100].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setKmValue(preset)}
                    className="px-3 py-1 rounded-full text-xs font-bold border transition-all"
                    style={
                      kmValue === preset
                        ? { background: zoneColor, borderColor: zoneColor, color: 'white' }
                        : { borderColor: '#e2e8f0', color: '#64748b', background: '#f8fafc' }
                    }
                  >
                    {preset} km
                  </button>
                ))}
                {/* Manual number input */}
                <div className="flex items-center gap-1 border border-slate-200 rounded-full px-3 py-0.5 bg-slate-50">
                  <input
                    id="login-radius-input"
                    type="number"
                    min="0.5"
                    max="500"
                    step="0.5"
                    value={kmValue}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0.5 && v <= 500) setKmValue(v);
                    }}
                    className="w-14 text-xs font-bold text-slate-700 bg-transparent outline-none text-center"
                  />
                  <span className="text-xs text-slate-400">km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
          <svg className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {useCustom
            ? `Login attempts from more than ${kmValue} km away from your registered pharmacy will be blocked.`
            : `Using the system default of ${GLOBAL_DEFAULT} km. Enable "Custom Radius" to set your own limit.`}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          id="save-radius-btn"
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ background: saved ? '#16a34a' : zoneColor, opacity: saving ? 0.75 : 1 }}
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Main Profile Component ────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/my');
      setStock(res.data);
    } catch (err) {
      setError('Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  const handleStockAdded = (newItem) => {
    setStock((prev) => [newItem, ...prev]);
    setShowAdd(false);
  };

  const handleUpdate = (updated) => {
    setStock((prev) => prev.map((s) => s._id === updated._id ? updated : s));
  };

  const handleDelete = (id) => {
    setStock((prev) => prev.filter((s) => s._id !== id));
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

  const lowCount = stock.filter((s) => s.quantity <= 10).length;
  const criticalCount = stock.filter((s) => s.quantity <= 5).length;
  const goodCount = stock.filter((s) => s.quantity > 10).length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Stock</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Manage your pharmacy inventory</p>
        </div>
        <button
          id="add-medicine-btn"
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Medicine
        </button>
      </div>

      {/* ── Pharmacy Profile Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Green header strip */}
        <div
          className="h-20 relative"
          style={{ background: 'linear-gradient(135deg, #0f3b2d 0%, #16a34a 100%)' }}
        >
          <div className="absolute -bottom-1 left-0 right-0 h-4 bg-white rounded-t-2xl" />
          <div className="absolute top-3 right-6 flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white/20 rounded-full" />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + stock pills */}
          <div className="flex items-end justify-between -mt-2 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-[#16a34a] to-[#0f3b2d] flex items-center justify-center">
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="pharmacy" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-extrabold text-white">{user?.medicalName?.[0]?.toUpperCase()}</span>
                }
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#16a34a] border-2 border-white rounded-full flex items-center justify-center text-white hover:bg-[#15803d] transition-colors shadow-md"
                title="Change photo"
              >
                {photoUploading
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                }
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                {goodCount} Good
              </span>
              {lowCount > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 rounded-full inline-block animate-pulse" />
                  {lowCount} Low
                </span>
              )}
              {criticalCount > 0 && (
                <span className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
                  {criticalCount} Critical
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-full">
                📦 {stock.length} Total
              </span>
            </div>
          </div>

          {/* Pharmacy name & address */}
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{user?.medicalName}</h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {user?.address}{user?.pincode ? ` — ${user.pincode}` : ''}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <InfoBadge label="Owner" value={user?.ownerName} icon="👤" />
            <InfoBadge label="Phone" value={user?.phone} icon="📞" />
            <InfoBadge label="License No" value={user?.licenseNo} icon="📄" />
            <InfoBadge label="Email" value={user?.email} icon="✉️" wide />
            <InfoBadge label="Pincode" value={user?.pincode} icon="📮" />
            <InfoBadge label="Address" value={user?.address} icon="📍" wide />
          </div>
        </div>
      </div>

      {/* ── Login Location Security Settings ── */}
      <SecuritySettings />

      {/* ── Stock List ── */}
      <StockList
        stock={stock}
        loading={loading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        error={error}
      />

      {/* ── Add Medicine Modal ── */}
      {showAdd && (
        <AddMedicine
          onClose={() => setShowAdd(false)}
          onAdded={handleStockAdded}
        />
      )}
    </div>
  );
};

export default Profile;

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StockList from './StockList';
import AddMedicine from './AddMedicine';

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
          {/* Decorative dots */}
          <div className="absolute top-3 right-6 flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white/20 rounded-full" />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-2 mb-5">
            {/* Avatar with upload */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-[#16a34a] to-[#0f3b2d] flex items-center justify-center">
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="pharmacy" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-extrabold text-white">{user?.medicalName?.[0]?.toUpperCase()}</span>
                }
              </div>
              {/* Camera button */}
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

            {/* Stock summary pills */}
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

          {/* Pharmacy name */}
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{user?.medicalName}</h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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

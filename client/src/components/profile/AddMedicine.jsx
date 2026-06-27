import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AddMedicine = ({ onClose, onAdded }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ quantity: '', buyPrice: '', sellPrice: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const searchTimeout = useRef(null);

  // Fetch master medicine list
  const fetchMedicines = async (query) => {
    setLoading(true);
    try {
      // Use search API with own stock to find medicines from master list
      const res = await api.get(`/search?name=${encodeURIComponent(query || 'a')}`);
      const allItems = [...(res.data.own || []), ...(res.data.nearby || [])];
      
      // Deduplicate by medicineName to avoid showing same medicine multiple times
      const uniqueMedicines = [];
      const seen = new Set();
      for (const item of allItems) {
        const nameLower = item.medicineName.toLowerCase();
        if (!seen.has(nameLower)) {
          seen.add(nameLower);
          uniqueMedicines.push(item);
        }
      }

      // Also get master list via a different approach - use a raw name list
      setMedicines(uniqueMedicines.slice(0, 10));
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Fetch full medicine list on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // We'll fetch from server - for master list we use the seed data
        // Since we don't have a dedicated /medicines route, we'll show a text input
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSelected(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length >= 2) {
      searchTimeout.current = setTimeout(() => fetchMedicines(val), 350);
    } else {
      setMedicines([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'buyPrice') {
      const bp = parseFloat(value);
      setForm((prev) => ({
        ...prev,
        buyPrice: value,
        sellPrice: !isNaN(bp) ? (bp * 1.04).toFixed(2) : prev.sellPrice,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const e = {};
    if (!search.trim()) e.name = 'Medicine name is required';
    if (!form.quantity || Number(form.quantity) < 0) e.quantity = 'Valid quantity required';
    if (!form.buyPrice || Number(form.buyPrice) <= 0) e.buyPrice = 'Valid buy price required';
    if (!form.sellPrice || Number(form.sellPrice) <= 0) e.sellPrice = 'Valid sell price required';
    return e;
  };

  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('medicineId', selected?.medicineId || '000000000000000000000000');
      formData.append('medicineName', search.trim());
      formData.append('quantity', Number(form.quantity));
      formData.append('buyPrice', Number(form.buyPrice));
      formData.append('sellPrice', Number(form.sellPrice));
      
      if (image) {
        formData.append('image', image);
      }

      const res = await api.post('/stock/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      onAdded(res.data);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to add medicine' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Add Medicine to Stock</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{errors.general}</div>
          )}

          {/* Medicine name input */}
          <div className="relative">
            <label className="label">Medicine Name</label>
            <input
              id="add-medicine-name"
              type="text"
              value={search}
              onChange={handleSearchChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Type medicine name (e.g. Dolo 650)"
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}

            {/* Suggestions dropdown */}
            {medicines.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-50 border border-slate-300 rounded-xl shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                {medicines.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSearch(m.medicineName); setSelected(m); setMedicines([]); }}
                    className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-100 text-left border-b border-slate-200 last:border-0 text-sm text-slate-800"
                  >
                    <span>{m.medicineName}</span>
                    <span className="text-xs text-slate-500 font-medium">{user?.medicalName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input
                id="add-quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
                placeholder="e.g. 100"
                min="0"
              />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="label">Buy Price (₹)</label>
              <input
                id="add-buyprice"
                name="buyPrice"
                type="number"
                value={form.buyPrice}
                onChange={handleChange}
                className={`input-field ${errors.buyPrice ? 'border-red-500' : ''}`}
                placeholder="e.g. 50"
                min="0"
                step="0.01"
              />
              {errors.buyPrice && <p className="text-red-400 text-xs mt-1">{errors.buyPrice}</p>}
            </div>
            <div>
              <label className="label">Sell Price (₹)</label>
              <input
                id="add-sellprice"
                name="sellPrice"
                type="number"
                value={form.sellPrice}
                onChange={handleChange}
                className={`input-field ${errors.sellPrice ? 'border-red-500' : ''}`}
                placeholder="Auto +4%"
                min="0"
                step="0.01"
              />
              {errors.sellPrice && <p className="text-red-400 text-xs mt-1">{errors.sellPrice}</p>}
            </div>
          </div>

          {form.buyPrice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              💡 Sell price auto-set to {(Number(form.buyPrice) * 1.04).toFixed(2)} (4% margin). You can override.
            </div>
          )}

          {/* Image Upload Input */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <label className="label text-xs mb-2">Medicine Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer w-full"
            />
            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
              Upload from device, or leave blank and our AI will automatically fetch/generate the image.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              id="save-medicine-btn"
              type="submit"
              disabled={saving}
              className="btn-success flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
              ) : 'Add to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicine;

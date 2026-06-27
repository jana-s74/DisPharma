import { useState } from 'react';
import api from '../../utils/api';

const StockList = ({ stock, loading, onUpdate, onDelete, error }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ quantity: item.quantity, buyPrice: item.buyPrice, sellPrice: item.sellPrice });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await api.put(`/stock/${id}`, editForm);
      onUpdate(res.data);
      cancelEdit();
    } catch (err) {
      // Could show error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleteId !== id) { setDeleteId(id); return; } // First click = confirm
    try {
      await api.delete(`/stock/${id}`);
      onDelete(id);
      setDeleteId(null);
    } catch (err) {
      // Could show error
    }
  };

  const getStockBadge = (qty) => {
    if (qty <= 5) return <span className="badge-critical">Critical</span>;
    if (qty <= 10) return <span className="badge-low">Low</span>;
    return <span className="badge-good">Good</span>;
  };

  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="card p-6 text-center text-red-400">{error}</div>;
  }

  if (stock.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-slate-500 font-medium">No medicines in stock</p>
        <p className="text-slate-500 text-sm mt-1">Click "Add Medicine" to start building your inventory</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/70">
            <th className="table-header">Medicine Name</th>
            <th className="table-header">Buy Price (₹)</th>
            <th className="table-header">Sell Price (₹)</th>
            <th className="table-header">Quantity</th>
            <th className="table-header">Status</th>
            <th className="table-header">Last Updated</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((item) => (
            <tr
              key={item._id}
              className={`hover:bg-slate-50/40 transition-colors ${
                item.quantity <= 5 ? 'bg-red-500/5' : item.quantity <= 10 ? 'bg-amber-500/5' : ''
              }`}
            >
              <td className="table-cell">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center p-1.5 shadow-inner">
                      <img 
                      src={item.imageUrl ? `http://localhost:5000${item.imageUrl}` : '/generic_medicine_box.png'} 
                      alt={item.medicineName} 
                      className={`w-full h-full object-cover opacity-80 ${!item.imageUrl || item.imageUrl.startsWith('/') ? 'mix-blend-luminosity' : ''}`}
                      onError={(e) => { e.target.src = '/generic_medicine_box.png'; }}
                      />
                    </div>
                  <p className="font-medium text-slate-900 leading-tight">{item.medicineName}</p>
                </div>
              </td>

              {/* Editable fields */}
              {editingId === item._id ? (
                <>
                  <td className="table-cell">
                    <input
                      type="number"
                      value={editForm.buyPrice}
                      onChange={(e) => setEditForm({ ...editForm, buyPrice: Number(e.target.value) })}
                      className="input-field py-1.5 text-sm w-24"
                      min="0"
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      type="number"
                      value={editForm.sellPrice}
                      onChange={(e) => setEditForm({ ...editForm, sellPrice: Number(e.target.value) })}
                      className="input-field py-1.5 text-sm w-24"
                      min="0"
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                      className="input-field py-1.5 text-sm w-20"
                      min="0"
                    />
                  </td>
                </>
              ) : (
                <>
                  <td className="table-cell text-slate-700">₹{item.buyPrice}</td>
                  <td className="table-cell text-emerald-400 font-semibold">₹{item.sellPrice}</td>
                  <td className="table-cell text-slate-700">{item.quantity}</td>
                </>
              )}

              <td className="table-cell">{getStockBadge(editingId === item._id ? editForm.quantity : item.quantity)}</td>
              <td className="table-cell text-xs text-slate-500">
                {new Date(item.lastUpdated).toLocaleDateString('en-IN')}
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1">
                  {editingId === item._id ? (
                    <>
                      <button
                        onClick={() => handleSave(item._id)}
                        disabled={saving}
                        className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs bg-slate-100 text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          deleteId === item._id
                            ? 'bg-red-600 text-slate-900'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {deleteId === item._id ? 'Confirm' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockList;

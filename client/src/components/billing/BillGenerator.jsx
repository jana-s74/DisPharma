import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const BillGenerator = ({ selectedItems, onQuantityChange, onRemove, onClearAll, onBillGenerated }) => {
  const navigate = useNavigate();
  const [toMedicalId, setToMedicalId] = useState('');
  const [toMedicalName, setToMedicalName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [stockSummary, setStockSummary] = useState(null);

  // Auto-populate the Destination Medical ID from the selected items
  useEffect(() => {
    if (selectedItems.length > 0) {
      setToMedicalId(selectedItems[0].medicalId || '');
      setToMedicalName(selectedItems[0].medicalName || 'Unknown Pharmacy');
      setError('');
    } else {
      setToMedicalId('');
      setToMedicalName('');
    }
  }, [selectedItems]);

  const totalBuy = selectedItems.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
  const totalSell = selectedItems.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
  const totalMargin = totalSell - totalBuy;

  const handleGenerate = async () => {
    if (!toMedicalId.trim()) {
      setError('Please enter the destination medical ID');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const items = selectedItems.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        sourceMedicalId: item.medicalId,   // whose stock to deduct
        stockItemId: item._id,             // the stock document _id
      }));
      const res = await api.post('/bill/generate', { toMedicalId: toMedicalId.trim(), items });

      // Show stock update summary briefly
      if (res.data.stockUpdates?.length > 0) {
        setStockSummary(res.data.stockUpdates);
        setTimeout(() => setStockSummary(null), 4000);
      }

      // Refresh explore page stock quantities
      if (onBillGenerated) onBillGenerated();

      navigate('/bill', { state: { newBill: res.data } });
      onClearAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-56 right-0 z-40 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200/70 shadow-2xl">
        {/* Selected items row */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0">
            Selected ({selectedItems.length})
          </span>
          {selectedItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-2 bg-slate-100/60 border border-slate-300/50 rounded-xl px-3 py-1.5 flex-shrink-0"
            >
              <span className="text-xs font-medium text-slate-800 max-w-[140px] truncate">{item.medicineName}</span>
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1">
                <button
                  onClick={() => onQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                  className="text-slate-500 hover:text-slate-900 w-5 h-5 flex items-center justify-center text-sm"
                >
                  −
                </button>
                <span className="text-xs font-semibold text-slate-800 w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                  className="text-slate-500 hover:text-slate-900 w-5 h-5 flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">
                ₹{(item.sellPrice * item.quantity).toFixed(0)}
              </span>
              <button
                onClick={() => onRemove(item._id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom bar with totals + action */}
        <div className="px-6 pb-4 flex items-center gap-4">
          {/* Totals */}
          <div className="flex items-center gap-5 flex-1">
            <div>
              <p className="text-xs text-slate-500">Total (Buy)</p>
              <p className="text-sm font-semibold text-slate-700">₹{totalBuy.toFixed(2)}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-xs text-slate-500">Total (Sell)</p>
              <p className="text-lg font-bold text-slate-900">₹{totalSell.toFixed(2)}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-xs text-slate-500">Your Margin</p>
              <p className="text-lg font-bold text-emerald-400">+₹{totalMargin.toFixed(2)}</p>
            </div>
          </div>

          {/* To Medical ID Automated Display */}
          <div className="w-64">
            <div className="bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col justify-center">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Billed To (Destination)</p>
              <p className="text-sm font-semibold text-blue-400 truncate" title={toMedicalName}>
                {toMedicalName || 'Select a medicine...'}
              </p>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <button
            onClick={onClearAll}
            className="btn-secondary py-2 text-sm"
          >
            Clear All
          </button>
          <button
            id="generate-bill-btn"
            onClick={handleGenerate}
            disabled={generating || selectedItems.length === 0}
            className="btn-success flex items-center gap-2 py-2.5"
          >
            {generating ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Generate Bill</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillGenerator;

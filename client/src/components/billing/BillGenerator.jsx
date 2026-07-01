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
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200/70 shadow-2xl">
        {/* Selected items row — horizontal scroll */}
        <div className="px-3 sm:px-6 pt-3 pb-2 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
          </span>
          {selectedItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/60 border border-slate-300/50 rounded-xl px-2 sm:px-3 py-1.5 flex-shrink-0"
            >
              <span className="text-xs font-medium text-slate-800 max-w-[90px] sm:max-w-[140px] truncate">{item.medicineName}</span>
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 rounded-lg px-1">
                <button onClick={() => onQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                  className="text-slate-500 hover:text-slate-900 w-5 h-5 flex items-center justify-center text-sm">−</button>
                <span className="text-xs font-semibold text-slate-800 w-5 sm:w-6 text-center">{item.quantity}</span>
                <button onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                  className="text-slate-500 hover:text-slate-900 w-5 h-5 flex items-center justify-center text-sm">+</button>
              </div>
              <span className="text-xs text-emerald-500 font-semibold hidden sm:inline">
                ₹{(item.sellPrice * item.quantity).toFixed(0)}
              </span>
              <button onClick={() => onRemove(item._id)} className="text-slate-400 hover:text-red-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom bar: totals + destination + actions */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Totals */}
          <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
            <div className="hidden sm:block">
              <p className="text-[10px] text-slate-500">Total (Buy)</p>
              <p className="text-sm font-semibold text-slate-700">₹{totalBuy.toFixed(2)}</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-500">Total Sell</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">₹{totalSell.toFixed(2)}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-500">Margin</p>
              <p className="text-base sm:text-lg font-bold text-emerald-500">+₹{totalMargin.toFixed(2)}</p>
            </div>
          </div>

          {/* Destination — hidden on very small screens */}
          <div className="hidden sm:block flex-shrink-0 w-44 md:w-56">
            <div className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 flex flex-col justify-center">
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Billed To</p>
              <p className="text-xs font-semibold text-blue-500 truncate" title={toMedicalName}>
                {toMedicalName || 'Select a medicine...'}
              </p>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <button onClick={onClearAll} className="btn-secondary py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            Clear
          </button>
          <button
            id="generate-bill-btn"
            onClick={handleGenerate}
            disabled={generating || selectedItems.length === 0}
            className="btn-success flex items-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm flex-shrink-0"
          >
            {generating ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span className="hidden sm:inline">Generating...</span></>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Generate Bill</>
            )}
          </button>
        </div>

        {/* Mobile destination display */}
        {error && <p className="sm:hidden text-red-400 text-xs px-3 pb-2">{error}</p>}
        {toMedicalName && (
          <div className="sm:hidden px-3 pb-2">
            <p className="text-xs text-slate-500">Billing to: <span className="font-bold text-blue-500">{toMedicalName}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillGenerator;

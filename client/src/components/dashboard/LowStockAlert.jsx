import { useNavigate } from 'react-router-dom';

const LowStockAlert = ({ item }) => {
  const navigate = useNavigate();
  const isCritical = item.quantity <= 5;
  const isLow = item.quantity > 5 && item.quantity <= 10;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
      isCritical
        ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
        : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center p-1 shadow-sm">
              <img 
              src={item.imageUrl ? `http://localhost:5000${item.imageUrl}` : '/generic_medicine_box.png'} 
              alt={item.medicineName} 
              className={`w-full h-full object-cover opacity-80 ${!item.imageUrl || item.imageUrl.startsWith('/') ? 'mix-blend-luminosity' : ''}`}
              onError={(e) => { e.target.src = '/generic_medicine_box.png'; }}
              />
            </div>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{item.medicineName}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
          isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isCritical ? '⚠ Critical' : '↓ Low'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
            {item.quantity}
          </p>
          <p className="text-xs text-slate-500">units left</p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
            isCritical
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          }`}
        >
          Update Stock
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-2 bg-slate-100 rounded-full h-1.5">
        <div
          className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${Math.min((item.quantity / 10) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default LowStockAlert;

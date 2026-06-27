const ProductCard = ({ item, selected, onSelect, isOwn = false }) => {
  const stockStatus =
    item.quantity <= 5 ? 'critical' : item.quantity <= 10 ? 'low' : 'good';

  const stockColor = {
    good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    low: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  }[stockStatus];

  return (
    <div
      className={`bg-white rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden flex flex-col ${selected
        ? 'border-[#16a34a] ring-2 ring-[#16a34a]/20 shadow-xl shadow-green-500/10'
        : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1'
        }`}
      onClick={() => onSelect(item)}
    >
      {/* ── Product Image ─────────────────────────────────── */}
      <div className="relative w-full bg-slate-50 border-b border-slate-100" style={{ aspectRatio: '1/1' }}>
        <img
          src={item.imageUrl ? `http://localhost:5000${item.imageUrl}` : '/generic_medicine_box.png'}
          alt={item.medicineName}
          className="w-full h-full object-contain p-4"
          onError={(e) => { e.target.src = '/generic_medicine_box.png'; }}
        />

        {/* Select tick */}
        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${selected ? 'bg-[#16a34a] border-[#16a34a]' : 'border-slate-300 bg-white/90'
          }`}>
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Own store tag */}
        {isOwn && (
          <div className="absolute top-2 left-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
            Your Stock
          </div>
        )}
      </div>

      {/* ── Product Info ───────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2 flex-1">

        {/* Medicine name */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
          {item.medicineName}
        </h3>

        {/* Pharmacy name */}
        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
          <svg className="w-3 h-3 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate">{item.medicalName}</span>
        </p>

        {/* Distance */}
        {!isOwn && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {item.distance} away
          </p>
        )}

        {/* ── Quantity row ──────────────────────────────────── */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${stockColor.bg} ${stockColor.border}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stockColor.dot}`} />
          <span className={`text-xs font-semibold ${stockColor.text}`}>
            Qty: {item.quantity} units
          </span>
          {stockStatus === 'critical' && (
            <span className="text-xs text-red-500 font-bold ml-auto">⚠ Low!</span>
          )}
          {stockStatus === 'low' && (
            <span className="text-xs text-amber-500 font-medium ml-auto">Limited</span>
          )}
        </div>

        {/* ── Price + Add button ────────────────────────────── */}
        <div className="border-t border-slate-100 pt-2 mt-auto flex items-center justify-between gap-2">
          <div>
            <p className="text-xl font-black text-slate-900 leading-none">₹{item.sellPrice}</p>
            <p className="text-xs text-slate-400 mt-0.5">per unit</p>
          </div>

          {!selected ? (
            <button
              className="bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-sm shadow-green-500/20 whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            >
              + Add
            </button>
          ) : (
            <button
              className="bg-green-100 text-[#16a34a] border border-[#16a34a]/30 px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            >
              ✓ Added
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

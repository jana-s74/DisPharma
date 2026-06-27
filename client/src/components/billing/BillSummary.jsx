import { useState } from 'react';
import api from '../../utils/api';

const BillSummary = ({ bill }) => {
  const [downloading, setDownloading] = useState(false);

  if (!bill) return null;

  const { transaction, fromMedical, toMedical } = bill;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/bill/pdf/${transaction._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DisPharma_Bill_${transaction._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Bill Generated Successfully</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{fromMedical?.medicalName}</h2>
            <p className="text-sm text-slate-700 mt-1">{fromMedical?.address} | Phone: {fromMedical?.phone}</p>
            <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500 bg-slate-50/50 inline-flex px-3 py-1.5 rounded-lg border border-slate-200">
              <span>Date: {new Date(transaction.timestamp).toLocaleDateString('en-IN')}</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Time: {new Date(transaction.timestamp).toLocaleTimeString('en-IN')}</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Bill ID: #{transaction._id.toString().slice(-6).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-success flex items-center gap-2 py-2 text-sm"
              onClick={() => alert('Buy functionality coming soon!')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Buy
            </button>
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn-primary flex items-center gap-2 py-2 text-sm"
            >
              {downloading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Preparing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Download PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* From / To */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">From (Your Medical)</p>
            <p className="text-sm font-semibold text-slate-900">{fromMedical?.medicalName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{fromMedical?.address}</p>
            <p className="text-xs text-slate-500">{fromMedical?.phone}</p>
            <p className="text-xs text-slate-500 mt-1">License: {fromMedical?.licenseNo}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">To (Destination Medical)</p>
            <p className="text-sm font-semibold text-slate-900">{toMedical?.medicalName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{toMedical?.address}</p>
            <p className="text-xs text-slate-500">{toMedical?.phone}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="table-header">Medicine</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Buy Price</th>
                <th className="table-header">Sell Price (+4%)</th>
                <th className="table-header">Total</th>
                <th className="table-header">Margin</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items?.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center p-1.5 shadow-inner">
                          <img 
                          src={item.imageUrl ? `http://localhost:5000${item.imageUrl}` : '/generic_medicine_box.png'} 
                          alt={item.medicineName} 
                          className={`w-full h-full object-cover opacity-80 ${!item.imageUrl || item.imageUrl.startsWith('/') ? 'mix-blend-luminosity' : ''}`}
                          onError={(e) => { e.target.src = '/generic_medicine_box.png'; }}
                          />
                        </div>
                      <span className="font-medium text-slate-900">{item.medicineName}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-700">{item.quantity}</td>
                  <td className="table-cell text-slate-500">₹{item.buyPrice?.toFixed(2)}</td>
                  <td className="table-cell text-blue-400 font-semibold">₹{item.sellPrice?.toFixed(2)}</td>
                  <td className="table-cell text-slate-800 font-semibold">₹{(item.sellPrice * item.quantity)?.toFixed(2)}</td>
                  <td className="table-cell">
                    <span className="text-emerald-400 font-semibold">+₹{item.margin?.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals summary */}
        <div className="flex justify-end">
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-5 min-w-[280px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal (Buy):</span>
              <span className="text-slate-700 font-medium">₹{transaction.totalBuyPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-500">Grand Total (Sell):</span>
              <span className="text-slate-900 font-bold text-base">₹{transaction.totalSellPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mt-1">
              <span className="text-emerald-400 font-semibold">Your Profit (4% margin):</span>
              <span className="text-emerald-400 font-bold text-base">+₹{transaction.totalMargin?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Generated: {new Date(transaction.timestamp).toLocaleString('en-IN')} · DisPharma Inter-Pharmacy Network
        </p>
      </div>
    </div>
  );
};

export default BillSummary;

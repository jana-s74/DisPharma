import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import BillSummary from '../components/billing/BillSummary';

const BillPage = () => {
  const location = useLocation();
  const newBill = location.state?.newBill || null;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(newBill);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bill/history');
        setHistory(res.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownloadPDF = async (id) => {
    setDownloading(id);
    try {
      const res = await api.get(`/bill/pdf/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DisPharma_Bill_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setDownloading(null);
    }
  };

  const totalEarnings = history.reduce((acc, curr) => acc + (curr.totalMargin || 0), 0);
  const totalSales = history.reduce((acc, curr) => acc + (curr.totalSellPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Decorative background blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-2xl opacity-60 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bill History</h1>
              <p className="text-sm text-slate-500 font-medium">Track all your pharmacy referrals and earnings</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="relative flex items-center gap-4 sm:gap-8 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Sales</p>
            <p className="text-lg font-extrabold text-slate-800">₹{totalSales.toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Margin</p>
            <p className="text-lg font-extrabold text-emerald-600">₹{totalEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── New Bill Summary (if just generated) ── */}
      {selectedBill && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">New Bill Generated</h2>
          </div>
          <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-500/5 p-1">
            <BillSummary bill={selectedBill} />
          </div>
        </div>
      )}

      {/* ── Transaction List ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">All Transactions</h2>
          <span className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg">
            {history.length} Bills
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              📑
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">No bills generated yet</p>
            <p className="text-slate-500 font-medium">Select medicines from the Explore page to refer customers and earn margins.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((tx) => (
              <div
                key={tx._id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-200 group ${
                  selectedBill?.transaction?._id === tx._id ? 'border-emerald-500 shadow-emerald-500/10' : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="text-base font-bold text-slate-900 truncate">
                        {tx.items?.map((i) => i.medicineName).join(', ')}
                      </p>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
                        {tx.items?.length} item{tx.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold">
                          {tx.toMedicalId?.medicalName?.[0]?.toUpperCase() || '?'}
                        </span>
                        <span className="truncate max-w-[150px]">To: {tx.toMedicalId?.medicalName || 'Unknown'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Pricing & Action */}
                  <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Sell</p>
                      <p className="text-sm font-bold text-slate-800">₹{tx.totalSellPrice?.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-0.5">Margin</p>
                      <p className="text-base font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        +₹{tx.totalMargin?.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadPDF(tx._id)}
                      disabled={downloading === tx._id}
                      className="flex items-center justify-center w-10 h-10 bg-slate-50 hover:bg-[#16a34a] text-slate-500 hover:text-white border border-slate-200 hover:border-[#16a34a] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-sm"
                      title="Download PDF Invoice"
                    >
                      {downloading === tx._id ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 transition-transform group-hover/btn:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LowStockAlert from './LowStockAlert';

const StatCard = ({ label, value, icon, gradient, textColor, borderColor, loading, suffix = '' }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-5 ${borderColor} bg-white shadow-sm hover:shadow-md transition-all duration-300 group`}>
    {/* Gradient blob */}
    <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-15 blur-xl ${gradient}`} />

    <div className="relative flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${gradient} opacity-90 shadow-sm`}>
        {icon}
      </div>
      <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${textColor} bg-current/10 opacity-80`}>
        Today
      </div>
    </div>

    <div className="relative mt-3">
      {loading ? (
        <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
          {value}{suffix}
        </p>
      )}
      <p className="text-sm text-slate-500 font-medium mt-0.5">{label}</p>
    </div>

    {/* Bottom accent line */}
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${gradient} opacity-40 group-hover:opacity-80 transition-opacity`} />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ todayProfit: 0, referralsMade: 0, pendingSettlements: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, lowRes, txRes] = await Promise.all([
          api.get('/bill/stats'),
          api.get('/stock/low'),
          api.get('/bill/history'),
        ]);
        setStats(statsRes.data);
        setLowStock(lowRes.data);
        setRecentTransactions(txRes.data.slice(0, 10));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: "Today's Profit",
      value: `₹${stats.todayProfit.toFixed(2)}`,
      icon: '💰',
      gradient: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Referrals Made Today',
      value: stats.referralsMade,
      icon: '🔗',
      gradient: 'bg-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Pending Settlements',
      value: stats.pendingSettlements,
      icon: '⏳',
      gradient: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-7">

      {/* ── Hero Welcome Banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0f3b2d 0%, #16a34a 60%, #22c55e 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-24 w-20 h-20 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-8 w-36 h-36 bg-white/5 rounded-full" />

        <div className="relative px-7 py-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest mb-1">
              {greeting} 👋
            </p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {user?.medicalName}
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-md">
              Your pharmacy network dashboard — track profits, manage stock, and handle referrals all in one place.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => navigate('/search')}
                className="bg-white text-[#16a34a] text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Explore Medicines
              </button>
              <button
                onClick={() => navigate('/bill')}
                className="bg-white/15 border border-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/25 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                View Bills
              </button>
            </div>
          </div>

          {/* Pill/medicine illustration */}
          <div className="hidden lg:flex items-center gap-3 pr-4">
            <div className="flex flex-col gap-2">
              {['💊', '💉', '🏥', '🩺'].map((icon, i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm"
                  style={{ transform: `rotate(${i % 2 === 0 ? '-6deg' : '6deg'})`, animationDelay: `${i * 0.2}s` }}
                >
                  {icon}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {['🔬', '📋', '💰', '📦'].map((icon, i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm"
                  style={{ transform: `rotate(${i % 2 === 0 ? '8deg' : '-8deg'})` }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="bg-black/10 px-7 py-2 flex items-center gap-6 text-xs text-emerald-100/70 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse inline-block" />
            Network Active
          </span>
          <span>Owner: {user?.ownerName}</span>
          <span>License: {user?.licenseNo}</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Low Stock Alerts ── */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <span className="text-base">⚠️</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Low Stock Alerts</h2>
                <p className="text-xs text-slate-500">{lowStock.length} items need attention</p>
              </div>
              <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                {lowStock.length} items
              </span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs text-[#16a34a] hover:text-[#15803d] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {lowStock.slice(0, 8).map((item) => (
              <LowStockAlert key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">{recentTransactions.length} recent bills</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/bill')}
            className="text-xs text-[#16a34a] hover:text-[#15803d] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-4xl">📋</div>
            <p className="font-semibold text-slate-700">No transactions yet</p>
            <p className="text-sm text-slate-400 mt-1">Generate bills from the Explore page</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 text-sm text-[#16a34a] font-semibold border border-[#16a34a]/30 px-4 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            >
              Go to Explore →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-header rounded-tl-none">Medicine(s)</th>
                  <th className="table-header">To Medical</th>
                  <th className="table-header">Total Sell</th>
                  <th className="table-header">Margin</th>
                  <th className="table-header rounded-tr-none">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr
                    key={tx._id}
                    className="hover:bg-slate-50/70 transition-colors"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="table-cell">
                      <p className="text-slate-800 font-semibold text-xs leading-tight">
                        {tx.items?.map((i) => i.medicineName).join(', ') || '-'}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                        {tx.items?.length} item{tx.items?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-[#16a34a] to-[#0f3b2d] rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {tx.toMedicalId?.medicalName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-slate-700 font-medium text-xs">{tx.toMedicalId?.medicalName || '-'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-0.5 text-blue-600 font-bold text-sm">
                        ₹{tx.totalSellPrice?.toFixed(2)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 font-bold text-xs px-2 py-1 rounded-lg border border-emerald-100">
                        +₹{tx.totalMargin?.toFixed(2)}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500 text-xs">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

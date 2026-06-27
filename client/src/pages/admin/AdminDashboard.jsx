import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pharmacies');
  const [selectedTx, setSelectedTx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredPharmacies = pharmacies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.medicalName?.toLowerCase().includes(q) ||
      p.ownerName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.licenseNo?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const itemsStr = tx.items?.map((i) => i.medicineName).join(' ').toLowerCase() || '';
    return (
      tx.fromMedicalId?.medicalName?.toLowerCase().includes(q) ||
      tx.toMedicalId?.medicalName?.toLowerCase().includes(q) ||
      itemsStr.includes(q)
    );
  });

  const downloadExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'pharmacies') {
      csvContent += "Medical Name,Owner Name,Email,Phone,License No,Address,Connection Date\n";
      filteredPharmacies.forEach((p) => {
        const row = [
          `"${p.medicalName || ''}"`,
          `"${p.ownerName || ''}"`,
          `"${p.email || ''}"`,
          `"${p.phone || ''}"`,
          `"${p.licenseNo || ''}"`,
          `"${p.address || ''}"`,
          `"${new Date(p.createdAt).toLocaleDateString()}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      csvContent += "Timestamp,From,To,Items,Total Buy Price,Total Sell Price,Total Margin\n";
      filteredTransactions.forEach((tx) => {
        const itemsStr = tx.items?.map(i => `${i.medicineName} (${i.quantity})`).join("; ") || "";
        const row = [
          `"${new Date(tx.timestamp).toLocaleString('en-IN')}"`,
          `"${tx.fromMedicalId?.medicalName || 'Unknown'}"`,
          `"${tx.toMedicalId?.medicalName || 'Unknown'}"`,
          `"${itemsStr}"`,
          tx.totalBuyPrice || 0,
          tx.totalSellPrice || 0,
          tx.totalMargin || 0
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReceipt = () => {
    if (!selectedTx) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Transaction ID,${selectedTx._id}\n`;
    csvContent += `Timestamp,${new Date(selectedTx.timestamp).toLocaleString('en-IN')}\n\n`;
    
    csvContent += `Source Node,${selectedTx.fromMedicalId?.medicalName || 'Unknown Origin'}\n`;
    csvContent += `Source Contact,${selectedTx.fromMedicalId?.phone || 'N/A'}\n`;
    csvContent += `Source Address,"${selectedTx.fromMedicalId?.address || 'N/A'}"\n\n`;

    csvContent += `Destination Node,${selectedTx.toMedicalId?.medicalName || 'Unknown Dest'}\n`;
    csvContent += `Destination Contact,${selectedTx.toMedicalId?.phone || 'N/A'}\n`;
    csvContent += `Destination Address,"${selectedTx.toMedicalId?.address || 'N/A'}"\n\n`;

    csvContent += "Medicine,Quantity,Buy Price,Sell Price,Margin\n";
    selectedTx.items?.forEach((item) => {
      csvContent += `"${item.medicineName}",${item.quantity},${item.buyPrice?.toFixed(2)},${item.sellPrice?.toFixed(2)},${item.margin?.toFixed(2)}\n`;
    });
    
    csvContent += `\nTotal Value,,,${selectedTx.totalSellPrice?.toFixed(2)}\n`;
    csvContent += `Total Margin,,,${selectedTx.totalMargin?.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `receipt_${selectedTx._id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Data Prep
  const processAnalyticsData = () => {
    const timeMap = {};
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!timeMap[date]) timeMap[date] = { date, volume: 0, margin: 0, count: 0 };
      timeMap[date].volume += tx.totalSellPrice || 0;
      timeMap[date].margin += tx.totalMargin || 0;
      timeMap[date].count += 1;
    });
    const timelineData = Object.values(timeMap).sort((a,b) => new Date(a.date) - new Date(b.date));

    const nodeMap = {};
    transactions.forEach(tx => {
      const name = tx.toMedicalId?.medicalName || 'Unknown';
      if (!nodeMap[name]) nodeMap[name] = { name, purchases: 0 };
      nodeMap[name].purchases += tx.totalSellPrice || 0;
    });
    const nodeData = Object.values(nodeMap).sort((a,b) => b.purchases - a.purchases).slice(0, 5);

    const medMap = {};
    transactions.forEach(tx => {
      tx.items?.forEach(item => {
        const name = item.medicineName;
        if (!medMap[name]) medMap[name] = { name, quantity: 0 };
        medMap[name].quantity += item.quantity;
      });
    });
    const medicineData = Object.values(medMap).sort((a,b) => b.quantity - a.quantity).slice(0, 5);

    return { timelineData, nodeData, medicineData };
  };

  const { timelineData, nodeData, medicineData } = processAnalyticsData();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        setLoading(true);
        const [statsRes, pharmRes, txRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats', config),
          axios.get('http://localhost:5000/api/admin/pharmacies', config),
          axios.get('http://localhost:5000/api/admin/transactions', config),
        ]);

        setStats(statsRes.data);
        setPharmacies(pharmRes.data);
        setTransactions(txRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center -mt-20">
        <div className="relative">
          <div className="absolute inset-0 bg-[#a3e635] blur-xl opacity-50 animate-pulse" />
          <svg className="relative animate-spin w-16 h-16 text-[#0f3b2d]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
        <p className="mt-6 text-[#0f3b2d] font-bold tracking-widest uppercase text-sm animate-pulse">Initializing Admin Control</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* ── 3D Header Banner ── */}
      <div className="relative w-full h-64 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(163,230,53,0.15)] border-4 border-[#a3e635]/20 group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b3124] via-[#0f3b2d]/90 to-[#0f3b2d]/40 z-10" />
        <img 
          src="/images/admin_header.png" 
          alt="Network Header" 
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-in-out mix-blend-overlay"
        />
        <div className="absolute inset-0 z-20 p-10 flex flex-col justify-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0f3b2d] font-black text-3xl shadow-2xl mb-6">
            D
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
            Network <span className="text-[#a3e635]">Overview</span>
          </h1>
          <p className="text-emerald-100/80 font-medium tracking-wide uppercase text-sm max-w-lg">
            Live analytics & global state of the DisPharma medical supply chain infrastructure.
          </p>
        </div>
      </div>

      {/* ── 3D Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Pharmacies', 
            value: stats?.totalPharmacies, 
            icon: '/icons/pharmacy.png',
            bgClass: 'from-emerald-100/70 to-emerald-50/30 border-emerald-100/50',
            textClass: 'group-hover:text-emerald-600'
          },
          { 
            label: 'Global Inventory', 
            value: stats?.totalStockItems, 
            icon: '/icons/inventory.png',
            bgClass: 'from-blue-100/70 to-blue-50/30 border-blue-100/50',
            textClass: 'group-hover:text-blue-600'
          },
          { 
            label: 'Transactions', 
            value: stats?.totalTransactions, 
            icon: '/icons/transaction.png',
            bgClass: 'from-amber-100/70 to-amber-50/30 border-amber-100/50',
            textClass: 'group-hover:text-amber-600'
          },
          { 
            label: 'Network Volume (₹)', 
            value: stats?.totalVolume?.toFixed(2), 
            icon: '/icons/volume.png',
            bgClass: 'from-purple-100/70 to-purple-50/30 border-purple-100/50',
            textClass: 'group-hover:text-purple-600'
          },
        ].map((stat, i) => (
          <div key={i} className="relative bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100/80 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            {/* Subtle background glow on hover */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.bgClass} opacity-0 group-hover:opacity-20 rounded-full blur-2xl transition-opacity duration-300`} />
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className={`text-3xl md:text-4xl font-black text-[#0f3b2d] tracking-tight ${stat.textClass} transition-colors duration-300`}>
                  {stat.value || 0}
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <img src={stat.icon} alt={stat.label} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Static Data Analytics ── */}
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-[#0f3b2d] font-black text-lg mb-6 tracking-wide">Network Volume & Margin</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#0f3b2d' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" name="Volume (₹)" />
                <Area type="monotone" dataKey="margin" stroke="#a3e635" strokeWidth={3} fill="transparent" name="Margin (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-[#0f3b2d] font-black text-lg mb-6 tracking-wide">Top Receiving Nodes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nodeData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#0f3b2d', fontSize: 12, fontWeight: 'bold' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="purchases" fill="#0f3b2d" radius={[0, 8, 8, 0]} name="Purchases (₹)" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-[#0f3b2d] font-black text-lg mb-6 tracking-wide">Top Medicines Dispensed</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicineData}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {medicineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0f3b2d', '#16a34a', '#84cc16', '#a3e635', '#bef264'][index % 5]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#0f3b2d' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative flex flex-col min-h-[500px]">
        
        {/* Top Navigation & Actions */}
        <div className="border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-end px-2 sm:px-6 pt-6 pb-0 z-20 gap-4">
          
          {/* Horizontal Tabs */}
          <div className="flex flex-row overflow-x-auto hide-scrollbar w-full lg:w-auto gap-2">
            <button
              onClick={() => setActiveTab('pharmacies')}
              className={`px-6 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 border-b-4 whitespace-nowrap ${
                activeTab === 'pharmacies' 
                  ? 'border-[#16a34a] text-[#0f3b2d] bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-[#0f3b2d] hover:bg-slate-100/50 rounded-t-2xl'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>Registered Nodes</span>
                <span className={`py-0.5 px-2 rounded-lg text-xs shadow-sm ${activeTab === 'pharmacies' ? 'bg-[#16a34a]/10 text-[#16a34a]' : 'bg-slate-200/50 text-slate-500'}`}>{pharmacies.length}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 border-b-4 whitespace-nowrap ${
                activeTab === 'transactions' 
                  ? 'border-[#16a34a] text-[#0f3b2d] bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-[#0f3b2d] hover:bg-slate-100/50 rounded-t-2xl'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>Global Transfers</span>
                <span className={`py-0.5 px-2 rounded-lg text-xs shadow-sm ${activeTab === 'transactions' ? 'bg-[#16a34a]/10 text-[#16a34a]' : 'bg-slate-200/50 text-slate-500'}`}>{transactions.length}</span>
              </div>
            </button>
          </div>

          {/* Search & Export Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto pb-4">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent text-sm text-slate-700 bg-white shadow-sm"
              />
            </div>
            <button
              onClick={downloadExcel}
              className="bg-white border border-slate-200 text-[#0f3b2d] hover:bg-slate-50 hover:border-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5 text-[#16a34a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto w-full p-0">
          {activeTab === 'pharmacies' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-gradient-to-r from-[#0b3124] to-[#0f3b2d] text-emerald-100 text-xs uppercase tracking-widest font-extrabold border-b border-[#a3e635]/20">
                  <tr>
                    <th className="px-8 py-5 text-[#a3e635]">Node Name</th>
                    <th className="px-8 py-5">Contact Vector</th>
                    <th className="px-8 py-5">Location Data</th>
                    <th className="px-8 py-5">Connection Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredPharmacies.map((pharma, idx) => (
                    <tr 
                      key={pharma._id} 
                      className={`transition-colors group hover:bg-[#a3e635]/10 ${
                        idx % 2 === 0 ? 'bg-[#0f3b2d]/[0.02]' : 'bg-[#a3e635]/[0.02]'
                      }`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0b3124] to-[#0f3b2d] flex items-center justify-center font-black text-[#a3e635] shadow-[0_4px_10px_rgba(15,59,45,0.15)] border border-[#a3e635]/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            {pharma.medicalName[0]}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#0f3b2d] text-base tracking-wide group-hover:text-[#16a34a] transition-colors">{pharma.medicalName}</p>
                            <p className="text-xs text-slate-400 font-semibold tracking-wider">Owner: {pharma.ownerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[#0f3b2d] font-bold text-sm">{pharma.email}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-1">{pharma.phone}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-block bg-[#0f3b2d]/10 text-[#0f3b2d] text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-[#0f3b2d]/10 mb-1.5">
                          LIC: {pharma.licenseNo}
                        </span>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">{pharma.address}</p>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-semibold">
                        {new Date(pharma.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                  {filteredPharmacies.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-16 text-slate-400 font-medium uppercase tracking-widest">No nodes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-gradient-to-r from-[#0b3124] to-[#0f3b2d] text-emerald-100 text-xs uppercase tracking-widest font-extrabold border-b border-[#a3e635]/20">
                  <tr>
                    <th className="px-8 py-5 text-[#a3e635]">Payload</th>
                    <th className="px-8 py-5">Transfer Route</th>
                    <th className="px-8 py-5">Economic Value</th>
                    <th className="px-8 py-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredTransactions.map((tx, idx) => (
                    <tr 
                      key={tx._id} 
                      onClick={() => setSelectedTx(tx)} 
                      className={`transition-colors group cursor-pointer hover:bg-[#a3e635]/10 ${
                        idx % 2 === 0 ? 'bg-[#0f3b2d]/[0.02]' : 'bg-[#a3e635]/[0.02]'
                      }`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0b3124] to-[#0f3b2d] flex items-center justify-center p-1.5 shadow-[0_4px_10px_rgba(15,59,45,0.15)] border border-[#a3e635]/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 overflow-hidden">
                            <img src="/icons/payload.png" alt="Payload" className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#0f3b2d] text-base tracking-wide truncate max-w-[200px] group-hover:text-[#16a34a] transition-colors" title={tx.items?.map((i) => i.medicineName).join(', ')}>
                              {tx.items?.map((i) => i.medicineName).join(', ')}
                            </p>
                            <span className="inline-block bg-[#16a34a]/10 text-[#16a34a] text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded mt-0.5 shadow-sm">
                              {tx.items?.length} Assets
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-[#0f3b2d] font-bold text-sm">{tx.fromMedicalId?.medicalName || 'Unknown Origin'}</span>
                          <div className="flex items-center justify-center px-2 py-1 bg-[#16a34a]/10 text-[#16a34a] rounded-lg text-xs font-black shadow-sm group-hover:translate-x-1 transition-transform">
                            →
                          </div>
                          <span className="text-[#16a34a] font-extrabold text-sm">{tx.toMedicalId?.medicalName || 'Unknown Dest'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[#0f3b2d] font-black text-base">₹{tx.totalSellPrice?.toFixed(2)}</p>
                        <span className="inline-block bg-[#a3e635]/25 text-[#0b3124] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#a3e635]/40 mt-1 tracking-wider">
                          + ₹{tx.totalMargin?.toFixed(2)} MARGIN
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-semibold">
                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-16 text-slate-400 font-medium uppercase tracking-widest">No transfer logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shadow-sm">
                  <img src="/icons/receipt.png" alt="Receipt" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#0f3b2d] tracking-wide">Transaction Details</h3>
                  <p className="text-xs text-slate-400 tracking-widest uppercase mt-0.5">ID: {selectedTx._id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadReceipt} className="bg-white border border-slate-200 text-[#0f3b2d] hover:bg-slate-50 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#16a34a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download Receipt
                </button>
                <button onClick={() => setSelectedTx(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Source Node */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Source Node</p>
                  <p className="text-lg font-bold text-slate-800">{selectedTx.fromMedicalId?.medicalName || 'Unknown Origin'}</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedTx.fromMedicalId?.address}</p>
                  <p className="text-sm text-slate-500 mt-1">Contact: {selectedTx.fromMedicalId?.phone}</p>
                </div>

                {/* Destination Node */}
                <div className="bg-[#16a34a]/5 rounded-2xl p-6 border border-[#16a34a]/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#16a34a]" />
                  <p className="text-xs font-bold tracking-widest text-[#16a34a] uppercase mb-3">Destination Node</p>
                  <p className="text-lg font-bold text-[#0f3b2d]">{selectedTx.toMedicalId?.medicalName || 'Unknown Dest'}</p>
                  <p className="text-sm text-slate-600 mt-1">{selectedTx.toMedicalId?.address}</p>
                  <p className="text-sm text-slate-600 mt-1">Contact: {selectedTx.toMedicalId?.phone}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-[#0f3b2d] uppercase tracking-widest">Payload Assets</h4>
                  <span className="text-xs font-bold bg-[#16a34a]/10 text-[#16a34a] px-3 py-1 rounded-full">{selectedTx.items?.length || 0} Items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white text-slate-400 text-xs uppercase tracking-widest font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Medicine</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Buy Price</th>
                        <th className="px-6 py-4">Sell Price</th>
                        <th className="px-6 py-4">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTx.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{item.medicineName}</td>
                          <td className="px-6 py-4">{item.quantity} Units</td>
                          <td className="px-6 py-4 text-slate-500">₹{item.buyPrice?.toFixed(2)}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">₹{item.sellPrice?.toFixed(2)}</td>
                          <td className="px-6 py-4 font-bold text-[#16a34a]">+₹{item.margin?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!selectedTx.items || selectedTx.items.length === 0) && (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-400 font-medium uppercase tracking-widest">No items found in payload.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-slate-500 font-medium">
                Timestamp: {new Date(selectedTx.timestamp).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Value</p>
                  <p className="text-xl font-black text-slate-800">₹{selectedTx.totalSellPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#16a34a] uppercase tracking-widest mb-1">Total Margin</p>
                  <p className="text-xl font-black text-[#16a34a]">+₹{selectedTx.totalMargin?.toFixed(2)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

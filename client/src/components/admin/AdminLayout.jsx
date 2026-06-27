import { Outlet, Navigate, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const token = localStorage.getItem('adminToken');
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#a3e635] selection:text-[#0f3b2d]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0f3b2d] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0f3b2d]/20">
            D
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0f3b2d] leading-none uppercase">DisPharma</h1>
            <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest mt-0.5 bg-[#0f3b2d] inline-block px-1.5 py-0.5 rounded-sm">Admin Console</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-slate-600 hover:text-white bg-white hover:bg-[#0f3b2d] px-5 py-2.5 rounded-full transition-all border border-slate-200 hover:border-[#0f3b2d] shadow-sm"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

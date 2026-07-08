import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Map, Users, LogOut } from 'lucide-react';
import { useT } from '../hooks/useT';
import { useAppStore } from '../store/useAppStore';

export default function AdminLayout() {
  const { t } = useT();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const clearAuth = useAppStore((s) => s.clearAuth);

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-5 h-fit">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
              {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{user?.full_name || user?.email}</div>
              <div className="text-white/60 text-xs">{t.admin_panel.admin_role}</div>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink to="/admin-panel" end className={linkClass}>
              <LayoutDashboard size={18} /> {t.admin_panel.overview}
            </NavLink>
            <NavLink to="/admin-panel/verification" className={linkClass}>
              <ShieldCheck size={18} /> {t.admin_panel.verification}
            </NavLink>
            <NavLink to="/admin-panel/tours" className={linkClass}>
              <Map size={18} /> {t.admin_panel.tours}
            </NavLink>
            <NavLink to="/admin-panel/providers" className={linkClass}>
              <Users size={18} /> {t.admin_panel.providers}
            </NavLink>
          </nav>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} /> {t.dashboard.logout}
          </button>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

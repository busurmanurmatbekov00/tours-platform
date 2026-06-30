import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, ShieldCheck, Award, Map, LogOut, Mountain,
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { useAppStore } from '../store/useAppStore';

export default function ProviderLayout() {
  const { t } = useT();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const clearAuth = useAppStore((s) => s.clearAuth);

  const onLogout = () => {
    clearAuth();
    navigate('/');
  };

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.dashboard.overview, end: true },
    { to: '/dashboard/profile', icon: User, label: t.dashboard.profile },
    { to: '/dashboard/verification', icon: ShieldCheck, label: t.dashboard.verification },
    { to: '/dashboard/certificates', icon: Award, label: t.dashboard.certificates },
    { to: '/dashboard/tours', icon: Map, label: t.dashboard.my_tours },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-white/15 text-white shadow-lg backdrop-blur-sm'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 -mt-px">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Сайдбар с градиентом */}
          <aside className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-5 h-fit shadow-xl lg:sticky lg:top-20">
            <div className="flex items-center gap-3 px-2 pb-4 mb-4 border-b border-white/20">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {(user?.full_name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold truncate">
                  {user?.full_name || user?.email}
                </div>
                <div className="text-xs text-blue-200 mt-0.5 flex items-center gap-1">
                  <Mountain size={12} />
                  {user?.role}
                </div>
              </div>
            </div>

            <nav className="space-y-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={onLogout}
              className="mt-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-100 hover:bg-red-500/30 transition-colors"
            >
              <LogOut size={18} />
              {t.dashboard.logout}
            </button>
          </aside>

          {/* Контент */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
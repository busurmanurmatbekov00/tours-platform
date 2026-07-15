import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mountain, Globe, LayoutDashboard, LogIn } from 'lucide-react';
import { useT } from '../hooks/useT';
import { useAppStore } from '../store/useAppStore';
import { getMyProfile } from '../api/provider';
import './Header.css';


export default function Header() {
  const { t, lang } = useT();
  const setLanguage = useAppStore((s) => s.setLanguage);
  const user = useAppStore((s) => s.user);
  const location = useLocation();

  const isProvider = user && user.role !== 'admin';
  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    enabled: Boolean(isProvider),
  });

  // Единственное место, где определяется вариант шапки
  const isHome = location.pathname === '/';
  const headerVariantClass = isHome ? 'header-transparent' : 'header-white';

  const navClass = ({ isActive }) =>
    `header-nav-link relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${
      isActive ? 'active' : ''
    }`;

  return (
    <header className={`app-header ${headerVariantClass}`}>
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ${
              isHome ? 'ring-2 ring-white/30' : ''
            }`}
          >
            <Mountain size={22} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <div className="header-logo-text font-bold text-base leading-tight transition-colors duration-300">
              Туры КР
            </div>
            <div className="header-logo-subtext text-[11px] leading-tight transition-colors duration-300">
              {lang === 'ru' ? 'Кыргызская Республика' : 'Kyrgyz Republic'}
            </div>
          </div>
        </Link>

        {/* Навигация */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>{t.nav.home}</NavLink>
          <NavLink to="/catalog" className={navClass}>{t.nav.catalog}</NavLink>
          <NavLink to="/info" className={navClass}>{t.nav.info}</NavLink>
        </nav>

        {/* Правая часть */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Переключатель языка */}
          <div className="header-lang-wrapper hidden sm:flex items-center gap-1 rounded-lg p-1 transition-colors duration-300">
            <Globe size={14} className="header-logo-subtext ml-1 transition-colors duration-300" />
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-300 ${
                lang === 'ru' ? 'header-lang-btn-active' : 'header-lang-btn-inactive'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-300 ${
                lang === 'en' ? 'header-lang-btn-active' : 'header-lang-btn-inactive'
              }`}
            >
              EN
            </button>
          </div>

          {/* Пользователь / Войти */}
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin-panel' : '/dashboard'}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                isHome
                  ? 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white hover:-translate-y-0.5'
              }`}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.full_name || user.email).charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold leading-tight max-w-[120px] truncate">
                  {user.full_name || user.email}
                </div>
                <div className={`text-[10px] leading-tight transition-colors duration-300 ${isHome ? 'text-white/70' : 'text-blue-100'}`}>
                  {user.role}
                </div>
              </div>
              <LayoutDashboard size={16} className="hidden md:block opacity-70 group-hover:opacity-100" />
            </Link>
          ) : (
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isHome
                  ? 'bg-white text-blue-700 hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <LogIn size={16} />
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
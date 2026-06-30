import { Link, NavLink, useLocation } from 'react-router-dom';
import { Mountain, Globe, LayoutDashboard, LogIn } from 'lucide-react';
import { useT } from '../hooks/useT';
import { useAppStore } from '../store/useAppStore';

export default function Header() {
  const { t, lang } = useT();
  const setLanguage = useAppStore((s) => s.setLanguage);
  const user = useAppStore((s) => s.user);
  const location = useLocation();

  // На главной — прозрачная шапка поверх hero. На остальных — белая.
  const isHome = location.pathname === '/';

  const headerClass = isHome
    ? 'absolute top-0 left-0 right-0 z-20 bg-transparent'
    : 'sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm';

  const textColor = isHome ? 'text-white' : 'text-gray-900';
  const navInactive = isHome ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-blue-700';
  const navActive = isHome ? 'text-white' : 'text-blue-700';

  const navClass = ({ isActive }) =>
    `relative px-4 py-2 text-sm font-medium transition-colors ${isActive ? navActive : navInactive}`;

  const langBtnBase = 'px-2.5 py-1 text-xs font-bold rounded-md transition-all';
  const langBtnActive = isHome
    ? 'bg-white text-blue-700 shadow-sm'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm';
  const langBtnInactive = isHome
    ? 'text-white/70 hover:text-white'
    : 'text-gray-600 hover:text-gray-900';

  const langContainer = isHome
    ? 'bg-white/15 backdrop-blur-sm border border-white/20'
    : 'bg-gray-100 border border-gray-200';

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ${isHome ? 'ring-2 ring-white/30' : ''}`}>
            <Mountain size={22} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <div className={`font-bold text-base leading-tight ${textColor}`}>Туры КР</div>
            <div className={`text-[11px] leading-tight ${isHome ? 'text-white/70' : 'text-gray-500'}`}>
              {lang === 'ru' ? 'Кыргызская Республика' : 'Kyrgyz Republic'}
            </div>
          </div>
        </Link>

        {/* Навигация */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>{t.nav.home}</NavLink>
          <NavLink to="/catalog" className={navClass}>{t.nav.catalog}</NavLink>
        </nav>

        {/* Правая часть */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Переключатель языка */}
          <div className={`hidden sm:flex items-center gap-1 rounded-lg p-1 ${langContainer}`}>
            <Globe size={14} className={isHome ? 'text-white/70 ml-1' : 'text-gray-400 ml-1'} />
            <button
              onClick={() => setLanguage('ru')}
              className={`${langBtnBase} ${lang === 'ru' ? langBtnActive : langBtnInactive}`}
            >
              RU
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`${langBtnBase} ${lang === 'en' ? langBtnActive : langBtnInactive}`}
            >
              EN
            </button>
          </div>

          {/* Пользователь / Войти */}
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                isHome
                  ? 'bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white hover:-translate-y-0.5'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold leading-tight max-w-[120px] truncate">
                  {user.full_name || user.email}
                </div>
                <div className={`text-[10px] leading-tight ${isHome ? 'text-white/70' : 'text-blue-100'}`}>
                  {user.role}
                </div>
              </div>
              <LayoutDashboard size={16} className="hidden md:block opacity-70 group-hover:opacity-100" />
            </Link>
          ) : (
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
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
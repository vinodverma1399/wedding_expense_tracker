import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Home, PieChart, Users, Settings, Moon, Sun, TrendingUp, UserCheck, CalendarDays, Globe, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(localStorage.getItem('language') || 'en');

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setLang(newLang);
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', key: 'dashboard', path: '/', icon: Home },
    { name: 'Expenses', key: 'expenses', path: '/expenses', icon: PieChart },
    { name: 'Vendors', key: 'vendors', path: '/vendors', icon: Users },
    { name: 'Guests', key: 'guests', path: '/guests', icon: UserCheck },
    { name: 'Events', key: 'events', path: '/events', icon: CalendarDays },
    { name: 'Analytics', key: 'analytics', path: '/analytics', icon: TrendingUp },
  ];

  if (user?.isAdmin) {
    navItems.push({ name: 'Admin Command', key: 'adminCommand', path: '/admin', icon: Shield });
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b dark:border-gray-800/80 flex items-center justify-between px-4 z-40 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">WET</span>
          {!user && (
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-primary/10">Demo</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" title="Switch Language">
            <Globe size={18} />
          </button>
          <button onClick={toggleDarkMode} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" title="Toggle Theme">
            {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
          {user ? (
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition" title="Logout">
              <LogOut size={18} />
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="p-2 text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition" title="Login">
              <LogOut size={18} className="rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 h-screen shadow-md flex-col hidden md:flex sticky top-0 transition-colors duration-300">
        <div className="p-6 border-b dark:border-gray-800">
          <h2 className="text-2xl font-bold text-primary">WET</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Wedding Expense Tracker</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} /> {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t dark:border-gray-800 space-y-2">
          <button onClick={toggleLang} className="flex items-center justify-center gap-2 w-full p-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Globe size={18} /> {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
          </button>
          <button onClick={toggleDarkMode} className="flex items-center justify-center gap-2 w-full p-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {isDark ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
          </button>
          {user ? (
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-2 text-red-500 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition border border-transparent hover:border-red-100 dark:hover:border-red-900 cursor-pointer">
              <LogOut size={20} /> Logout
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 w-full p-2 text-primary font-bold rounded-lg bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition border border-primary/20 cursor-pointer">
              <LogOut size={20} className="rotate-180" /> Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800/80 flex items-center justify-around px-1 py-1 z-40 transition-colors duration-300 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary scale-110 font-bold' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px] drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)] text-primary' : 'stroke-[1.8px]'} />
              <span className="text-[9px] mt-1 tracking-tight truncate max-w-full">
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default Sidebar;

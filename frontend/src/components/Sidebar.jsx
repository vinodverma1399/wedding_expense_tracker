import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Home, PieChart, Users, Moon, Sun, TrendingUp, UserCheck, CalendarDays, Globe, Shield, ChevronDown, Check, Plus, User } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Modal from './Modal';
import CreateWeddingForm from './CreateWeddingForm';

// All major Indian languages + English
const INDIAN_LANGUAGES = [
  { code: 'en',  name: 'English',    native: 'English'       },
  { code: 'hi',  name: 'Hindi',      native: 'हिंदी'          },
  { code: 'bn',  name: 'Bengali',    native: 'বাংলা'          },
  { code: 'te',  name: 'Telugu',     native: 'తెలుగు'         },
  { code: 'mr',  name: 'Marathi',    native: 'मराठी'          },
  { code: 'ta',  name: 'Tamil',      native: 'தமிழ்'          },
  { code: 'ur',  name: 'Urdu',       native: 'اردو'           },
  { code: 'gu',  name: 'Gujarati',   native: 'ગુજરાતી'        },
  { code: 'kn',  name: 'Kannada',    native: 'ಕನ್ನಡ'          },
  { code: 'ml',  name: 'Malayalam',  native: 'മലയാളം'         },
  { code: 'pa',  name: 'Punjabi',    native: 'ਪੰਜਾਬੀ'         },
  { code: 'or',  name: 'Odia',       native: 'ଓଡ଼ିଆ'          },
  { code: 'as',  name: 'Assamese',   native: 'অসমীয়া'        },
  { code: 'ne',  name: 'Nepali',     native: 'नेपाली'         },
  { code: 'sd',  name: 'Sindhi',     native: 'سنڌي'           },
  { code: 'sa',  name: 'Sanskrit',   native: 'संस्कृतम्'      },
  { code: 'mai', name: 'Maithili',   native: 'मैथिली'         },
  { code: 'kok', name: 'Konkani',    native: 'कोंकणी'         },
  { code: 'doi', name: 'Dogri',      native: 'डोगरी'          },
  { code: 'mni', name: 'Manipuri',   native: 'মৈতৈলোন্'      },
  { code: 'brx', name: 'Bodo',       native: 'बड़ो'           },
  { code: 'ks',  name: 'Kashmiri',   native: 'كشميري'         },
];

const getCurrentLang = () => {
  try {
    const gt = document.cookie.split('; ').find(r => r.startsWith('googtrans='));
    if (!gt) return 'en';
    const val = decodeURIComponent(gt.split('=').slice(1).join('='));
    const target = val.split('/').filter(Boolean).pop();
    return (target && target !== 'en') ? target : 'en';
  } catch { return 'en'; }
};

// ── LangPicker is defined OUTSIDE Sidebar so it never re-mounts on theme toggle ──
const LangPicker = ({ compact }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLang);
  const [translating, setTranslating] = useState(false);
  const ref = useRef(null);

  const selectedLang = INDIAN_LANGUAGES.find(l => l.code === currentLang) || INDIAN_LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLangSelect = (code) => {
    setLangOpen(false);
    if (code === currentLang) return;
    setCurrentLang(code);
    setTranslating(true);
    if (window.triggerGoogleTranslate) window.triggerGoogleTranslate(code);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setLangOpen(o => !o)}
        disabled={translating}
        className={`flex items-center gap-1.5 ${
          compact
            ? 'p-2 rounded-lg'
            : 'w-full p-2 justify-between rounded-lg'
        } text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium disabled:opacity-50`}
        title={compact ? (translating ? 'Translating...' : selectedLang.native) : undefined}
      >
        {translating ? (
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
        ) : (
          <>
            <Globe size={16} className="text-primary flex-shrink-0" />
            {!compact && (
              <>
                <span className="text-sm flex-1 text-left">
                  {selectedLang.native}
                  <span className="text-xs text-gray-400 ml-1">({selectedLang.name})</span>
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </>
        )}
      </button>

      {langOpen && (
        <div className={`absolute ${
          compact ? 'right-0 top-11 w-60' : 'bottom-12 left-0 right-0'
        } z-[99999] bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden`}>
          <div className="px-3 py-2 border-b dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              भाषा चुनें / Select Language
            </p>
          </div>
          <div className="overflow-y-auto max-h-72 p-1">
            {INDIAN_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLangSelect(lang.code)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  currentLang === lang.code
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                }`}
              >
                <span className="font-medium">{lang.native}</span>
                <span className="text-xs text-gray-400">{lang.name}</span>
                {currentLang === lang.code && <Check size={13} className="text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── DarkModeButton outside Sidebar so only IT re-renders on theme toggle ──────
const DarkModeButton = ({ mobile = false }) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  if (mobile) {
    return (
      <button onClick={toggle} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
        {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
      </button>
    );
  }
  return (
    <button onClick={toggle} className="flex items-center justify-center gap-2 w-full p-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
      {isDark ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
    </button>
  );
};

// ── Main Sidebar ──────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isWeddingModalOpen, setIsWeddingModalOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleWeddingCreated = (newWedding) => {
    setIsWeddingModalOpen(false);
    localStorage.setItem('selectedWeddingId', newWedding._id);
    toast.success('Wedding created successfully!');
    if (window.location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  const navItems = [
    { key: 'dashboard', path: '/',          icon: Home },
    { key: 'expenses',  path: '/expenses',  icon: PieChart },
    { key: 'vendors',   path: '/vendors',   icon: Users },
    { key: 'guests',    path: '/guests',    icon: UserCheck },
    { key: 'events',    path: '/events',    icon: CalendarDays },
    { key: 'analytics', path: '/analytics', icon: TrendingUp },
  ];
  if (user?.isAdmin) navItems.push({ key: 'adminCommand', path: '/admin', icon: Shield });

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b dark:border-gray-800/80 flex items-center justify-between px-4 z-[9999] shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-primary to-purple-600 rounded-lg text-white shadow-sm flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
              <path d="M7 9h10v2H7V9zm0 4h7v2H7v-2z" fill="#fff" fillOpacity="0.8"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-none">WET</span>
            <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mt-0.5">Wedding Expense Tracker</span>
          </div>
          {!user && (
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-primary/10 ml-1">Demo</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              onClick={() => setIsWeddingModalOpen(true)}
              className="p-2 text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition"
              title="New Wedding"
            >
              <Plus size={18} />
            </button>
          )}
          <LangPicker compact={true} />
          <DarkModeButton mobile={true} />
          {user ? (
            <Link to="/profile" className="p-2 text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition flex items-center justify-center">
              <User size={18} />
            </Link>
          ) : (
            <button onClick={() => navigate('/login')} className="p-2 text-primary hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition">
              <LogOut size={18} className="rotate-180" />
            </button>
          )}
        </div>

      </div>

      {/* ── Desktop Sidebar ── */}
      <div className="w-64 bg-white dark:bg-gray-900 h-screen shadow-md flex-col hidden md:flex sticky top-0 transition-colors duration-300">
        <div className="p-6 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-primary to-purple-600 rounded-xl text-white shadow-md shadow-primary/20 flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                <path d="M7 9h10v2H7V9zm0 4h7v2H7v-2z" fill="#fff" fillOpacity="0.8"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-none mb-1">
                WET
              </h2>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block leading-tight">
                Wedding Expense Tracker
              </span>
            </div>
          </div>
          {user && (
            <button 
              onClick={() => setIsWeddingModalOpen(true)}
              className="mt-4 w-full bg-primary hover:bg-purple-800 text-white py-2 px-4 rounded-lg font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm border border-purple-500/20">
              <Plus size={16}/> {t('createWedding')}
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ key, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={key} to={path}
                className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                <Icon size={20} /> {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-gray-800 space-y-2">
          <LangPicker compact={false} />

          <DarkModeButton />

          {user ? (
            <Link to="/profile"
              className="flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold truncate leading-none mb-1">{user.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-none">{user.email}</p>
              </div>
            </Link>
          ) : (
            <button onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 w-full p-2 text-primary font-bold rounded-lg bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 transition border border-primary/20">
              <LogOut size={20} className="rotate-180" /> Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800/80 flex items-center justify-around px-2 z-[9999] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-colors duration-300">
        {navItems.slice(0, 6).map(({ key, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={key} to={path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 ${
                isActive ? 'text-primary bg-purple-50 dark:bg-purple-950/30 scale-105' : 'text-gray-500 dark:text-gray-400'
              }`}>
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
              <span className={`text-[9px] mt-0.5 ${isActive ? 'block font-semibold' : 'hidden'}`}>{t(key)}</span>
            </Link>
          );
        })}
      </div>

      {/* New Wedding Modal */}
      <Modal isOpen={isWeddingModalOpen} onClose={() => setIsWeddingModalOpen(false)} title="Create New Wedding">
        <CreateWeddingForm onSuccess={handleWeddingCreated} />
      </Modal>
    </>
  );
};

export default Sidebar;

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Clear user session if any, then navigate to dashboard as guest
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
      
      {/* Left side: Premium Branding & Feature Showcase */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex-col justify-between p-12 text-white">
        {/* Dynamic decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-pink-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="2.2" fill="none" />
              <path d="M12 3L9 6h6l-3-3z" fill="currentColor" />
              <path d="M9 6l3 4 3-4H9z" fill="currentColor" opacity="0.85" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider block bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-pink-200 leading-none">
              WET
            </span>
            <span className="text-[9px] font-bold text-pink-200/70 uppercase tracking-widest block mt-1">
              Wedding Expense Tracker
            </span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <h1 className="text-5xl font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-indigo-100">
            Plan your perfect wedding together.
          </h1>
          <p className="text-lg text-purple-100/80 mb-8 leading-relaxed">
            WET helps couples and family members collaborate in real-time, keep budgets on track, manage vendors seamlessly, and track guest lists in one elegant workspace.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold">₹</div>
              <div>
                <p className="font-semibold text-sm">{t('loginFeature1Title')}</p>
                <p className="text-xs text-purple-200/60">{t('loginFeature1Sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">👥</div>
              <div>
                <p className="font-semibold text-sm">{t('loginFeature2Title')}</p>
                <p className="text-xs text-purple-200/60">{t('loginFeature2Sub')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-purple-200/60 border-t border-white/10 pt-6">
          © {new Date().getFullYear()} WET Workspace. {t('craftedWithLove')}
        </div>
      </div>

      {/* Right side: Modern Glassmorphic Login Form */}
      <div className="lg:col-span-5 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="2.2" fill="none" />
                  <path d="M12 3L9 6h6l-3-3z" fill="currentColor" />
                  <path d="M9 6l3 4 3-4H9z" fill="currentColor" opacity="0.85" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-lg font-bold tracking-wider block dark:text-white leading-none">WET</span>
                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mt-0.5">Wedding Expense Tracker</span>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('welcomeBack')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-lg animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block" htmlFor="email">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300" htmlFor="password">
                    {t('password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold rounded-xl transition duration-300 shadow-lg shadow-purple-600/10 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    {t('logIn')} <ArrowRight size={16} />
                  </>
                )}
              </button>

            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">{t('or')}</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Instant Demo Mode Button */}
            <button
              type="button"
              onClick={handleDemoMode}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl transition duration-300 shadow-md shadow-pink-500/10 cursor-pointer"
            >
              <Sparkles size={18} />
              {t('exploreDemoMode')}
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-secondary dark:text-pink-400 font-semibold hover:underline">
                {t('createAccount')}
              </Link>
            </p>

          </div>

          <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

        </div>
      </div>

    </div>
  );
};

export default Login;

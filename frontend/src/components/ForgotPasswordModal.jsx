import React, { useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { Mail, Lock, Key, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.emailFailed) {
        toast.warning('OTP generated, but email delivery failed. Please check server logs.');
      } else {
        toast.success('6-digit OTP sent to your email!');
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully!');
      onClose();
      // Reset state
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password via OTP">
      <div className="space-y-4 py-2">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Enter your registered email address below. We will send a secure **6-digit verification OTP** to reset your password.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-purple-800 transition duration-300 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Send Verification OTP <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-3.5 rounded-xl text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              📩 **OTP Sent!** Please check your email **{email}** for a 6-digit verification code. Enter the code and your new password below.
            </div>

            {/* OTP Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">6-Digit OTP</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Key size={18} />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm font-mono tracking-widest text-center text-lg font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <ShieldCheck size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white transition-all text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition duration-300 cursor-pointer text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-purple-800 text-white font-bold rounded-xl hover:from-purple-800 hover:to-indigo-900 transition duration-300 disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;

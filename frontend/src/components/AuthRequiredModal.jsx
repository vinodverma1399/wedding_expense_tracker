import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, LogIn, UserPlus } from 'lucide-react';

const AuthRequiredModal = ({ isOpen, onClose, actionName }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 dark:border-gray-800 animate-scaleUp">
        
        {/* Header Bar */}
        <div className="flex justify-end p-4 pb-0">
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-8 pb-8 pt-2 text-center flex flex-col items-center">
          
          {/* Animated Heart Motif */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center text-primary dark:text-pink-400 mb-6 animate-pulse">
            <Heart className="fill-current" size={32} />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Unlock Full Workspace
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {actionName ? `To ${actionName}, you need to have a registered wedding workspace.` : 'To perform write actions, edit budgets, or manage guests, you need to sign in.'} You are currently browsing in read-only **Demo Mode**.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            
            {/* Log In Button */}
            <button
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold rounded-xl transition duration-300 shadow-md shadow-purple-600/10 cursor-pointer"
            >
              <LogIn size={18} />
              Log In to My Wedding
            </button>

            {/* Create Account Button */}
            <button
              onClick={() => {
                onClose();
                navigate('/register');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold rounded-xl transition duration-300 cursor-pointer"
            >
              <UserPlus size={18} />
              Register New Workspace
            </button>

          </div>

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-medium mt-5 hover:underline cursor-pointer"
          >
            Continue Browsing in Demo Mode
          </button>

        </div>

      </div>
    </div>
  );
};

export default AuthRequiredModal;

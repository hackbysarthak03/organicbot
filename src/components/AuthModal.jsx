import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { Leaf, UserCircle2, ArrowRight } from 'lucide-react';

export default function AuthModal({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin({
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        isGuest: false,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onLogin({
      uid: 'guest_' + Date.now().toString(),
      displayName: 'Guest',
      isGuest: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/20"
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/10 border border-white/60 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-lime-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50">
          <Leaf className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Pure Nature AI</h2>
        <p className="text-gray-500 text-[15px] font-medium mb-10 mx-auto leading-relaxed">
          To continue with the personalised experience, please select your login method.
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm font-medium p-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-between w-full p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 group focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-semibold text-gray-700">Continue with Google</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </button>

          <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 border border-transparent hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-300 group focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <UserCircle2 className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              <span className="font-semibold text-gray-600 group-hover:text-emerald-700 transition-colors">Continue as Guest</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

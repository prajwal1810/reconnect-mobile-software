import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { Wrench, ShieldAlert, Sparkles, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface LoginProps {
  onAuthSuccess: (session: any) => void;
  onOpenTracker: () => void;
}

export const Login: React.FC<LoginProps> = ({ onAuthSuccess, onOpenTracker }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please input your email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || 'Staff Member' }
          }
        });
        if (error) throw error;
        
        setInfoMsg('Registration successful! Please check your email inbox to verify your account or proceed to Log In.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineBypass = () => {
    onAuthSuccess({
      user: {
        id: 'guest-uuid',
        email: 'guest@reconnectmobile.in',
        user_metadata: { display_name: 'Vishal Sharma (Guest)' }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-6 overflow-hidden select-none font-sans">
      
      {/* Centered Login Card */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-xl shadow-slate-200/50 flex flex-col space-y-6 text-left relative z-10">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Wrench className="w-5.5 h-5.5" />
          </div>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mt-3">RepairOS Console</h1>
        </div>

        {/* Heading state */}
        <div className="space-y-1 text-center">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">
            {isSignUp ? 'Create Staff Account' : 'Welcome Back'}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {isSignUp ? 'Sign up to configure store workflows.' : 'Please sign in to access the store console.'}
          </p>
        </div>

        {/* Info or error alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 text-blue-600 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">👤</span>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vishal Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@repairshop.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 pl-9 pr-12 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 font-bold text-[9px] uppercase transition cursor-pointer select-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit Auth button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to System</span>
              </>
            )}
          </button>
        </form>

        {/* Switch Auth mode link */}
        <div className="text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
          >
            {isSignUp ? 'Already registered? Log in instead' : 'Need staff access? Create an account'}
          </button>
        </div>

        {/* Public customer tracking portal link */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-center space-y-2">
          <button 
            type="button"
            onClick={onOpenTracker}
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100/50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Track Repair Status (No Login)</span>
          </button>

          {/* Offline fallback button if keys not set */}
          {!isSupabaseConfigured && (
            <button
              onClick={handleOfflineBypass}
              className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Login as Guest (Offline Mode)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

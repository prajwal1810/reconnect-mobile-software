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
        // Sign Up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || 'Staff Member' }
          }
        });
        if (error) throw error;
        
        // Supabase sends confirmation email by default unless disabled
        setInfoMsg('Registration successful! Please check your email inbox to verify your account or proceed to Log In.');
        setIsSignUp(false);
      } else {
        // Sign In flow
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

  // Offline bypass triggers the success callback with a mock guest session
  const handleOfflineBypass = () => {
    onAuthSuccess({
      user: {
        id: 'guest-uuid',
        email: 'guest@repairos.local',
        user_metadata: { display_name: 'Vishal Sharma (Guest)' }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 overflow-hidden select-none">
      {/* Background radial glowing grid lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>

      {/* Main glass card */}
      <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col space-y-6 text-left relative z-10 backdrop-blur-xl animate-scale-up">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-3">RepairOS Console</h1>
          <p className="text-xs text-slate-450 font-medium">Cloud Based Mobile Repair Management SaaS</p>
        </div>

        {/* Info or error alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vishal Sharma"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@repairshop.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Submit Auth button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
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
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {isSignUp ? 'Already registered? Log in instead' : 'Need staff access? Create an account'}
          </button>
        </div>

        {/* Public customer tracking portal link */}
        <div className="border-t border-slate-800/80 pt-4 text-center space-y-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Customer Tools</span>
          <button 
            type="button"
            onClick={onOpenTracker}
            className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/35 hover:border-blue-500 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Track Repair Status (No Login)</span>
          </button>
        </div>

        {/* Offline fallback button if keys not set */}
        {!isSupabaseConfigured && (
          <div className="border-t border-slate-800/80 pt-4 text-center space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dev Sandbox Fallback</span>
            <button
              onClick={handleOfflineBypass}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Login as Guest (Offline Mode)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

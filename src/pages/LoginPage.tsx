import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginEmail = role === 'admin' ? 'admin@frytofly.in' : email;
      const ok = await login(loginEmail, password, role);
      if (ok) navigate(role === 'admin' ? '/admin' : '/dashboard');
      else setError('Invalid credentials');
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl animate-pulse" style={{ background: 'var(--brand-primary)' }} />
      <div className="absolute bottom-20 left-0 w-56 h-56 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--brand-primary)', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--brand-accent)' }} />

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10 max-w-lg mx-auto w-full">
        <div className="glass-card-strong p-8 backdrop-blur-3xl shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg"
              style={{ background: 'var(--bg-card)' }}>
              <img src="/logo.png" alt="FrytoFly Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display gradient-text">FrytoFly</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Recycle · Reward · Repeat</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold font-display mt-8 mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back! 👋
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Sign in to continue your eco journey
          </p>

        {/* ─── Role Selector ─── */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Sign in as
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setRole('user'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                background: role === 'user'
                  ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'
                  : 'var(--bg-secondary)',
                color: role === 'user' ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${role === 'user' ? 'transparent' : 'var(--border-color)'}`,
                boxShadow: role === 'user' ? '0 4px 20px var(--glow-color)' : 'none',
                transform: role === 'user' ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <UserIcon size={18} />
              User
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                background: role === 'admin'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'var(--bg-secondary)',
                color: role === 'admin' ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${role === 'admin' ? 'transparent' : 'var(--border-color)'}`,
                boxShadow: role === 'admin' ? '0 4px 20px rgba(245, 158, 11, 0.3)' : 'none',
                transform: role === 'admin' ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <Shield size={18} />
              Admin
            </button>
          </div>
        </div>

        {/* Admin info banner */}
        {role === 'admin' && (
          <div
            className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2 animate-scale-in"
            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
          >
            <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <div>
              <p className="font-semibold" style={{ color: '#d97706' }}>Admin Access</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                You'll be directed to the admin dashboard with full analytics and order management.
              </p>
            </div>
          </div>
        )}

        {/* Email Login (User & Admin) */}
        <form onSubmit={handleEmailLogin} className="space-y-4 animate-scale-in">
            {/* ... form fields ... */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition-all duration-300"
              disabled={loading}
              style={{
                background: role === 'admin'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                boxShadow: role === 'admin'
                  ? '0 4px 15px rgba(245, 158, 11, 0.3)'
                  : '0 4px 15px var(--glow-color)',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Sign In as {role === 'admin' ? 'Admin' : 'User'}</span><ArrowRight size={18} /></>}
            </button>
        </form>

        {/* Demo Quick Login Buttons */}
        <div className="mt-6 pt-6 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-3 opacity-40">Demo Quick Access</p>
          <div className="flex gap-2">
            <button
              onClick={() => login('demo-user@frytofly.in', 'password').then(() => navigate('/dashboard'))}
              className="flex-1 py-2 px-3 rounded-xl text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              🚀 USER DEMO
            </button>
            <button
              onClick={() => login('admin@frytofly.in', 'password', 'admin').then(() => navigate('/admin'))}
              className="flex-1 py-2 px-3 rounded-xl text-[10px] font-bold border border-amber-200 dark:border-amber-900/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
            >
              🛡️ ADMIN DEMO
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-sm text-center font-medium" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {/* Signup link */}
          <p className="text-center mt-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

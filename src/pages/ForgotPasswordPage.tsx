import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--brand-primary)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--brand-accent)' }} />

      <div className="flex-1 flex flex-col px-6 py-12 relative z-10 max-w-lg mx-auto w-full">
        <button
          onClick={() => navigate('/login')}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-8 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={20} />
        </button>

        {!submitted ? (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>
              Forgot Password?
            </h1>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Don't worry! Enter your registered email address below and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-base pl-12 h-14"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-base font-bold shadow-glow-green"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-scale-in flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>
              Check your email
            </h2>
            <p className="text-sm mb-8 leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              We've sent a password reset link to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. Please check your inbox and spam folder.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full h-14 text-base font-bold"
            >
              Back to Login
            </button>

            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-primary)' }}
            >
              Try another email address
            </button>
          </div>
        )}

        <div className="flex-1" />

        <p className="text-center text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
          Remember your password? <Link to="/login" className="font-bold underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

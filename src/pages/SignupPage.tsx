import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Check, User as UserIcon, Mail, Phone, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_OPTIONS } from '../lib/constants';

const steps = ['Identity', 'Contact', 'Security', 'Avatar'];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [avatar, setAvatar] = useState('🌿');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { signup, updateProfile } = useAuth();

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return email.includes('@') && phone.length >= 10;
    if (step === 2) return password.length >= 6 && password === confirm && agreed;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await signup(name, email, phone, password);
      if (ok) {
        updateProfile({ avatar });
        navigate('/dashboard');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Initializing profile...');
      await signup(name, email, phone, password);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--brand-primary)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--brand-accent)' }} />

      <div className="flex-1 flex flex-col px-6 py-12 relative z-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate('/login')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>New Profile</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{steps[step]}</span>
               <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
               <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Step {step + 1} of 4</span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="flex gap-2 mb-10">
          {steps.map((_, idx) => (
            <div key={idx} className="flex-1 h-1.5 rounded-full transition-all duration-700 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
               <div
                 className="absolute inset-0 bg-brand-primary transition-transform duration-700 ease-out"
                 style={{ transform: `translateX(${idx <= step ? '0%' : '-100%'})` }}
               />
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1">
          {step === 0 && (
            <div className="animate-slide-up space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>What's your name?</h2>
                <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>This is how you'll appear on the leaderboard</p>
              </div>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-base pl-12 h-14 text-lg font-bold"
                  placeholder="Full name"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-slide-up space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Contact Details</h2>
                <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>Used for pickup updates and rewards</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base pl-12 h-14" placeholder="Email address" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="input-base pl-12 h-14" placeholder="Phone number" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Secure Account</h2>
                <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>Create a strong password for your profile</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-base pl-12 h-14" placeholder="New password (6+ chars)" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-base pl-12 h-14" placeholder="Confirm password" />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs font-bold text-red-500 ml-1">Passwords do not match</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:border-brand-primary" onClick={() => setAgreed(!agreed)}>
                <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{
                    borderColor: agreed ? 'var(--brand-primary)' : 'var(--border-color)',
                    background: agreed ? 'var(--brand-primary)' : 'transparent',
                  }}>
                  {agreed && <Check size={14} color="white" strokeWidth={4} />}
                </div>
                <span className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                  I accept the <span className="font-bold text-zinc-900 dark:text-white">Terms of Service</span> and acknowledge the <span className="font-bold text-zinc-900 dark:text-white">Privacy Policy</span> regarding my recycling data.
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up space-y-8">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Choose Identity</h2>
                <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>Select an avatar that represents you</p>
              </div>
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-6xl glass-card-strong shadow-glow-green border-2 border-white/20 animate-float">
                  {avatar}
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {AVATAR_OPTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all active:scale-90"
                    style={{
                      background: avatar === a ? 'var(--glow-color)' : 'var(--bg-secondary)',
                      border: avatar === a ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                      transform: avatar === a ? 'scale(1.15) rotate(-5deg)' : 'scale(1)',
                      boxShadow: avatar === a ? '0 10px 20px -5px var(--glow-color)' : 'none',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-shake">
              {error}
            </div>
          )}

          <button
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            disabled={!canNext() || loading}
            className="btn-primary w-full h-16 flex items-center justify-center gap-3 text-lg font-black shadow-glow-green transition-all"
            style={{ opacity: canNext() ? 1 : 0.4, transform: canNext() ? 'scale(1)' : 'scale(0.98)' }}
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : step === 3 ? (
              <><span>Complete Setup</span><Check size={22} /></>
            ) : (
              <><span>Next Step</span><ArrowRight size={22} /></>
            )}
          </button>

          {step === 0 && (
            <p className="text-center text-sm font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>
              Already a member? <Link to="/login" className="font-black text-teal-600 dark:text-teal-400 hover:underline">Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

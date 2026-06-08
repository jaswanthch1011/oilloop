import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_OPTIONS } from '../lib/constants';

const steps = ['Info', 'Contact', 'Security', 'Avatar'];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [avatar, setAvatar] = useState('🌿');
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const ok = await signup(name, email, phone, password);
    if (ok) {
      updateProfile({ avatar });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Background */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--brand-primary)' }} />

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/login')} className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {steps.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, idx) => (
            <div key={idx} className="flex-1 h-1.5 rounded-full transition-all duration-500" style={{
              background: idx <= step ? 'var(--brand-primary)' : 'var(--border-color)',
            }} />
          ))}
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--text-primary)' }}>What's your name?</h2>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-base text-lg" placeholder="Full name" autoFocus />
          </div>
        )}

        {/* Step 1: Contact */}
        {step === 1 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--text-primary)' }}>How can we reach you?</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="input-base" placeholder="98765 43210" />
            </div>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Secure your account</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-base" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-base" placeholder="Re-enter password" />
              {confirm && password !== confirm && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords don't match</p>
              )}
            </div>
            <label className="flex items-start gap-3 cursor-pointer mt-4">
              <div
                onClick={() => setAgreed(!agreed)}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{
                  borderColor: agreed ? 'var(--brand-primary)' : 'var(--border-color)',
                  background: agreed ? 'var(--brand-primary)' : 'transparent',
                }}
              >
                {agreed && <Check size={12} color="white" />}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                I agree to the <span style={{ color: 'var(--brand-primary)' }}>Terms of Service</span> and <span style={{ color: 'var(--brand-primary)' }}>Privacy Policy</span>
              </span>
            </label>
          </div>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <div className="animate-slide-up space-y-6">
            <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Choose your eco avatar</h2>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl glass-card-strong shadow-glow-green">
                {avatar}
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_OPTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: avatar === a ? 'var(--glow-color)' : 'var(--bg-secondary)',
                    border: avatar === a ? '2px solid var(--brand-primary)' : '2px solid transparent',
                    transform: avatar === a ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next / Submit */}
        <button
          onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
          disabled={!canNext() || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-8"
          style={{ opacity: canNext() ? 1 : 0.5 }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : step === 3 ? (
            <><span>Create Account</span><Check size={18} /></>
          ) : (
            <><span>Continue</span><ArrowRight size={18} /></>
          )}
        </button>

        {step === 0 && (
          <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--brand-primary)' }}>Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}

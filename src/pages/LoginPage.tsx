import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, Loader2, Shield, User as UserIcon,
  Mail, Lock, Phone, Sparkles, Check, ArrowLeft, Send, CheckCircle2, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_OPTIONS } from '../lib/constants';

type AuthView = 'login' | 'signup' | 'forgot';

// --------------- ANIMATED ORB BACKGROUND ---------------
const BackgroundOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
    <div style={{
      position: 'absolute', top: '-15%', right: '-10%', width: '420px', height: '420px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
      filter: 'blur(60px)', animation: 'floatOrb1 8s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', bottom: '-10%', left: '-15%', width: '360px', height: '360px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
      filter: 'blur(50px)', animation: 'floatOrb2 10s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', top: '40%', left: '50%', width: '200px', height: '200px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,214,49,0.08) 0%, transparent 70%)',
      filter: 'blur(40px)', animation: 'floatOrb3 12s ease-in-out infinite',
    }} />
  </div>
);

// --------------- GOOGLE BUTTON ---------------
const GoogleButton = ({ onClick, disabled, label = 'Continue with Google' }: { onClick: () => void; disabled?: boolean; label?: string }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: '100%', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    borderRadius: '16px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card)',
    backdropFilter: 'blur(8px)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)',
    cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(66,133,244,0.15)'; }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
    {label}
  </button>
);

// --------------- DIVIDER ---------------
const Divider = ({ text = 'or' }: { text?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-muted)' }}>{text}</span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
  </div>
);

// --------------- INPUT COMPONENT ---------------
const InputField = ({ icon: Icon, type = 'text', value, onChange, placeholder, required = true, rightElement }: {
  icon: React.ElementType; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
  rightElement?: React.ReactNode;
}) => (
  <div style={{ position: 'relative' }}>
    <Icon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5, transition: 'color 0.3s' }} size={18} />
    <input
      type={type}
      required={required}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base"
      style={{ paddingLeft: '48px', paddingRight: rightElement ? '48px' : '16px', height: '56px', fontSize: '14px', fontWeight: 600, borderRadius: '16px' }}
    />
    {rightElement && (
      <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
        {rightElement}
      </div>
    )}
  </div>
);

// --------------- SUCCESS OVERLAY ---------------
const SuccessOverlay = () => (
  <div className="anim-pop" style={{
    position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)',
  }}>
    <div style={{
      width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', marginBottom: '24px',
      animation: 'successPulse 1.5s infinite', boxShadow: '0 20px 50px rgba(34,197,94,0.3)',
    }}>
      <Check size={48} strokeWidth={3} />
    </div>
    <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
      Welcome Aboard! 🌿
    </h2>
    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
      Setting up your eco dashboard...
    </p>
  </div>
);

// --------------- LOGIN VIEW ---------------
interface LoginViewProps {
  role: 'user' | 'admin';
  setRole: (role: 'user' | 'admin') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  error: string;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  handleGuestLogin: () => void;
  switchView: (view: AuthView) => void;
}

const LoginView = ({
  role, setRole, email, setEmail, password, setPassword, showPassword, setShowPassword,
  error, loading, handleLogin, handleGoogleLogin, handleGuestLogin, switchView
}: LoginViewProps) => (
  <div className="anim-fade-up">
    {/* Role Toggle */}
    <div style={{
      display: 'flex', padding: '5px', borderRadius: '16px', marginBottom: '28px',
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    }}>
      {(['user', 'admin'] as const).map(r => (
        <button key={r} type="button" onClick={() => setRole(r)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px 0', borderRadius: '12px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase' as const, border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
          ...(role === r ? (r === 'admin'
            ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)', transform: 'scale(1.02)' }
            : { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 4px 12px var(--shadow-color)', transform: 'scale(1.02)' }
          ) : { background: 'transparent', color: 'var(--text-muted)' }),
        }}>
          {r === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
          {r === 'admin' ? 'Admin' : 'Customer'}
        </button>
      ))}
    </div>

    {/* Card */}
    <div className="glass-card-strong" style={{ padding: '32px', borderRadius: '28px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {role === 'admin' ? 'Admin Gateway' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
          {role === 'admin' ? 'Sign in with any credentials to access the dashboard' : 'Sign in to track your green impact'}
        </p>
      </div>

      {/* Google Button */}
      <GoogleButton onClick={handleGoogleLogin} disabled={loading} />
      <Divider text="or sign in with email" />

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <InputField
          icon={Mail}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={role === 'admin' ? 'admin@frytofly.in' : 'name@example.com'}
          required={role === 'user'}
        />

        <div>
          <InputField
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s',
              }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button type="button" onClick={() => switchView('forgot')} style={{
              background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              color: 'var(--brand-primary)', letterSpacing: '0.02em',
            }}>
              Forgot Password?
            </button>
          </div>
        </div>

        {error && (
          <div className="anim-pop" style={{
            padding: '14px', borderRadius: '14px', fontSize: '12px', fontWeight: 700, textAlign: 'center',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{
          width: '100%', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '15px', fontWeight: 800, borderRadius: '16px', border: 'none', cursor: 'pointer',
        }}>
          {loading ? <Loader2 size={22} className="animate-spin" /> : (
            <>Sign In<ArrowRight size={20} style={{ transition: 'transform 0.2s' }} /></>
          )}
        </button>
      </form>

      {/* Guest Button */}
      <button onClick={handleGuestLogin} disabled={loading} style={{
        width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        borderRadius: '14px', border: '1.5px dashed var(--border-color)', background: 'transparent',
        fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', marginTop: '12px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.background = 'var(--glow-color)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Sparkles size={16} /> Continue as Guest
      </button>
    </div>

    {/* Sign Up CTA */}
    <div className="anim-fade-up" style={{ textAlign: 'center', marginTop: '32px', animationDelay: '0.15s' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '16px' }}>
        New to FrytoFly?
      </p>
      <button onClick={() => switchView('signup')} style={{
        width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        borderRadius: '20px', border: '2px solid var(--brand-primary)', background: 'transparent',
        fontSize: '16px', fontWeight: 850, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
        color: 'var(--brand-primary)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(34,197,94,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--brand-primary)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        Create Free Account <ArrowRight size={20} />
      </button>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
        Join 5,000+ eco-warriors today
      </p>
    </div>
  </div>
);

// --------------- SIGNUP VIEW ---------------
interface SignupViewProps {
  signupStep: number;
  setSignupStep: (step: number) => void;
  signupSteps: string[];
  signupName: string;
  setSignupName: (name: string) => void;
  signupEmail: string;
  setSignupEmail: (email: string) => void;
  signupPhone: string;
  setSignupPhone: (phone: string) => void;
  signupPassword: string;
  setSignupPassword: (password: string) => void;
  signupConfirm: string;
  setSignupConfirm: (confirm: string) => void;
  signupAvatar: string;
  setSignupAvatar: (avatar: string) => void;
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
  error: string;
  loading: boolean;
  handleSignup: () => void;
  handleGoogleLogin: () => void;
  switchView: (view: AuthView) => void;
  canNextSignup: () => boolean;
}

const SignupView = ({
  signupStep, setSignupStep, signupSteps, signupName, setSignupName,
  signupEmail, setSignupEmail, signupPhone, setSignupPhone,
  signupPassword, setSignupPassword, signupConfirm, setSignupConfirm,
  signupAvatar, setSignupAvatar, agreed, setAgreed, error, loading,
  handleSignup, handleGoogleLogin, switchView, canNextSignup
}: SignupViewProps) => (
  <div className="anim-slide-right">
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
      <button onClick={() => signupStep > 0 ? setSignupStep(signupStep - 1) : switchView('login')} style={{
        width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <ArrowLeft size={18} />
      </button>
      <div style={{ flex: 1 }}>
        <h1 className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Create Account</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>{signupSteps[signupStep]}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Step {signupStep + 1} of 4</span>
        </div>
      </div>
    </div>

    {/* Progress */}
    <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
      {signupSteps.map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '4px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '4px',
            background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
            transform: `translateX(${i <= signupStep ? '0%' : '-100%'})`,
            transition: 'transform 0.6s cubic-bezier(.16,1,.3,1)',
          }} />
        </div>
      ))}
    </div>

    {/* Card */}
    <div className="glass-card-strong" style={{ padding: '32px', borderRadius: '28px' }}>
      {signupStep === 0 && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>What's your name?</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>This is how you'll appear on the leaderboard</p>
          </div>
          <InputField icon={UserIcon} value={signupName} onChange={setSignupName} placeholder="Full name" />

          <Divider text="or" />
          <GoogleButton onClick={handleGoogleLogin} label="Sign up with Google" disabled={loading} />
        </div>
      )}

      {signupStep === 1 && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Contact Details</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Used for pickup updates and rewards</p>
          </div>
          <InputField icon={Mail} type="email" value={signupEmail} onChange={setSignupEmail} placeholder="Email address" />
          <InputField icon={Phone} type="tel" value={signupPhone} onChange={v => setSignupPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="Phone number (10 digits)" />
        </div>
      )}

      {signupStep === 2 && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Secure Account</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Create a strong password (6+ characters)</p>
          </div>
          <InputField icon={Lock} type="password" value={signupPassword} onChange={setSignupPassword} placeholder="New password" />
          <InputField icon={Lock} type="password" value={signupConfirm} onChange={setSignupConfirm} placeholder="Confirm password" />
          {signupConfirm && signupPassword !== signupConfirm && (
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginLeft: '4px', marginTop: '-8px' }}>Passwords do not match</p>
          )}

          {/* Terms Agreement */}
          <button type="button" onClick={() => setAgreed(!agreed)} style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '16px',
            background: 'var(--bg-secondary)', border: `1.5px solid ${agreed ? 'var(--brand-primary)' : 'var(--border-color)'}`,
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${agreed ? 'var(--brand-primary)' : 'var(--border-color)'}`,
              background: agreed ? 'var(--brand-primary)' : 'transparent', transition: 'all 0.3s',
            }}>
              {agreed && <Check size={14} color="white" strokeWidth={3.5} />}
            </div>
            <span style={{ fontSize: '12px', lineHeight: 1.6, fontWeight: 500, color: 'var(--text-secondary)' }}>
              I accept the <strong style={{ color: 'var(--text-primary)' }}>Terms of Service</strong> and acknowledge the <strong style={{ color: 'var(--text-primary)' }}>Privacy Policy</strong> regarding my recycling data.
            </span>
          </button>
        </div>
      )}

      {signupStep === 3 && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Choose Avatar</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Select an identity that represents you</p>
          </div>
          <div className="glass-card" style={{
            width: '120px', height: '120px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '56px', boxShadow: '0 12px 40px var(--shadow-color)', border: '2px solid var(--glass-border)',
          }}>
            {signupAvatar}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', width: '100%' }}>
            {AVATAR_OPTIONS.map(a => (
              <button key={a} type="button" onClick={() => setSignupAvatar(a)} style={{
                width: '100%', aspectRatio: '1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
                background: signupAvatar === a ? 'var(--glow-color)' : 'var(--bg-secondary)',
                border: signupAvatar === a ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                transform: signupAvatar === a ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
                boxShadow: signupAvatar === a ? '0 8px 20px var(--glow-color)' : 'none',
              }}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Error & Action */}
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <div className="anim-pop" style={{
          padding: '14px', borderRadius: '14px', fontSize: '12px', fontWeight: 700, textAlign: 'center',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      <button
        onClick={signupStep === 3 ? handleSignup : () => setSignupStep(signupStep + 1)}
        disabled={!canNextSignup() || loading}
        className="btn-primary"
        style={{
          width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '16px', fontWeight: 800, borderRadius: '18px', border: 'none', cursor: 'pointer',
          opacity: canNextSignup() ? 1 : 0.4, transition: 'all 0.3s',
        }}
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : signupStep === 3 ? (
          <><span>Complete Setup</span><Check size={22} /></>
        ) : (
          <><span>Next Step</span><ArrowRight size={22} /></>
        )}
      </button>

      {signupStep === 0 && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Already a member?{' '}
          <button onClick={() => switchView('login')} style={{
            background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer',
            color: 'var(--brand-primary)',
          }}>Sign In</button>
        </p>
      )}
    </div>
  </div>
);

// --------------- FORGOT VIEW ---------------
interface ForgotViewProps {
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  forgotSent: boolean;
  setForgotSent: (sent: boolean) => void;
  loading: boolean;
  handleForgot: (e: React.FormEvent) => void;
  switchView: (view: AuthView) => void;
}

const ForgotView = ({
  forgotEmail, setForgotEmail, forgotSent, setForgotSent, loading, handleForgot, switchView
}: ForgotViewProps) => (
  <div className="anim-slide-left">
    {/* Back */}
    <button onClick={() => switchView('login')} style={{
      width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
      cursor: 'pointer', marginBottom: '28px', transition: 'all 0.2s',
    }}>
      <ArrowLeft size={18} />
    </button>

    <div className="glass-card-strong" style={{ padding: '32px', borderRadius: '28px' }}>
      {!forgotSent ? (
        <div className="anim-fade-up">
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', background: 'var(--glow-color)', color: 'var(--brand-primary)' }}>
            <KeyRound size={28} />
          </div>
          <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Forgot Password?
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px', fontWeight: 500 }}>
            No worries! Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField icon={Mail} type="email" value={forgotEmail} onChange={setForgotEmail} placeholder="name@example.com" />
            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontSize: '15px', fontWeight: 800, borderRadius: '16px', border: 'none', cursor: 'pointer',
            }}>
              {loading ? <Loader2 size={22} className="animate-spin" /> : <><span>Send Reset Link</span><Send size={18} /></>}
            </button>
          </form>
        </div>
      ) : (
        <div className="anim-pop" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(34,197,94,0.1)', color: '#22c55e', marginBottom: '24px', animation: 'successPulse 2s infinite',
          }}>
            <CheckCircle2 size={44} />
          </div>
          <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Check Your Email</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px', maxWidth: '280px' }}>
            We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong>. Check your inbox and spam folder.
          </p>
          <button onClick={() => switchView('login')} className="btn-primary" style={{
            width: '100%', height: '56px', fontSize: '15px', fontWeight: 800, borderRadius: '16px', border: 'none', cursor: 'pointer',
          }}>
            Back to Login
          </button>
          <button onClick={() => setForgotSent(false)} style={{
            marginTop: '16px', background: 'none', border: 'none', fontSize: '13px', fontWeight: 700,
            color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s',
          }}>
            Try another email
          </button>
        </div>
      )}
    </div>

    <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
      Remember your password?{' '}
      <button onClick={() => switchView('login')} style={{
        background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', color: 'var(--brand-primary)',
      }}>Sign In</button>
    </p>
  </div>
);

// --------------- MAIN COMPONENT ---------------
export default function LoginPage() {
  const [view, setView] = useState<AuthView>('login');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [signupStep, setSignupStep] = useState(0);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupAvatar, setSignupAvatar] = useState('🌿');
  const [agreed, setAgreed] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();
  const { login, signup, guestLogin, updateProfile } = useAuth();

  // Reset error on view change
  useEffect(() => { setError(''); }, [view]);

  // --------------- LOGIN ---------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginEmail = email || (role === 'admin' ? 'admin@frytofly.in' : '');
      const ok = await login(loginEmail, password, role);
      if (ok) {
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(async () => {
      await login('google.user@gmail.com', 'google-oauth', 'user');
      navigate('/dashboard');
    }, 1200);
  };

  const handleGuestLogin = () => {
    guestLogin();
    navigate('/dashboard');
  };

  // --------------- SIGNUP ---------------
  const signupSteps = ['Identity', 'Contact', 'Security', 'Avatar'];

  const canNextSignup = () => {
    if (signupStep === 0) return signupName.trim().length >= 2;
    if (signupStep === 1) return signupEmail.includes('@') && signupPhone.length >= 10;
    if (signupStep === 2) return signupPassword.length >= 6 && signupPassword === signupConfirm && agreed;
    return true;
  };

  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await signup(signupName, signupEmail, signupPhone, signupPassword);
      if (ok) {
        updateProfile({ avatar: signupAvatar });
        setShowSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch {
      // Fallback — auto-register offline
      await signup(signupName, signupEmail, signupPhone, signupPassword);
      updateProfile({ avatar: signupAvatar });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // --------------- FORGOT ---------------
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setForgotSent(true);
  };

  // --------------- SWITCH VIEW HELPER ---------------
  const switchView = (v: AuthView) => {
    setView(v);
    setError('');
    setSignupStep(0);
    setForgotSent(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflowX: 'hidden', position: 'relative' }}>
      <BackgroundOrbs />

      {showSuccess && <SuccessOverlay />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', paddingTop: '40px', paddingBottom: '40px', position: 'relative', zIndex: 10, maxWidth: '460px', width: '100%', margin: '0 auto' }}>
        {/* Logo - always visible */}
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: view === 'login' ? '32px' : '20px', transition: 'margin 0.3s' }}>
          <div style={{
            width: view === 'login' ? '76px' : '56px', height: view === 'login' ? '76px' : '56px',
            borderRadius: view === 'login' ? '24px' : '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: view === 'login' ? '20px' : '12px', padding: '12px', transition: 'all 0.4s cubic-bezier(.16,1,.3,1)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 12px 40px var(--shadow-color)',
          }}>
            <img src="/logo.png" alt="FrytoFly" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {view === 'login' && (
            <>
              <h1 className="font-display" style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Fryto<span style={{ color: 'var(--brand-primary)' }}>Fly</span>
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600, letterSpacing: '0.04em' }}>
                Premium UCO Recycling Ecosystem
              </p>
            </>
          )}
        </div>

        {/* Content */}
        {view === 'login' && (
          <LoginView
            role={role}
            setRole={setRole}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={error}
            loading={loading}
            handleLogin={handleLogin}
            handleGoogleLogin={handleGoogleLogin}
            handleGuestLogin={handleGuestLogin}
            switchView={switchView}
          />
        )}
        {view === 'signup' && (
          <SignupView
            signupStep={signupStep}
            setSignupStep={setSignupStep}
            signupSteps={signupSteps}
            signupName={signupName}
            setSignupName={setSignupName}
            signupEmail={signupEmail}
            setSignupEmail={setSignupEmail}
            signupPhone={signupPhone}
            setSignupPhone={setSignupPhone}
            signupPassword={signupPassword}
            setSignupPassword={setSignupPassword}
            signupConfirm={signupConfirm}
            setSignupConfirm={setSignupConfirm}
            signupAvatar={signupAvatar}
            setSignupAvatar={setSignupAvatar}
            agreed={agreed}
            setAgreed={setAgreed}
            error={error}
            loading={loading}
            handleSignup={handleSignup}
            handleGoogleLogin={handleGoogleLogin}
            switchView={switchView}
            canNextSignup={canNextSignup}
          />
        )}
        {view === 'forgot' && (
          <ForgotView
            forgotEmail={forgotEmail}
            setForgotEmail={setForgotEmail}
            forgotSent={forgotSent}
            setForgotSent={setForgotSent}
            loading={loading}
            handleForgot={handleForgot}
            switchView={switchView}
          />
        )}
      </div>
    </div>
  );
}

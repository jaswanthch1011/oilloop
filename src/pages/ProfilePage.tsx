import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, Sun, Moon, Copy, Check, LogOut, Shield, Award, Users, Flame } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_OPTIONS, ECO_LEVELS } from '../lib/constants';
import { mockBadges } from '../data/mockData';

export default function ProfilePage() {
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  if (!user) return null;

  const handleSave = () => {
    updateProfile({ name, email, phone });
    setIsEditing(false);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectAvatar = (avatar: string) => {
    updateProfile({ avatar });
    setShowAvatarSelector(false);
  };

  // Find next level progress
  const currentPoints = user.totalPoints;
  const currentLevel = user.ecoLevel;
  const nextLevel = ECO_LEVELS.find(l => l.level === currentLevel.level + 1);
  const progressPercent = nextLevel 
    ? Math.min(100, Math.max(0, ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100))
    : 100;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Profile & Settings" showBack />
      <div className="page-container animate-fade-in">
        
        {/* Profile Card */}
        <div className="card-base p-6 mb-6 flex flex-col items-center relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 h-2" 
            style={{ background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }}
          />

          {/* Avatar & Edit Button */}
          <div className="relative mt-4">
            <button 
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl glass-card-strong shadow-card transition-transform active:scale-95"
            >
              {user.avatar}
            </button>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center border-2 border-white dark:border-zinc-800 text-[10px] text-white">
              ✏️
            </div>
          </div>

          {showAvatarSelector && (
            <div className="card-base p-4 mt-4 w-full animate-scale-in">
              <p className="text-xs font-semibold mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>Choose an Eco Avatar</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(av => (
                  <button 
                    key={av} 
                    onClick={() => selectAvatar(av)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all ${user.avatar === av ? 'ring-2 ring-green-500 scale-110' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold font-display mt-4" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm">{user.ecoLevel.icon}</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>{user.ecoLevel.name} Level</span>
          </div>

          {/* Level Progress */}
          <div className="w-full mt-5">
            <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span>Level {user.ecoLevel.level}</span>
              {nextLevel ? (
                <span>{user.totalPoints} / {nextLevel.minPoints} pts to Level {nextLevel.level}</span>
              ) : (
                <span>Ultimate Eco Level reached!</span>
              )}
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%`, background: 'var(--brand-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-base p-3 flex flex-col items-center justify-center text-center">
            <Flame size={16} className="text-amber-500 mb-1" />
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user.streak}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Day Streak</span>
          </div>
          <div className="card-base p-3 flex flex-col items-center justify-center text-center">
            <Award size={16} className="text-teal-500 mb-1" />
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user.badges.length}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Badges</span>
          </div>
          <div className="card-base p-3 flex flex-col items-center justify-center text-center">
            <Users size={16} className="text-purple-500 mb-1" />
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user.referralCount}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Invites</span>
          </div>
        </div>

        {/* Details Form / Edit Section */}
        <div className="card-base p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title">Personal Details</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                <button onClick={handleSave} className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>Save</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <UserIcon size={16} />
                </span>
                <input 
                  type="text" 
                  value={name} 
                  disabled={!isEditing}
                  onChange={e => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl outline-none transition-all ${isEditing ? 'bg-zinc-50 dark:bg-zinc-800 border border-green-500' : 'bg-transparent border border-transparent'}`}
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  value={email} 
                  disabled={!isEditing}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl outline-none transition-all ${isEditing ? 'bg-zinc-50 dark:bg-zinc-800 border border-green-500' : 'bg-transparent border border-transparent'}`}
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" 
                  value={phone} 
                  disabled={!isEditing}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl outline-none transition-all ${isEditing ? 'bg-zinc-50 dark:bg-zinc-800 border border-green-500' : 'bg-transparent border border-transparent'}`}
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="card-base p-5 mb-6">
          <h3 className="section-title mb-4">Eco Badges</h3>
          <div className="grid grid-cols-4 gap-4">
            {mockBadges.map(badge => {
              const isUnlocked = user.badges.some(b => b.id === badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${isUnlocked ? 'scale-100' : 'opacity-40 filter grayscale'}`}
                >
                  <span className="text-3xl mb-1 filter drop-shadow-md select-none">{badge.icon}</span>
                  <span className="text-[9px] font-semibold leading-tight line-clamp-1" style={{ color: 'var(--text-primary)' }}>{badge.name}</span>
                  <span className="text-[7px]" style={{ color: 'var(--text-muted)' }}>{badge.requirement}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite & Earn */}
        <div className="card-base p-5 mb-6 relative overflow-hidden" style={{ background: 'var(--glow-color)' }}>
          <div className="absolute right-4 top-4 text-4xl opacity-20">🎁</div>
          <h3 className="text-sm font-bold font-display" style={{ color: 'var(--brand-primary)' }}>Invite Friends, Get Points!</h3>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
            Share your referral code and earn 100 points for every friend who signs up and completes their first recycling scan.
          </p>
          <div className="flex gap-2">
            <div 
              className="flex-1 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center justify-between border" 
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {user.referralCode}
              <button onClick={handleCopyReferral} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} style={{ color: 'var(--text-muted)' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="card-base p-5 mb-6 space-y-4">
          <h3 className="section-title">App Settings</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDark ? 'Dark Theme (Lime Yellow)' : 'Light Theme (Eco Green)'}
            </span>
            <button 
              onClick={toggleTheme}
              className="w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none flex items-center"
              style={{ 
                background: isDark ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                justifyContent: isDark ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                style={{ background: isDark ? '#0f1410' : '#fff' }}
              >
                {isDark ? <Moon size={10} className="text-lime-500" /> : <Sun size={10} className="text-amber-500" />}
              </div>
            </button>
          </div>

          <div className="h-px" style={{ background: 'var(--border-color)' }} />
          
          <button 
            onClick={() => navigate('/history')}
            className="w-full flex items-center justify-between text-left text-sm font-medium" 
            style={{ color: 'var(--text-primary)' }}
          >
            <span>Recycling History & Logs</span>
            <span style={{ color: 'var(--text-muted)' }}>➔</span>
          </button>
          
          <div className="h-px" style={{ background: 'var(--border-color)' }} />
          
          <button 
            onClick={() => navigate('/faq')}
            className="w-full flex items-center justify-between text-left text-sm font-medium" 
            style={{ color: 'var(--text-primary)' }}
          >
            <span>Help & FAQs</span>
            <span style={{ color: 'var(--text-muted)' }}>➔</span>
          </button>

          <div className="h-px" style={{ background: 'var(--border-color)' }} />
          
          <button 
            onClick={() => navigate('/chatbot')}
            className="w-full flex items-center justify-between text-left text-sm font-medium" 
            style={{ color: 'var(--text-primary)' }}
          >
            <span>Chat with LoopBot (AI)</span>
            <span style={{ color: 'var(--text-muted)' }}>➔</span>
          </button>
          
          {isAdmin && (
            <>
              <div className="h-px" style={{ background: 'var(--border-color)' }} />
              <button 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between text-left text-sm font-medium" 
                style={{ color: 'var(--brand-primary)' }}
              >
                <span className="flex items-center gap-1.5"><Shield size={14} /> Admin Control Panel</span>
                <span>➔</span>
              </button>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full card-base p-4 text-center font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border-red-200 dark:border-red-900/30"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={16} /> Log Out
        </button>

      </div>
    </div>
  );
}

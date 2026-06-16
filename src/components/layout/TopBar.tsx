import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  transparent?: boolean;
}

export default function TopBar({ title, showBack = false, showNotifications = true, transparent = false }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, isAdmin } = useAuth();
  const { isDark } = useTheme();

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 transition-all duration-300 ${transparent ? '' : 'backdrop-blur-md border-b'}`}
      style={{
        background: transparent ? 'transparent' : 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
        )}
        {isHome && !title && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'var(--bg-card)' }}>
              <img src="/logo.png" alt="FrytoFly Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">FrytoFly</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
          </button>
        )}
        {showNotifications && (
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl relative transition-colors"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <Bell size={20} style={{ color: 'var(--text-primary)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: '#ef4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

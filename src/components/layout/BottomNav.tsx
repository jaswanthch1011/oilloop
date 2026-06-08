import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, ScanLine, Gift, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/schedule', icon: CalendarDays, label: 'Pickup' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to === '/dashboard' && location.pathname === '/');
          const isScan = to === '/scan';
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300 tap-highlight-none relative"
              style={{ minWidth: 56 }}
            >
              {isScan ? (
                <div
                  className="flex items-center justify-center w-12 h-12 -mt-6 rounded-2xl shadow-lg transition-all duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'
                      : 'var(--bg-secondary)',
                    boxShadow: isActive ? '0 4px 20px var(--glow-color)' : 'none',
                  }}
                >
                  <Icon size={22} color={isActive ? '#fff' : 'var(--text-muted)'} />
                </div>
              ) : (
                <div className="relative">
                  {isActive && <span className="nav-indicator" />}
                  <Icon
                    size={22}
                    style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
              )}
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
      {/* Safe area padding for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" style={{ background: 'var(--bg-card)' }} />
    </nav>
  );
}

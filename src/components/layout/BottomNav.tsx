import React, { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, ScanLine, Gift, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/schedule', icon: CalendarDays, label: 'Pickup' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = memo(() => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/30 shadow-lg"
      style={{ background: 'var(--bg-card)' }}>
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
                  className={`flex items-center justify-center w-12 h-12 -mt-6 rounded-2xl shadow-lg transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30 ring-4 ring-white/20' : 'bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md'}`}
                >
                  <Icon size={22} color={isActive ? '#fff' : 'var(--text-muted)'} />
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    size={22}
                    className={isActive ? 'text-green-500' : 'text-zinc-400'}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
              )}
              <span
                className={`text-[10px] font-bold transition-colors ${isActive ? 'text-green-500' : 'text-zinc-400'}`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
});

export default BottomNav;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Leaf, Fuel, Star, CalendarPlus, ScanLine, Gift, TrendingUp, Zap, HelpCircle, MessageCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopBar from '../components/layout/TopBar';
import { mockMonthlyData } from '../data/mockData';
import { calculateCO2Saved, calculateBiodiesel } from '../lib/calculations';
import { formatNumber, getRelativeTime } from '../lib/utils';

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current * 10) / 10);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{formatNumber(count)}{suffix}</span>;
}

const ecoTips = [
  "🌱 Did you know? 1 liter of UCO can produce 0.85L of biodiesel!",
  "♻️ Tip: Store used oil in a sealed container until pickup day.",
  "🌍 Every liter you recycle saves 2.5 kg of CO₂ emissions.",
  "💡 Used cooking oil can power vehicles for up to 3 km per liter!",
  "🐟 Proper oil disposal protects marine life and water sources.",
];

export default function DashboardPage() {
  const { user, pickups, scanResults } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tipIndex] = useState(() => Math.floor(Math.random() * ecoTips.length));

  if (!user) return null;

  const co2 = calculateCO2Saved(user.totalLitersRecycled);
  const biodiesel = calculateBiodiesel(user.totalLitersRecycled);

  const impactCards = [
    { icon: Droplets, label: 'Liters Recycled', value: user.totalLitersRecycled, suffix: 'L', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { icon: Leaf, label: 'CO₂ Saved', value: co2, suffix: ' kg', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
    { icon: Fuel, label: 'Biodiesel Made', value: biodiesel, suffix: 'L', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: Star, label: 'Total Points', value: user.totalPoints, suffix: '', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ];

  const quickActions = [
    { icon: CalendarPlus, label: 'Schedule Pickup', to: '/schedule', color: '#22c55e' },
    { icon: ScanLine, label: 'Scan Oil', to: '/scan', color: '#14b8a6' },
    { icon: Gift, label: 'Rewards', to: '/rewards', color: '#f59e0b' },
    { icon: TrendingUp, label: 'Leaderboard', to: '/leaderboard', color: '#8b5cf6' },
    { icon: HelpCircle, label: 'FAQ & Help', to: '/faq', color: '#ec4899' },
    { icon: MessageCircle, label: 'AI Chat', to: '/chatbot', color: '#06b6d4' },
  ];

  const recentActivity = [
    ...pickups.slice(0, 3).map(p => ({
      icon: '📅', text: `Pickup at ${p.locationName}`, time: p.createdAt, type: 'pickup'
    })),
    ...scanResults.slice(0, 3).map(s => ({
      icon: '📷', text: `Scanned ${s.brand} ${s.oilType}`, time: s.scannedAt, type: 'scan'
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const chartColor = isDark ? '#c6d631' : '#22c55e';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar />
      <div className="page-container pt-2">
        {/* Greeting */}
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl glass-card-strong shadow-card">
            {user.avatar}
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{user.name}!</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{user.ecoLevel.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>{user.ecoLevel.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {user.streak} day streak 🔥</span>
            </div>
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {impactCards.map((card, idx) => (
            <div
              key={card.label}
              className="card-base p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon size={16} color={card.color} />
                </div>
              </div>
              <div className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                <AnimatedCounter target={card.value} suffix={card.suffix} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Impact Chart */}
        <div className="card-base p-4 mb-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Monthly Impact</h3>
            <div className="badge badge-success">
              <TrendingUp size={12} className="mr-1" /> +18%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockMonthlyData}>
              <defs>
                <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              />
              <Area type="monotone" dataKey="liters" stroke={chartColor} strokeWidth={2.5} fill="url(#colorLiters)" dot={{ fill: chartColor, r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h3 className="section-title mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${action.color}15` }}>
                  <action.icon size={20} color={action.color} />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Eco Tip */}
        <div className="card-base p-4 mb-6 animate-slide-up" style={{ animationDelay: '600ms', background: 'var(--glow-color)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: 'var(--brand-primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>Eco Tip of the Day</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{ecoTips[tipIndex]}</p>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
            <h3 className="section-title mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="card-base p-3 flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.text}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{getRelativeTime(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

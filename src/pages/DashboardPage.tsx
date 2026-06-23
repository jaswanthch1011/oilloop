import React, { useEffect, useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Leaf, Fuel, Star, CalendarPlus, ScanLine, Gift, TrendingUp, Zap, HelpCircle, MessageCircle, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopBar from '../components/layout/TopBar';
import { mockMonthlyData } from '../data/mockData';
import { calculateCO2Saved, calculateBiodiesel } from '../lib/calculations';
import { formatNumber, getRelativeTime } from '../lib/utils';

// Memoized sub-components to prevent re-renders
const AnimatedCounter = memo(({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const duration = 1200;
    const frameRate = 30;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    const increment = target / totalFrames;
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      if (currentFrame >= totalFrames) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(prev => Math.min(target, prev + increment));
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{prefix}{formatNumber(Math.floor(count * 10) / 10)}{suffix}</span>;
});

const ImpactCard = memo(({ icon: Icon, label, value, suffix, color, bg, delay }: any) => (
  <div className="card-base p-4 group animate-slide-up relative overflow-hidden" style={{ animationDelay: `${delay}ms`, contain: 'content' }}>
    <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
       <Icon size={64} color={color} className="translate-x-6 -translate-y-6 rotate-12" />
    </div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300" style={{ background: bg }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div className="text-2xl font-black font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>
      <AnimatedCounter target={value} suffix={suffix} />
    </div>
    <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>{label}</p>
  </div>
));

const ecoTips = [
  "🌱 Did you know? 1 liter of UCO can produce 0.85L of biodiesel!",
  "♻️ Tip: Store used oil in a sealed container until pickup day.",
  "🌍 Every liter you recycle saves 2.5 kg of CO₂ emissions.",
  "💡 Used cooking oil can power vehicles for up to 3 km per liter!",
  "🐟 Proper oil disposal protects marine life and water sources.",
];

export default function DashboardPage() {
  const { user, pickups, scanResults, tickets } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tipIndex] = useState(() => Math.floor(Math.random() * ecoTips.length));

  const metrics = useMemo(() => {
    if (!user) return null;
    return {
      co2: calculateCO2Saved(user.totalLitersRecycled),
      biodiesel: calculateBiodiesel(user.totalLitersRecycled)
    };
  }, [user]);

  const impactCards = useMemo(() => {
    if (!user || !metrics) return [];
    return [
      { icon: Droplets, label: 'Liters Recycled', value: user.totalLitersRecycled, suffix: 'L', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { icon: Star, label: 'Total Points', value: user.totalPoints, suffix: '', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
      { icon: Leaf, label: 'CO₂ Saved', value: metrics.co2, suffix: ' kg', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
      { icon: Fuel, label: 'Biodiesel Made', value: metrics.biodiesel, suffix: 'L', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ];
  }, [user, metrics]);

  const quickActions = [
    { icon: CalendarPlus, label: 'Schedule Pickup', to: '/schedule', color: '#22c55e', desc: 'Request oil collection' },
    { icon: ScanLine, label: 'Scan Oil', to: '/scan', color: '#14b8a6', desc: 'Verify oil quality' },
    { icon: Gift, label: 'Rewards', to: '/rewards', color: '#f59e0b', desc: 'Redeem your points' },
    { icon: MessageCircle, label: 'AI Chatbot', to: '/chatbot', color: '#8b5cf6', desc: 'Get instant eco-help' },
  ];

  const recentActivity = useMemo(() => {
    const combined = [
      ...pickups.slice(0, 3).map(p => ({
        icon: '📅', text: `Pickup at ${p.locationName}`, time: p.createdAt, type: 'pickup', status: p.status
      })),
      ...scanResults.slice(0, 3).map(s => ({
        icon: '📷', text: `Scanned ${s.brand} ${s.oilType}`, time: s.scannedAt, type: 'scan', status: s.status
      })),
    ];
    return combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [pickups, scanResults]);

  const userTickets = useMemo(() => {
    return tickets.filter(t => t.userId === user?.id).slice(0, 3);
  }, [tickets, user?.id]);

  if (!user) return null;

  const chartColor = isDark ? '#c6d631' : '#22c55e';
  const progressPercent = Math.min(100, (user.totalPoints % 1000) / 10);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background blobs for glassmorphism pop */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl animate-pulse-gentle" style={{ background: 'var(--brand-primary)' }} />
      <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--brand-accent)' }} />
      <div className="absolute bottom-1/4 -right-10 w-56 h-56 rounded-full opacity-10 blur-3xl animate-pulse-gentle" style={{ background: 'var(--brand-primary)' }} />

      <TopBar />
      <div className="page-container pt-2 relative z-10 pb-32">
        {/* Profile & Eco Level Header */}
        <div className="glass-card-strong p-6 mb-8 animate-slide-down relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Leaf size={120} />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
               <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-4xl bg-white dark:bg-zinc-800 shadow-xl border-2 border-emerald-500/20">
                {user.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                <ShieldCheck size={12} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
              </p>
              <h2 className="text-2xl font-black font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center gap-1">
                  {user.ecoLevel.icon} {user.ecoLevel.name}
                </span>
                <span className="text-[10px] font-bold opacity-60">• {user.streak} DAY STREAK 🔥</span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Level Progress</span>
              <span className="text-[10px] font-black">{user.totalPoints % 1000}/1000 XP</span>
            </div>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full shadow-glow-green transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[9px] font-medium opacity-50 text-center italic">Earn {1000 - (user.totalPoints % 1000)} more points to reach Master Recycler</p>
          </div>
        </div>

        {/* Impact Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {impactCards.map((card, idx) => (
            <ImpactCard key={card.label} {...card} delay={idx * 100} />
          ))}
        </div>

        {/* Quick Actions - Large Style */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="section-title">Core Actions</h3>
            <button className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-4 p-4 rounded-[1.5rem] transition-all active:scale-[0.98] card-base group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ background: `${action.color}15` }}>
                  <action.icon size={24} color={action.color} />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-sm font-black text-zinc-900 dark:text-white">{action.label}</span>
                  <span className="block text-[10px] font-medium text-zinc-500 mt-0.5">{action.desc}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className="text-zinc-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Impact Chart */}
        <div className="card-base p-5 mb-8 animate-slide-up" style={{ animationDelay: '550ms', contain: 'content' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="section-title">Environmental Impact</h3>
              <p className="text-[10px] font-medium opacity-50 mt-0.5">Recycling volume over the last 6 months</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData}>
                <defs>
                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16,
                    fontSize: 10,
                    fontWeight: 'bold',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ color: 'var(--brand-primary)' }}
                />
                <Area
                  type="monotone"
                  dataKey="liters"
                  stroke={chartColor}
                  strokeWidth={3}
                  fill="url(#colorLiters)"
                  dot={{ r: 4, fill: chartColor, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Tickets Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="section-title">Support Tickets</h3>
            <button onClick={() => navigate('/tickets')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
          </div>
          {userTickets.length === 0 ? (
            <div className="card-base p-6 text-center flex flex-col items-center">
              <p className="text-xs text-zinc-500">No active support tickets.</p>
              <button 
                onClick={() => navigate('/tickets', { state: { tab: 'raise_ticket' } })}
                className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-2 hover:underline"
              >
                + Raise Support Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate('/tickets', { state: { ticketId: ticket.id } })}
                  className="w-full card-base p-4 text-left hover:scale-[1.01] transition-transform flex items-center justify-between group"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-zinc-400">ID: {ticket.id}</span>
                      <span className="text-[9px] text-zinc-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {ticket.subject}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black uppercase tracking-wide text-zinc-400">
                        {ticket.category}
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        {ticket.messages.length} msg{ticket.messages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {ticket.status === 'open' && (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">Open</span>
                    )}
                    {ticket.status === 'in_progress' && (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">In Progress</span>
                    )}
                    {ticket.status === 'resolved' && (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">Resolved</span>
                    )}
                    <span className="text-zinc-300 group-hover:text-emerald-500 transition-colors">➔</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '650ms' }}>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="section-title">Recent Activity</h3>
            <button onClick={() => navigate('/history')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">View History</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-zinc-900/40 border border-white/10 dark:border-zinc-800/50 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-lg">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{activity.text}</p>
                  <p className="text-[9px] font-medium text-zinc-500 mt-0.5">{getRelativeTime(activity.time)}</p>
                </div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                  activity.status === 'completed' || activity.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eco Tip - Card Style */}
        <div className="card-base p-6 animate-slide-up relative overflow-hidden group" style={{ animationDelay: '750ms', background: 'var(--glow-color)', border: 'none' }}>
          <div className="absolute top-0 right-0 p-4 text-emerald-500/20 group-hover:scale-125 transition-transform duration-700">
            <Zap size={48} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap size={14} className="text-emerald-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Green Tip</span>
          </div>
          <p className="text-sm font-medium leading-relaxed relative z-10" style={{ color: 'var(--text-primary)' }}>{ecoTips[tipIndex]}</p>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 cursor-pointer hover:underline">
            <Info size={12} />
            Learn more about environmental impact
          </div>
        </div>
      </div>
    </div>
  );
}


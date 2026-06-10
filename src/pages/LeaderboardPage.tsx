import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { mockLeaderboard } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { mockBadges } from '../data/mockData';
import { ECO_LEVELS } from '../lib/constants';
import { apiUrl } from '../lib/api';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('monthly');
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'levels'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (tab === 'leaderboard') {
      setLoading(true);
      fetch(apiUrl('/api/leaderboard'))
        .then(res => res.json())
        .then(data => {
          setLeaderboard(data.leaderboard);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch leaderboard:', err);
          setLoading(false);
          // Fallback to mock
          setLeaderboard(mockLeaderboard);
        });
    }
  }, [tab]);

  const podiumColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
  const podiumIcons = [Crown, Trophy, Medal];

  // Dynamic leaderboard that merges server data with current user state
  const dynamicLeaderboard = [...leaderboard].map(entry => {
    if (entry.userId === user?.id && user) {
      return {
        ...entry,
        name: user.name,
        avatar: user.avatar,
        points: user.totalPoints,
        liters: user.totalLitersRecycled,
        level: user.ecoLevel,
        isCurrentUser: true,
      };
    }
    return entry;
  }).sort((a, b) => b.points - a.points);

  // If user is not in the top leaderboard from server, add them at the end for visual
  if (user && !dynamicLeaderboard.find(e => e.userId === user.id)) {
    dynamicLeaderboard.push({
      rank: 0, // will be re-indexed
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      points: user.totalPoints,
      liters: user.totalLitersRecycled,
      level: user.ecoLevel,
      isCurrentUser: true,
    });
    dynamicLeaderboard.sort((a, b) => b.points - a.points);
  }

  // Re-index ranks based on new points sorting
  dynamicLeaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Achievements" showBack />
      <div className="page-container">
        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--bg-secondary)' }}>
          {([['leaderboard', '🏆 Ranks'], ['badges', '🎖️ Badges'], ['levels', '📊 Levels']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === key ? 'var(--bg-card)' : 'transparent',
                color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === key ? '0 1px 3px var(--shadow-color)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="animate-slide-up">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-green-500 mb-4" />
                <p className="text-sm text-zinc-500">Loading global rankings...</p>
              </div>
            ) : (
              <>
                {/* Period filter */}
                <div className="flex gap-2 mb-6">
              {(['weekly', 'monthly', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                  style={{
                    background: period === p ? 'var(--brand-primary)' : 'var(--bg-card)',
                    color: period === p ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${period === p ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  }}
                >
                  {p === 'all' ? 'All Time' : p}
                </button>
              ))}
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-3 mb-8 px-4">
              {[1, 0, 2].map(podIdx => {
                const entry = dynamicLeaderboard[podIdx];
                const Icon = podiumIcons[podIdx];
                const heights = [140, 160, 120];
                return (
                  <div key={podIdx} className="flex flex-col items-center flex-1 animate-slide-up" style={{ animationDelay: `${podIdx * 150}ms` }}>
                    <div className="relative mb-2">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl glass-card-strong shadow-card">
                        {entry.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: podiumColors[podIdx] }}>
                        <Icon size={12} color="#fff" />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-center truncate w-full" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--brand-primary)' }}>{entry.points.toLocaleString()} pts</span>
                    <div
                       className="w-full rounded-t-xl mt-2 flex items-end justify-center pb-2"
                       style={{
                         height: heights[podIdx],
                         background: `linear-gradient(to top, ${podiumColors[podIdx]}30, ${podiumColors[podIdx]}10)`,
                         border: `1px solid ${podiumColors[podIdx]}40`,
                       }}
                    >
                      <span className="text-2xl font-bold font-display" style={{ color: podiumColors[podIdx] }}>#{entry.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of leaderboard */}
            <div className="space-y-2">
              {dynamicLeaderboard.slice(3).map((entry, idx) => (
                <div
                  key={entry.userId}
                  className="card-base p-3 flex items-center gap-3"
                  style={{
                    borderColor: entry.isCurrentUser ? 'var(--brand-primary)' : 'var(--border-color)',
                    background: entry.isCurrentUser ? 'var(--glow-color)' : 'var(--bg-card)',
                  }}
                >
                  <span className="w-8 text-sm font-bold text-center" style={{ color: 'var(--text-muted)' }}>#{entry.rank}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--bg-secondary)' }}>
                    {entry.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.name} {entry.isCurrentUser && <span className="text-xs badge badge-success ml-1">You</span>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.level.icon} {entry.level.name} • {entry.liters}L recycled</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{entry.points.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}

        {/* Badges Tab */}
        {tab === 'badges' && (
          <div className="animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              {mockBadges.map((badge, idx) => {
                const unlocked = user?.badges.some(b => b.id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className="card-base p-4 flex flex-col items-center text-center animate-slide-up"
                    style={{
                      animationDelay: `${idx * 80}ms`,
                      opacity: unlocked ? 1 : 0.5,
                      filter: unlocked ? 'none' : 'grayscale(0.8)',
                    }}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{badge.name}</h4>
                    <p className="text-[10px] mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>{badge.description}</p>
                    {unlocked ? (
                      <span className="badge badge-success text-[10px]">✓ Unlocked</span>
                    ) : (
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>🔒 {badge.requirement}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Levels Tab */}
        {tab === 'levels' && (
          <div className="animate-slide-up space-y-4">
            {ECO_LEVELS.map((level, idx) => {
              const isCurrent = user?.ecoLevel.level === level.level;
              const isReached = (user?.totalPoints || 0) >= level.minPoints;
              const progress = isCurrent
                ? Math.min(100, (((user?.totalPoints || 0) - level.minPoints) / (level.maxPoints - level.minPoints)) * 100)
                : isReached ? 100 : 0;

              return (
                <div
                  key={level.level}
                  className="card-base p-4 animate-slide-up"
                  style={{
                    animationDelay: `${idx * 100}ms`,
                    borderColor: isCurrent ? 'var(--brand-primary)' : 'var(--border-color)',
                    background: isCurrent ? 'var(--glow-color)' : 'var(--bg-card)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{level.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          Level {level.level}: {level.name}
                          {isCurrent && <span className="badge badge-success ml-2 text-[10px]">Current</span>}
                        </h4>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{level.minPoints} – {level.maxPoints} pts</span>
                      </div>
                      <div className="w-full h-2 rounded-full mt-2" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

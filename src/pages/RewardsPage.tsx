import React, { useState } from 'react';
import { Star, Search, ShoppingBag, CheckCircle2, X } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { mockRewards } from '../data/mockData';
import { REWARD_CATEGORIES } from '../lib/constants';

export default function RewardsPage() {
  const { user, spendPoints, addRedemption } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tab, setTab] = useState<'shop' | 'history'>('shop');
  const { redemptions } = useAuth();

  if (!user) return null;

  const filtered = mockRewards.filter(r => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return r.available;
  });

  const featured = mockRewards.filter(r => r.featured);

  const handleRedeem = (reward: typeof mockRewards[0]) => {
    setRedeemingId(reward.id);
  };

  const confirmRedeem = () => {
    const reward = mockRewards.find(r => r.id === redeemingId);
    if (!reward) return;
    const ok = spendPoints(reward.pointsCost);
    if (ok) {
      addRedemption({
        rewardId: reward.id,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
        status: 'pending',
      });
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setRedeemingId(null); }, 2000);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Rewards" />
      <div className="page-container">
        {/* Points Balance */}
        <div className="card-base p-5 mb-6 text-center animate-slide-down" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--glow-color))' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star size={18} style={{ color: 'var(--brand-primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Available Points</span>
          </div>
          <p className="text-4xl font-bold font-display gradient-text">{user.availablePoints.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total earned: {user.totalPoints.toLocaleString()}</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-4" style={{ background: 'var(--bg-secondary)' }}>
          {(['shop', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t ? '0 1px 3px var(--shadow-color)' : 'none',
              }}
            >
              {t === 'shop' ? '🛍️ Shop' : '📋 History'}
            </button>
          ))}
        </div>

        {tab === 'shop' && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-base pl-10"
                placeholder="Search rewards..."
              />
            </div>

            {/* Featured */}
            {!search && activeCategory === 'all' && (
              <div className="mb-6">
                <h3 className="section-title mb-3">✨ Featured</h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {featured.map(r => (
                    <div key={r.id} className="card-base p-4 flex-shrink-0" style={{ width: 160 }}>
                      <div className="text-4xl mb-2 text-center">{r.image}</div>
                      <h4 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</h4>
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                        <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>{r.pointsCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className="px-4 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all"
                style={{
                  background: activeCategory === 'all' ? 'var(--brand-primary)' : 'var(--bg-card)',
                  color: activeCategory === 'all' ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${activeCategory === 'all' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                }}
              >
                All
              </button>
              {REWARD_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="px-4 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all whitespace-nowrap"
                  style={{
                    background: activeCategory === cat.id ? 'var(--brand-primary)' : 'var(--bg-card)',
                    color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${activeCategory === cat.id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((r, idx) => {
                const canAfford = user.availablePoints >= r.pointsCost;
                return (
                  <div key={r.id} className="card-base p-4 flex flex-col animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="text-4xl mb-3 text-center py-2">{r.image}</div>
                    <h4 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{r.name}</h4>
                    <p className="text-[10px] mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                    <div className="mt-auto">
                      <div className="flex items-center gap-1 mb-2">
                        <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                        <span className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{r.pointsCost}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>pts</span>
                      </div>
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={!canAfford}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: canAfford ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                          color: canAfford ? '#fff' : 'var(--text-muted)',
                          opacity: canAfford ? 1 : 0.6,
                        }}
                      >
                        {canAfford ? 'Redeem' : 'Not enough'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="space-y-3 animate-slide-up">
            {redemptions.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No redemptions yet</p>
              </div>
            ) : (
              redemptions.map(r => (
                <div key={r.id} className="card-base p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <ShoppingBag size={18} style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.rewardName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(r.redeemedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#ef4444' }}>-{r.pointsSpent}</p>
                    <span className="badge badge-success text-[10px] capitalize">{r.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Redeem Modal */}
        {redeemingId && !showSuccess && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" style={{ background: 'var(--bg-card)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Confirm Redemption</h3>
                <button onClick={() => setRedeemingId(null)} className="p-1"><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
              </div>
              {(() => {
                const reward = mockRewards.find(r => r.id === redeemingId);
                if (!reward) return null;
                return (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-5xl">{reward.image}</span>
                      <h4 className="text-base font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{reward.name}</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{reward.description}</p>
                    </div>
                    <div className="card-base p-4 mb-4 flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cost</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>{reward.pointsCost} pts</span>
                    </div>
                    <button onClick={confirmRedeem} className="btn-primary w-full">Confirm Redemption</button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Success overlay */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="p-8 rounded-3xl text-center animate-scale-in" style={{ background: 'var(--bg-card)' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--brand-primary)' }} className="mx-auto mb-3" />
              <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Redeemed! 🎉</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Check your profile for details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

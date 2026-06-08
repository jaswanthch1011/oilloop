import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Camera, Gift, ClipboardList, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { getRelativeTime } from '../lib/utils';
import type { Pickup, ScanResult, Redemption } from '../types';

type TabType = 'all' | 'pickups' | 'scans' | 'redemptions';

export default function HistoryPage() {
  const { pickups, scanResults, redemptions } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const navigate = useNavigate();

  // Helper to format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Status styling helpers
  const getPickupStatusBadge = (status: Pickup['status']) => {
    switch (status) {
      case 'scheduled':
        return <span className="badge badge-warning flex items-center gap-1"><Clock size={11} /> Scheduled</span>;
      case 'confirmed':
        return <span className="badge badge-info flex items-center gap-1"><CheckCircle2 size={11} /> Confirmed</span>;
      case 'picked_up':
        return <span className="badge badge-success flex items-center gap-1" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>Picked Up</span>;
      case 'processed':
        return <span className="badge badge-success flex items-center gap-1" style={{ color: '#059669', background: 'rgba(5,150,105,0.1)' }}>Processed</span>;
      case 'completed':
        return <span className="badge badge-success flex items-center gap-1">Completed</span>;
      default:
        return null;
    }
  };

  const getRedemptionStatusBadge = (status: Redemption['status']) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning flex items-center gap-1"><Clock size={11} /> Pending Delivery</span>;
      case 'delivered':
        return <span className="badge badge-success flex items-center gap-1">Delivered</span>;
      case 'used':
        return <span className="badge badge-info flex items-center gap-1">Redeemed</span>;
      default:
        return null;
    }
  };

  // Convert and merge all items into a single chronologically sorted history array
  const allActivities = [
    ...pickups.map(p => ({
      id: p.id,
      date: p.createdAt,
      type: 'pickup' as const,
      data: p,
    })),
    ...scanResults.map(s => ({
      id: s.id,
      date: s.scannedAt,
      type: 'scan' as const,
      data: s,
    })),
    ...redemptions.map(r => ({
      id: r.id,
      date: r.redeemedAt,
      type: 'redemption' as const,
      data: r,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filters
  const filteredActivities = allActivities.filter(activity => {
    if (activeTab === 'all') return true;
    return activity.type === activeTab.slice(0, -1); // 'pickups' -> 'pickup', etc.
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Recycling History" showBack />
      
      {/* Tabs */}
      <div className="sticky top-[53px] z-30 pt-3 pb-3" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-lg mx-auto px-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {(['all', 'pickups', 'scans', 'redemptions'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab ? 'var(--brand-primary)' : 'var(--bg-card)',
                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                border: `1.5px solid ${activeTab === tab ? 'var(--brand-primary)' : 'var(--border-color)'}`,
              }}
            >
              {tab === 'all' && 'All Activity 📋'}
              {tab === 'pickups' && 'Pickups 📅'}
              {tab === 'scans' && 'AI Scans 📷'}
              {tab === 'redemptions' && 'Rewards 🎁'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container animate-fade-in pt-4">
        
        <div className="space-y-4">
          {filteredActivities.map(activity => {
            if (activity.type === 'pickup') {
              const p = activity.data as Pickup;
              return (
                <div key={activity.id} className="card-base p-4 flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <Calendar className="text-green-500" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Pickup: {p.id}</span>
                      {getPickupStatusBadge(p.status)}
                    </div>
                    <h4 className="text-sm font-bold text-ellipsis overflow-hidden" style={{ color: 'var(--text-primary)' }}>
                      {p.locationName}
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Scheduled: {formatDate(p.scheduledDate)} at {p.scheduledTime}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.oilType} • {p.estimatedVolume}L ({p.containers} can)
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>
                        +{Math.round(p.estimatedVolume * 50)} Points (Est.)
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (activity.type === 'scan') {
              const s = activity.data as ScanResult;
              return (
                <div key={activity.id} className="card-base p-4 flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.1)' }}>
                    <Camera className="text-teal-500" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>AI Scan: {s.brand}</span>
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/30">
                        {s.confidence}% Match
                      </span>
                    </div>
                    <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.oilType} ({s.volume}L)
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Scanned: {formatDate(s.scannedAt)}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        Instant Scan Award
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>
                        +{s.pointsAwarded} Points
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (activity.type === 'redemption') {
              const r = activity.data as Redemption;
              return (
                <div key={activity.id} className="card-base p-4 flex gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <Gift className="text-amber-500" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Marketplace Claim</span>
                      {getRedemptionStatusBadge(r.status)}
                    </div>
                    <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {r.rewardName}
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Claimed: {formatDate(r.redeemedAt)}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        Spent
                      </span>
                      <span className="text-xs font-bold text-red-500">
                        -{r.pointsSpent} Points
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {filteredActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 text-zinc-400">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No Activities Found</h3>
              <p className="text-xs mt-1 max-w-xs px-4" style={{ color: 'var(--text-muted)' }}>
                {activeTab === 'all' && "You haven't scheduled any pickups, scanned cooking oil, or redeemed rewards yet."}
                {activeTab === 'pickups' && "No pickups found. Schedule your first eco drop-off today!"}
                {activeTab === 'scans' && "No oil pack scans found. Try scanning an oil pack wrapper with your camera to earn instant points."}
                {activeTab === 'redemptions' && "You haven't redeemed any points for eco-rewards yet. Browse our marketplace to claim green products."}
              </p>
              {activeTab === 'pickups' && (
                <button onClick={() => navigate('/schedule')} className="btn-primary mt-4 py-2.5 px-5 text-sm">
                  Schedule a Pickup
                </button>
              )}
              {activeTab === 'scans' && (
                <button onClick={() => navigate('/scan')} className="btn-primary mt-4 py-2.5 px-5 text-sm">
                  Scan Oil Pack
                </button>
              )}
              {activeTab === 'redemptions' && (
                <button onClick={() => navigate('/rewards')} className="btn-primary mt-4 py-2.5 px-5 text-sm">
                  Browse Rewards
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

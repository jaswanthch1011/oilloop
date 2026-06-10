import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Award, Calendar, Gift, Zap, Users, CheckCheck, Trash2 } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { getRelativeTime } from '../lib/utils';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, deleteNotification, clearAllNotifications, unreadCount } = useAuth();
  const navigate = useNavigate();

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      clearAllNotifications();
    }
  };

  const getIcon = (type: Notification['type'], defaultIcon: string) => {
    switch (type) {
      case 'badge_unlock': return <Award className="text-teal-500" size={18} />;
      case 'pickup_reminder': return <Calendar className="text-green-500" size={18} />;
      case 'reward_alert': return <Gift className="text-amber-500" size={18} />;
      case 'referral': return <Users className="text-purple-500" size={18} />;
      default: return <span className="text-sm">{defaultIcon || '🔔'}</span>;
    }
  };

  // Group notifications: Today, Yesterday, Older
  const now = new Date();
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];

  notifications.forEach(n => {
    const date = new Date(n.createdAt);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Check if it's actually today or yesterday by date comparison
      if (date.getDate() === now.getDate()) {
        today.push(n);
      } else {
        yesterday.push(n);
      }
    } else if (diffDays <= 2) {
      yesterday.push(n);
    } else {
      older.push(n);
    }
  });

  const renderGroup = (title: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        <div className="space-y-3">
          {list.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markNotificationRead(n.id)}
              className={`card-base p-4 flex gap-4 cursor-pointer relative transition-all group ${!n.read ? 'border-l-4' : 'opacity-75'}`}
              style={{
                borderLeftColor: !n.read ? 'var(--brand-primary)' : undefined,
                background: !n.read ? 'var(--bg-card)' : 'var(--bg-secondary)',
              }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" 
                style={{ background: n.read ? 'rgba(0,0,0,0.03)' : 'var(--glow-color)' }}
              >
                {getIcon(n.type, n.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold truncate pr-4" style={{ color: 'var(--text-primary)' }}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {getRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-normal" style={{ color: 'var(--text-secondary)' }}>
                  {n.message}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-opacity"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>

                {!n.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-blue-400 hover:text-blue-500 transition-opacity"
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>

              {!n.read && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Notifications" showBack />
      <div className="page-container animate-fade-in">
        
        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </span>
            <div className="flex gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button 
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500"
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </div>
        )}

        {/* List of Notifications */}
        {notifications.length > 0 ? (
          <>
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterday)}
            {renderGroup('Older Alerts', older)}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 text-zinc-400">
              <Bell size={36} />
            </div>
            <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>No Notifications Yet</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              We'll let you know when you unlock badges, when pickups are scheduled, and when new eco-rewards drop.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

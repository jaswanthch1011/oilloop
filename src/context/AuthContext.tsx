import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Badge, Pickup, ScanResult, Redemption, Notification } from '../types';
import { ECO_LEVELS } from '../lib/constants';
import { mockBadges, mockNotifications } from '../data/mockData';
import { generateId } from '../lib/utils';
import { apiUrl } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, role?: 'user' | 'admin') => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  addPoints: (points: number) => void;
  spendPoints: (points: number) => boolean;
  addLiters: (liters: number) => void;
  addBadge: (badgeId: string) => void;
  pickups: Pickup[];
  addPickup: (pickup: Omit<Pickup, 'id' | 'createdAt'>) => void;
  updatePickupStatus: (id: string, status: Pickup['status']) => void;
  scanResults: ScanResult[];
  addScanResult: (result: Omit<ScanResult, 'id' | 'scannedAt'>) => void;
  redemptions: Redemption[];
  addRedemption: (redemption: Omit<Redemption, 'id' | 'redeemedAt'>) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  unreadCount: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_USER: User = {
  id: 'u1',
  name: 'Eco User',
  email: 'user@oilloop.in',
  phone: '9876543210',
  avatar: '🌿',
  role: 'user',
  ecoLevel: ECO_LEVELS[2],
  totalPoints: 2450,
  availablePoints: 1850,
  totalLitersRecycled: 49,
  badges: mockBadges.filter(b => !b.locked),
  referralCode: 'OILLOOP-ECO42',
  referralCount: 3,
  joinedAt: '2026-01-15',
  streak: 12,
};

function getStoredData<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredData('oilloop_user', null));
  const [pickups, setPickups] = useState<Pickup[]>(() => getStoredData('oilloop_pickups', []));
  const [scanResults, setScanResults] = useState<ScanResult[]>(() => getStoredData('oilloop_scans', []));
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => getStoredData('oilloop_redemptions', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => getStoredData('oilloop_notifications', mockNotifications));

  // Sync state to local storage as fallback
  useEffect(() => { if (user) localStorage.setItem('oilloop_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('oilloop_pickups', JSON.stringify(pickups)); }, [pickups]);
  useEffect(() => { localStorage.setItem('oilloop_scans', JSON.stringify(scanResults)); }, [scanResults]);
  useEffect(() => { localStorage.setItem('oilloop_redemptions', JSON.stringify(redemptions)); }, [redemptions]);
  useEffect(() => { localStorage.setItem('oilloop_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Fetch all user data from API helper
  const fetchAllData = async (userId: string, role: string) => {
    try {
      const [pRes, sRes, nRes, rRes] = await Promise.all([
        fetch(apiUrl(`/api/pickups?userId=${userId}&role=${role}`)),
        fetch(apiUrl(`/api/scans?userId=${userId}`)),
        fetch(apiUrl(`/api/notifications?userId=${userId}`)),
        fetch(apiUrl(`/api/redemptions?userId=${userId}`))
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setPickups(data.pickups);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        setScanResults(data.scans);
      }
      if (nRes.ok) {
        const data = await nRes.json();
        setNotifications(data.notifications);
      }
      if (rRes.ok) {
        const data = await rRes.json();
        setRedemptions(data.redemptions);
      }
    } catch (err) {
      console.warn('Error fetching backend data, using local state persistence:', err);
    }
  };

  // If user is already loaded, sync with backend on mount
  useEffect(() => {
    if (user) {
      fetchAllData(user.id, user.role);
    }
  }, []);

  const updateEcoLevel = (points: number): typeof ECO_LEVELS[0] => {
    for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
      if (points >= ECO_LEVELS[i].minPoints) return ECO_LEVELS[i];
    }
    return ECO_LEVELS[0];
  };

  const login = async (email: string, password: string, role?: 'user' | 'admin'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await fetchAllData(data.user.id, data.user.role);
        return true;
      }
    } catch (err) {
      console.warn('Login API failed, falling back to mock login:', err);
    }

    // Fallback Mock Login
    await new Promise(r => setTimeout(r, 800));
    if (role === 'admin' || email === 'admin@oilloop.in') {
      const adminUser = { ...DEFAULT_USER, id: 'admin1', email: email || 'admin@oilloop.in', role: 'admin' as const, name: 'Admin', avatar: '🛡️' };
      setUser(adminUser);
    } else {
      setUser({ ...DEFAULT_USER, email });
    }
    return true;
  };


  const signup = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await fetchAllData(data.user.id, data.user.role);
        return true;
      }
    } catch (err) {
      console.warn('Signup API failed, falling back to mock signup:', err);
    }

    // Fallback Mock Signup
    await new Promise(r => setTimeout(r, 800));
    setUser({
      ...DEFAULT_USER,
      id: generateId(),
      name,
      email,
      phone,
      totalPoints: 0,
      availablePoints: 0,
      totalLitersRecycled: 0,
      badges: [],
      ecoLevel: ECO_LEVELS[0],
      streak: 0,
      referralCount: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oilloop_user');
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return;
      }
    } catch (err) {
      console.warn('Profile Update API failed, using fallback:', err);
    }

    // Fallback
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const addPoints = (points: number) => {
    setUser(prev => {
      if (!prev) return null;
      const newTotal = prev.totalPoints + points;
      const newAvailable = prev.availablePoints + points;
      return { ...prev, totalPoints: newTotal, availablePoints: newAvailable, ecoLevel: updateEcoLevel(newTotal) };
    });
  };

  const spendPoints = (points: number): boolean => {
    if (!user || user.availablePoints < points) return false;
    setUser(prev => prev ? { ...prev, availablePoints: prev.availablePoints - points } : null);
    return true;
  };

  const addLiters = (liters: number) => {
    setUser(prev => prev ? { ...prev, totalLitersRecycled: prev.totalLitersRecycled + liters } : null);
  };

  const addBadge = (badgeId: string) => {
    const badge = mockBadges.find(b => b.id === badgeId);
    if (badge && user && !user.badges.find(b => b.id === badgeId)) {
      const unlockedBadge = { ...badge, locked: false, unlockedAt: new Date().toISOString() };
      setUser(prev => prev ? { ...prev, badges: [...prev.badges, unlockedBadge] } : null);
      addNotification({
        type: 'badge_unlock',
        title: `Badge Unlocked! ${badge.icon}`,
        message: `You earned the "${badge.name}" badge!`,
        read: false,
        icon: badge.icon,
      });
    }
  };

  const addPickup = async (pickup: Omit<Pickup, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pickup, userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPickups(prev => [data.pickup, ...prev]);
        await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Pickup API failed, using fallback:', err);
    }

    // Fallback
    const newPickup: Pickup = { ...pickup, id: generateId(), createdAt: new Date().toISOString() };
    setPickups(prev => [newPickup, ...prev]);
  };

  const updatePickupStatus = async (id: string, status: Pickup['status']) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPickups(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Update Pickup status API failed, using fallback:', err);
    }

    // Fallback
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const addScanResult = async (result: Omit<ScanResult, 'id' | 'scannedAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          brand: result.brand,
          oilType: result.oilType,
          volume: result.volume,
          points: result.pointsAwarded
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        setScanResults(prev => [data.scan, ...prev]);
        await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Scan API failed, using fallback:', err);
    }

    // Fallback
    const newResult: ScanResult = { ...result, id: generateId(), scannedAt: new Date().toISOString() };
    setScanResults(prev => [newResult, ...prev]);
  };

  const addRedemption = async (redemption: Omit<Redemption, 'id' | 'redeemedAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rewardId: redemption.rewardId,
          rewardName: redemption.rewardName,
          pointsSpent: redemption.pointsSpent
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        setRedemptions(prev => [data.redemption, ...prev]);
        await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Redemption API failed, using fallback:', err);
    }

    // Fallback
    const newRedemption: Redemption = { ...redemption, id: generateId(), redeemedAt: new Date().toISOString() };
    setRedemptions(prev => [newRedemption, ...prev]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = { ...notification, id: generateId(), createdAt: new Date().toISOString() };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        return;
      }
    } catch (err) {
      console.warn('Mark notification API failed, using fallback:', err);
    }

    // Fallback
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isAdmin: user?.role === 'admin',
      login, signup, logout, updateProfile,
      addPoints, spendPoints, addLiters, addBadge,
      pickups, addPickup, updatePickupStatus,
      scanResults, addScanResult,
      redemptions, addRedemption,
      notifications, markNotificationRead, addNotification, unreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

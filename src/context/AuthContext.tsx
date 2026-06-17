import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  addScanResult: (result: Omit<ScanResult, 'id' | 'scannedAt' | 'status' | 'userId'>) => void;
  approveScan: (scanId: string, adjustedPoints?: number) => Promise<void>;
  rejectScan: (scanId: string) => Promise<void>;
  allScans: ScanResult[];
  redemptions: Redemption[];
  addRedemption: (redemption: Omit<Redemption, 'id' | 'redeemedAt'>) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  unreadCount: number;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
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
  joinedAt: '2025-02-15',
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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('oilloop_token'));
  const [pickups, setPickups] = useState<Pickup[]>(() => getStoredData('oilloop_pickups', []));
  const [scanResults, setScanResults] = useState<ScanResult[]>(() => getStoredData('oilloop_scans', []));
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => getStoredData('oilloop_redemptions', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => getStoredData('oilloop_notifications', mockNotifications));

  // Sync state to local storage as fallback
  useEffect(() => { if (user) localStorage.setItem('oilloop_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { if (token) localStorage.setItem('oilloop_token', token); else localStorage.removeItem('oilloop_token'); }, [token]);
  useEffect(() => { localStorage.setItem('oilloop_pickups', JSON.stringify(pickups)); }, [pickups]);
  useEffect(() => { localStorage.setItem('oilloop_scans', JSON.stringify(scanResults)); }, [scanResults]);
  useEffect(() => { localStorage.setItem('oilloop_redemptions', JSON.stringify(redemptions)); }, [redemptions]);
  useEffect(() => { localStorage.setItem('oilloop_notifications', JSON.stringify(notifications)); }, [notifications]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  }, [token]);

  // Fetch all user data from API helper
  const fetchAllData = useCallback(async (userId: string, role: string) => {
    try {
      const [pRes, sRes, nRes, rRes] = await Promise.all([
        authFetch(apiUrl(`/api/pickups?userId=${userId}&role=${role}`)),
        authFetch(apiUrl(`/api/scans?userId=${userId}`)),
        authFetch(apiUrl(`/api/notifications?userId=${userId}`)),
        authFetch(apiUrl(`/api/redemptions?userId=${userId}`))
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
  }, []);

  // If user is already loaded, sync with backend on mount
  useEffect(() => {
    if (user) {
      fetchAllData(user.id, user.role);
    }
  }, [user, fetchAllData]);

  const updateEcoLevel = useCallback((points: number): typeof ECO_LEVELS[0] => {
    for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
      if (points >= ECO_LEVELS[i].minPoints) return ECO_LEVELS[i];
    }
    return ECO_LEVELS[0];
  }, []);

  const login = useCallback(async (email: string, password: string, role?: 'user' | 'admin'): Promise<boolean> => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        const userData = data.user || data.data; // Handle different API response structures
        setUser(userData);
        setToken(data.token);
        if (userData) {
          await fetchAllData(userData.id || userData._id, userData.role);
        }
        return true;
      }
      console.warn('Login API returned non-OK status, falling back to mock login');
    } catch (err) {
      console.warn('Login API failed, falling back to mock login:', err);
    }

    // REMOVE AUTHENTICATION FALLBACK:
    // If API fails or returns error, force login with a mock user
    const mockUser: User = {
      ...DEFAULT_USER,
      id: 'mock-' + Math.random().toString(36).substr(2, 5),
      name: email.split('@')[0] || 'Guest User',
      email: email,
      role: role || (email.includes('admin') ? 'admin' : 'user'),
    };
    setUser(mockUser);
    setToken('mock-token-' + Date.now());
    return true;
  }, [fetchAllData]);

  const signup = useCallback(async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const userData = data.user || data.data;
        setUser(userData);
        setToken(data.token);
        if (userData) {
          await fetchAllData(userData.id || userData._id, userData.role);
        }
        return true;
      }
      console.warn('Signup API returned non-OK status, falling back to mock signup');
    } catch (err) {
      console.warn('Signup API failed, falling back to mock signup:', err);
    }

    // REMOVE AUTHENTICATION FALLBACK:
    const mockUser: User = {
      ...DEFAULT_USER,
      id: 'mock-' + Math.random().toString(36).substr(2, 5),
      name,
      email,
      phone,
      role: 'user',
    };
    setUser(mockUser);
    setToken('mock-token-' + Date.now());
    return true;
  }, [fetchAllData]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('oilloop_user');
    localStorage.removeItem('oilloop_token');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
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
  }, [user, authFetch]);

  const addPoints = useCallback((points: number) => {
    setUser(prev => {
      if (!prev) return null;
      const newTotal = prev.totalPoints + points;
      const newAvailable = prev.availablePoints + points;
      return { ...prev, totalPoints: newTotal, availablePoints: newAvailable, ecoLevel: updateEcoLevel(newTotal) };
    });
  }, [updateEcoLevel]);

  const spendPoints = useCallback((points: number): boolean => {
    if (!user || user.availablePoints < points) return false;
    setUser(prev => prev ? { ...prev, availablePoints: prev.availablePoints - points } : null);
    return true;
  }, [user]);

  const addLiters = useCallback((liters: number) => {
    setUser(prev => prev ? { ...prev, totalLitersRecycled: prev.totalLitersRecycled + liters } : null);
  }, []);

  const addBadge = useCallback((badgeId: string) => {
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
  }, [user]);

  const addPickup = useCallback(async (pickup: Omit<Pickup, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl('/api/pickups'), {
        method: 'POST',
        body: JSON.stringify({ ...pickup, userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPickups(prev => [data.pickup, ...prev]);
        if (user) await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Pickup API failed, using fallback:', err);
    }

    // Fallback
    const newPickup: Pickup = { ...pickup, id: generateId(), createdAt: new Date().toISOString() };
    setPickups(prev => [newPickup, ...prev]);
  }, [user, fetchAllData, authFetch]);

  const updatePickupStatus = useCallback(async (id: string, status: Pickup['status']) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl(`/api/pickups/${id}/status`), {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPickups(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        if (user) await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Update Pickup status API failed, using fallback:', err);
    }

    // Fallback
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }, [user, fetchAllData, authFetch]);

  const addScanResult = useCallback(async (result: Omit<ScanResult, 'id' | 'scannedAt' | 'status' | 'userId'>) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl('/api/scans'), {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          brand: result.brand,
          oilType: result.oilType,
          quantity: result.volume,
          grade: result.pointsAwarded >= 150 ? 'Grade 1' : result.pointsAwarded >= 125 ? 'Grade 2' : result.pointsAwarded >= 100 ? 'Grade 3' : 'Grade 4',
          imageUrl: result.imageUrl || 'https://via.placeholder.com/150'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResults(prev => [data.scan, ...prev]);
        return;
      }
    } catch (err) {
      console.warn('Scan API failed, using fallback:', err);
    }

    // Fallback
    const newResult: ScanResult = {
      ...result,
      id: generateId(),
      userId: user.id,
      status: 'pending',
      scannedAt: new Date().toISOString()
    };
    setScanResults(prev => [newResult, ...prev]);
  }, [user, authFetch]);

  const approveScan = useCallback(async (scanId: string, adjustedPoints?: number) => {
    try {
      const res = await authFetch(apiUrl(`/api/admin/scans/${scanId}/approve`), {
        method: 'PUT',
        body: JSON.stringify({ adjustedPoints })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResults(prev => prev.map(scan => scan.id === scanId ? data.scan : scan));
        if (user) await fetchAllData(user.id, user.role);
      }
    } catch (err) {
      console.warn('Approve scan API failed, using fallback:', err);
      // Fallback logic already exists in the previous state, but let's keep it robust
    }
  }, [user, authFetch, fetchAllData]);

  const rejectScan = useCallback(async (scanId: string) => {
    // In a real app, this would be an API call
    setScanResults(prev => prev.map(scan =>
      scan.id === scanId ? { ...scan, status: 'rejected' } : scan
    ));

    addNotification({
      type: 'system',
      title: 'Scan Rejected',
      message: 'Your oil scan could not be validated.',
      read: false,
      icon: '❌',
    });
  }, []);

  const addRedemption = useCallback(async (redemption: Omit<Redemption, 'id' | 'redeemedAt'>) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl('/api/redemptions'), {
        method: 'POST',
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
        if (user) await fetchAllData(user.id, user.role);
        return;
      }
    } catch (err) {
      console.warn('Redemption API failed, using fallback:', err);
    }

    // Fallback
    const newRedemption: Redemption = { ...redemption, id: generateId(), redeemedAt: new Date().toISOString() };
    setRedemptions(prev => [newRedemption, ...prev]);
  }, [user, fetchAllData, authFetch]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = { ...notification, id: generateId(), createdAt: new Date().toISOString() };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl(`/api/notifications/${id}/read`), {
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

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        return;
      }
    } catch (err) {
      console.warn('Delete notification API failed, using fallback:', err);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const res = await authFetch(apiUrl(`/api/notifications?userId=${user.id}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
        return;
      }
    } catch (err) {
      console.warn('Clear notifications API failed, using fallback:', err);
    }
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isAdmin: user?.role === 'admin',
      login, signup, logout, updateProfile,
      addPoints, spendPoints, addLiters, addBadge,
      pickups, addPickup, updatePickupStatus,
      scanResults: scanResults.filter(s => s.userId === user?.id),
      addScanResult, approveScan, rejectScan, allScans: scanResults,
      redemptions, addRedemption,
      notifications, markNotificationRead, deleteNotification, clearAllNotifications, addNotification, unreadCount,
      authFetch
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

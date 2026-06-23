import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Badge, Pickup, ScanResult, Redemption, Notification, SupportTicket, TicketMessage } from '../types';
import { ECO_LEVELS } from '../lib/constants';
import { mockBadges, mockNotifications } from '../data/mockData';
import { generateId } from '../lib/utils';
import { apiUrl } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  login: (email: string, password: string, role?: 'user' | 'admin') => Promise<boolean>;
  guestLogin: () => void;
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
  tickets: SupportTicket[];
  addTicket: (subject: string, category: string, description: string) => void;
  updateTicketStatus: (id: string, status: SupportTicket['status']) => void;
  addTicketMessage: (ticketId: string, message: string) => void;
  registeredUsers: User[];
  updateUserPoints: (userId: string, totalPoints: number, availablePoints: number) => void;
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
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getStoredData('oilloop_tickets', [
    {
      id: 'tk-1',
      userId: 'u1',
      userName: 'Eco User',
      userEmail: 'user@oilloop.in',
      subject: 'Pickup container size query',
      category: 'Pickup',
      description: 'Can I use a 20L oil can for pickup instead of smaller containers?',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          senderName: 'Eco User',
          message: 'Can I use a 20L oil can for pickup instead of smaller containers?',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ]
    }
  ]));
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const users = getStoredData<User[]>('oilloop_registered_users', []);
    if (users.length === 0) {
      const initial = [DEFAULT_USER];
      localStorage.setItem('oilloop_registered_users', JSON.stringify(initial));
      return initial;
    }
    return users;
  });

  // Sync state to local storage as fallback
  useEffect(() => { if (user) localStorage.setItem('oilloop_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { if (token) localStorage.setItem('oilloop_token', token); else localStorage.removeItem('oilloop_token'); }, [token]);
  useEffect(() => { localStorage.setItem('oilloop_pickups', JSON.stringify(pickups)); }, [pickups]);
  useEffect(() => { localStorage.setItem('oilloop_scans', JSON.stringify(scanResults)); }, [scanResults]);
  useEffect(() => { localStorage.setItem('oilloop_redemptions', JSON.stringify(redemptions)); }, [redemptions]);
  useEffect(() => { localStorage.setItem('oilloop_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('oilloop_tickets', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('oilloop_registered_users', JSON.stringify(registeredUsers)); }, [registeredUsers]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    // Mock response for completely backend-free app
    return new Response(JSON.stringify({ success: true }));
  }, []);

  // Fetch all user data (no-op for completely backend-free app)
  const fetchAllData = useCallback(async (userId: string, role: string) => {
    // Mock fetch - does nothing since we persist with localStorage
  }, []);

  // No sync effect needed as everything is persistent locally
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
    // Admin login shortcut
    if (role === 'admin' || email.toLowerCase() === 'admin@frytofly.in') {
      const adminUser: User = {
        id: 'admin1',
        name: 'Admin',
        email: 'admin@frytofly.in',
        phone: '+91 99999 88888',
        avatar: '🛡️',
        role: 'admin',
        ecoLevel: ECO_LEVELS[0],
        totalPoints: 0,
        availablePoints: 0,
        totalLitersRecycled: 0,
        badges: [],
        referralCode: 'FRYTOFLY-ADMIN',
        referralCount: 0,
        joinedAt: new Date().toISOString(),
        streak: 0,
      };
      setUser(adminUser);
      setToken('mock-jwt-token-admin1');
      return true;
    }

    // Load registered users from local storage
    const localUsersStr = localStorage.getItem('oilloop_registered_users');
    const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];

    // Load passwords from local storage
    const passwordsStr = localStorage.getItem('oilloop_passwords');
    const passwords: Record<string, string> = passwordsStr ? JSON.parse(passwordsStr) : {};

    let existingUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // Demo mode: Bypass password check even if we have one stored
      // This ensures "Invalid Password" errors don't block the demo
    } else {
      // Create on the fly (demo mode)
      const name = email ? email.split('@')[0] : 'user';
      const id = 'mock-' + Math.random().toString(36).substr(2, 5);
      const referralCode = `FRYTOFLY-${name.toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

      existingUser = {
        ...DEFAULT_USER,
        id,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email || `${id}@guest.in`,
        phone: '99999' + Math.floor(10000 + Math.random() * 90000),
        role: 'user',
        ecoLevel: ECO_LEVELS[0],
        totalPoints: 0,
        availablePoints: 0,
        totalLitersRecycled: 0,
        badges: [],
        referralCode,
        referralCount: 0,
        joinedAt: new Date().toISOString(),
        streak: 0,
      };

      localUsers.push(existingUser);
      localStorage.setItem('oilloop_registered_users', JSON.stringify(localUsers));
      setRegisteredUsers(localUsers);

      // Store password for this new user
      passwords[email.toLowerCase()] = password;
      localStorage.setItem('oilloop_passwords', JSON.stringify(passwords));
    }

    setUser(existingUser);
    setToken('mock-jwt-token-' + existingUser.id);
    return true;
  }, []);

  const signup = useCallback(async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    const localUsersStr = localStorage.getItem('oilloop_registered_users');
    const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];

    const passwordsStr = localStorage.getItem('oilloop_passwords');
    const passwords: Record<string, string> = passwordsStr ? JSON.parse(passwordsStr) : {};

    const id = 'mock-' + Math.random().toString(36).substr(2, 5);
    const referralCode = `FRYTOFLY-${name.substring(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;

    const newUser: User = {
      ...DEFAULT_USER,
      id,
      name,
      email,
      phone,
      role: 'user',
      ecoLevel: ECO_LEVELS[0],
      totalPoints: 0,
      availablePoints: 0,
      totalLitersRecycled: 0,
      badges: [],
      referralCode,
      referralCount: 0,
      joinedAt: new Date().toISOString(),
      streak: 0,
    };

    localUsers.push(newUser);
    localStorage.setItem('oilloop_registered_users', JSON.stringify(localUsers));
    setRegisteredUsers(localUsers);

    // Store password
    passwords[email.toLowerCase()] = password;
    localStorage.setItem('oilloop_passwords', JSON.stringify(passwords));

    setUser(newUser);
    setToken('mock-jwt-token-' + id);
    return true;
  }, []);

  const guestLogin = useCallback(() => {
    const guestId = 'guest-' + Math.random().toString(36).substr(2, 8);
    const guestUser: User = {
      ...DEFAULT_USER,
      id: guestId,
      name: 'Guest User',
      email: `${guestId}@guest.frytofly.in`,
      phone: '',
      role: 'user',
      ecoLevel: ECO_LEVELS[0],
      totalPoints: 0,
      availablePoints: 0,
      totalLitersRecycled: 0,
      badges: [],
      referralCode: `GUEST-${guestId.slice(0, 6).toUpperCase()}`,
      referralCount: 0,
      joinedAt: new Date().toISOString(),
      streak: 0,
    };
    setUser(guestUser);
    setToken('guest-token-' + Date.now());
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('oilloop_user');
    localStorage.removeItem('oilloop_token');
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

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

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = { ...notification, id: 'n-' + generateId(), createdAt: new Date().toISOString() };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const addPickup = useCallback(async (pickup: Omit<Pickup, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newPickup: Pickup = { ...pickup, id: 'pk-' + generateId(), createdAt: new Date().toISOString(), status: 'scheduled' };
    setPickups(prev => [newPickup, ...prev]);

    // Send local notification
    addNotification({
      type: 'pickup_reminder',
      title: 'Pickup Scheduled 📅',
      message: `Your pickup is scheduled at ${pickup.locationName} on ${pickup.scheduledDate} at ${pickup.scheduledTime}.`,
      read: false,
      icon: '📅'
    });

    // Auto-generate a support ticket for this pickup order
    const ticketSubject = `Pickup Order — ${newPickup.id}`;
    const ticketDescription = `Pickup order has been placed successfully.\n\n` +
      `📍 Location: ${pickup.locationName}\n` +
      `📅 Date: ${pickup.scheduledDate}\n` +
      `🕐 Time: ${pickup.scheduledTime}\n` +
      `🛢️ Oil Type: ${pickup.oilType}\n` +
      `📦 Volume: ${pickup.estimatedVolume}L\n` +
      `📦 Containers: ${pickup.containers}\n\n` +
      `Order ID: ${newPickup.id}\n` +
      `Status: Scheduled\n\n` +
      `If you have any questions about this pickup, please reply here.`;

    const pickupTicket: SupportTicket = {
      id: 'tk-' + generateId(),
      userId: user.id,
      userName: user.name || 'User',
      userEmail: user.email || '',
      subject: ticketSubject,
      category: 'Pickup',
      description: ticketDescription,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + generateId(),
          sender: 'admin',
          senderName: 'FrytoFly System',
          message: `✅ Your pickup order ${newPickup.id} has been confirmed!\n\n` +
            `📍 ${pickup.locationName}\n` +
            `📅 ${pickup.scheduledDate} at ${pickup.scheduledTime}\n` +
            `🛢️ ${pickup.oilType} — ${pickup.estimatedVolume}L (${pickup.containers} container${pickup.containers > 1 ? 's' : ''})\n\n` +
            `Our collection team will be at the location during your scheduled slot. ` +
            `You can track the status of this order from your History page.\n\n` +
            `Need to reschedule or have questions? Just reply here!`,
          createdAt: new Date().toISOString(),
        }
      ]
    };
    setTickets(prev => [pickupTicket, ...prev]);
  }, [user, addNotification]);

  const updatePickupStatus = useCallback(async (id: string, status: Pickup['status']) => {
    if (!user) return;

    setPickups(prev => prev.map(p => {
      if (p.id !== id) return p;

      const statusInfo: Record<string, { title: string; msg: string; icon: string }> = {
        confirmed: { title: 'Pickup Confirmed! 📅', msg: `Your pickup ${id} has been confirmed. A collector will arrive at your slot.`, icon: '📅' },
        picked_up: { title: 'Oil Picked Up! 🚚', msg: `Your oil container for order ${id} was picked up and is headed to processing.`, icon: '🚚' },
        processed: { title: 'Oil Processed! ⛽', msg: `Success! Your recycled oil has been processed into high-quality biodiesel.`, icon: '⚡' },
        completed: { title: 'Order Completed! 🎉', msg: `Recycling order ${id} is officially complete. Thank you!`, icon: '🎉' }
      };

      if (statusInfo[status]) {
        const { title, msg, icon } = statusInfo[status];
        addNotification({
          type: 'system',
          title,
          message: msg,
          read: false,
          icon
        });
      }

      if (status === 'completed' || status === 'processed') {
        if (p.status !== 'completed' && p.status !== 'processed') {
          const oilGrades: Record<string, number> = {
            'Canola Oil': 150, 'Sunflower Oil': 150, 'Canola-dominant Generic Vegetable Oil': 150,
            'Soybean Oil': 125, 'Soy-dominant Generic Vegetable Oil': 125, 'Refined Rice Bran Oil': 125,
            'Palm Oil': 100, 'Coconut Oil': 100,
            'Crude Rice Bran Oil': 75, 'Animal Fats (Tallow, Lard)': 75, 'Heavily Degraded Restaurant Grease': 75
          };
          const basePoints = oilGrades[p.oilType] || 100;
          const pointsAwarded = Math.round(basePoints * p.estimatedVolume * 1.2);

          addPoints(pointsAwarded);
          addLiters(p.estimatedVolume);

          addNotification({
            type: 'reward_alert',
            title: 'Points Awarded! ⭐',
            message: `You received ${pointsAwarded} points for recycling ${p.estimatedVolume}L UCO!`,
            read: false,
            icon: '⭐'
          });

          if ((user.totalLitersRecycled + p.estimatedVolume) >= 10) {
            addBadge('b3');
          }
        }
      }

      return { ...p, status };
    }));
  }, [user, addPoints, addLiters, addBadge]);

  const addScanResult = useCallback(async (result: Omit<ScanResult, 'id' | 'scannedAt' | 'status' | 'userId'>) => {
    if (!user) return;

    const newResult: ScanResult = {
      ...result,
      id: 'sc-' + generateId(),
      userId: user.id,
      status: 'pending',
      scannedAt: new Date().toISOString()
    };
    setScanResults(prev => [newResult, ...prev]);

    addNotification({
      type: 'system',
      title: 'Scan Submitted 📸',
      message: `Your scan of ${result.brand} ${result.oilType} is pending validation.`,
      read: false,
      icon: '📸'
    });
  }, [user]);

  const approveScan = useCallback(async (scanId: string, adjustedPoints?: number) => {
    setScanResults(prev => prev.map(scan => {
      if (scan.id !== scanId) return scan;

      const pts = adjustedPoints !== undefined ? adjustedPoints : scan.pointsAwarded;

      // 1. Update points of the user who owns the scan in the registeredUsers list
      setRegisteredUsers(prevUsers => prevUsers.map(u => {
        if (u.id === scan.userId) {
          const newTotal = u.totalPoints + pts;
          const newAvailable = u.availablePoints + pts;
          const newLiters = u.totalLitersRecycled + scan.volume;
          const newStreak = u.streak + 1;
          const newEcoLevel = updateEcoLevel(newTotal);

          // Build updated badges array
          const updatedBadges = [...u.badges];
          if (!updatedBadges.some(b => b.id === 'b1')) {
            const b1 = mockBadges.find(b => b.id === 'b1');
            if (b1) updatedBadges.push({ ...b1, locked: false, unlockedAt: new Date().toISOString() });
          }
          if (newStreak >= 7 && !updatedBadges.some(b => b.id === 'b2')) {
            const b2 = mockBadges.find(b => b.id === 'b2');
            if (b2) updatedBadges.push({ ...b2, locked: false, unlockedAt: new Date().toISOString() });
          }
          if (newLiters >= 10 && !updatedBadges.some(b => b.id === 'b3')) {
            const b3 = mockBadges.find(b => b.id === 'b3');
            if (b3) updatedBadges.push({ ...b3, locked: false, unlockedAt: new Date().toISOString() });
          }

          return {
            ...u,
            totalPoints: newTotal,
            availablePoints: newAvailable,
            totalLitersRecycled: newLiters,
            streak: newStreak,
            ecoLevel: newEcoLevel,
            badges: updatedBadges
          };
        }
        return u;
      }));

      // 2. If the user who owns the scan is the currently logged in user, update user state
      if (user && scan.userId === user.id) {
        setUser(prevUser => {
          if (!prevUser) return null;
          const newTotal = prevUser.totalPoints + pts;
          const newAvailable = prevUser.availablePoints + pts;
          const newLiters = prevUser.totalLitersRecycled + scan.volume;
          const newStreak = prevUser.streak + 1;
          const newEcoLevel = updateEcoLevel(newTotal);

          // Build updated badges array
          const updatedBadges = [...prevUser.badges];
          if (!updatedBadges.some(b => b.id === 'b1')) {
            const b1 = mockBadges.find(b => b.id === 'b1');
            if (b1) updatedBadges.push({ ...b1, locked: false, unlockedAt: new Date().toISOString() });
          }
          if (newStreak >= 7 && !updatedBadges.some(b => b.id === 'b2')) {
            const b2 = mockBadges.find(b => b.id === 'b2');
            if (b2) updatedBadges.push({ ...b2, locked: false, unlockedAt: new Date().toISOString() });
          }
          if (newLiters >= 10 && !updatedBadges.some(b => b.id === 'b3')) {
            const b3 = mockBadges.find(b => b.id === 'b3');
            if (b3) updatedBadges.push({ ...b3, locked: false, unlockedAt: new Date().toISOString() });
          }

          return {
            ...prevUser,
            totalPoints: newTotal,
            availablePoints: newAvailable,
            totalLitersRecycled: newLiters,
            streak: newStreak,
            ecoLevel: newEcoLevel,
            badges: updatedBadges
          };
        });

        addNotification({
          type: 'reward_alert',
          title: 'Scan Approved! 🎉',
          message: `Your scan for ${scan.brand} has been approved. You earned ${pts} points!`,
          read: false,
          icon: '⭐'
        });
      } else {
        // Create notification for the user who owns the scan (since they aren't the active admin user)
        const newNotification: Notification = {
          id: 'n-' + generateId(),
          userId: scan.userId,
          type: 'reward_alert',
          title: 'Scan Approved! 🎉',
          message: `Your scan for ${scan.brand} has been approved. You earned ${pts} points!`,
          read: false,
          createdAt: new Date().toISOString(),
          icon: '⭐'
        };
        setNotifications(prev => [newNotification, ...prev]);
      }

      return { ...scan, status: 'approved', pointsAwarded: pts };
    }));
  }, [user, updateEcoLevel, addNotification]);

  const updateUserPoints = useCallback((userId: string, totalPoints: number, availablePoints: number) => {
    setRegisteredUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        return { ...u, totalPoints, availablePoints, ecoLevel: updateEcoLevel(totalPoints) };
      }
      return u;
    }));

    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, totalPoints, availablePoints, ecoLevel: updateEcoLevel(totalPoints) } : null);
    }

    // Add a notification for the user about direct points adjustment
    const newNotification: Notification = {
      id: 'n-' + generateId(),
      userId,
      type: 'reward_alert',
      title: 'Points Adjusted by Admin 🛡️',
      message: `Your points balance was adjusted. New total: ${totalPoints} XP, Available: ${availablePoints} XP.`,
      read: false,
      createdAt: new Date().toISOString(),
      icon: '⭐'
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [user, updateEcoLevel]);

  const rejectScan = useCallback(async (scanId: string) => {
    setScanResults(prev => prev.map(scan => {
      if (scan.id !== scanId) return scan;

      if (user && scan.userId === user.id) {
        addNotification({
          type: 'system',
          title: 'Scan Rejected ❌',
          message: `Your scan for ${scan.brand} UCO packet could not be validated.`,
          read: false,
          icon: '❌'
        });
      }
      return { ...scan, status: 'rejected' };
    }));
  }, [user]);

  const addRedemption = useCallback(async (redemption: Omit<Redemption, 'id' | 'redeemedAt'>) => {
    if (!user) return;
    if (user.availablePoints < redemption.pointsSpent) return;

    spendPoints(redemption.pointsSpent);

    const newRedemption: Redemption = { ...redemption, id: 'rd-' + generateId(), redeemedAt: new Date().toISOString() };
    setRedemptions(prev => [newRedemption, ...prev]);

    addNotification({
      type: 'reward_alert',
      title: 'Reward Redeemed! 🎁',
      message: `You redeemed "${redemption.rewardName}" for ${redemption.pointsSpent} points. It is now processing!`,
      read: false,
      icon: '🎁'
    });

    // Auto-generate a support ticket for this redemption order
    const redemptionTicket: SupportTicket = {
      id: 'tk-' + generateId(),
      userId: user.id,
      userName: user.name || 'User',
      userEmail: user.email || '',
      subject: `Reward Redemption — ${newRedemption.id}`,
      category: 'Redemption',
      description: `Reward redemption order has been placed successfully.\n\n🎁 Reward: ${redemption.rewardName}\n⭐ Points Spent: ${redemption.pointsSpent}\n📦 Order ID: ${newRedemption.id}\n📅 Date: ${new Date().toLocaleDateString()}\n🔄 Status: Processing\n\nIf you have any questions about your redemption, please reply here.`,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + generateId(),
          sender: 'admin',
          senderName: 'FrytoFly System',
          message: `🎁 Your redemption order ${newRedemption.id} has been confirmed!\n\n` +
            `✅ Reward: ${redemption.rewardName}\n` +
            `⭐ Points Deducted: ${redemption.pointsSpent}\n` +
            `🔄 Status: Processing\n\n` +
            `Your reward is now being processed and will be delivered within 3–5 business days. ` +
            `You can track the status of this order from your History page.\n\n` +
            `Have questions about delivery or need to make changes? Just reply here!`,
          createdAt: new Date().toISOString(),
        }
      ]
    };
    setTickets(prev => [redemptionTicket, ...prev]);
  }, [user, spendPoints, addNotification]);



  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const addTicket = useCallback((subject: string, category: string, description: string) => {
    if (!user) return;
    const newTicket: SupportTicket = {
      id: 'tk-' + generateId(),
      userId: user.id,
      userName: user.name || 'User',
      userEmail: user.email || '',
      subject,
      category,
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + generateId(),
          sender: 'user',
          senderName: user.name || 'User',
          message: description,
          createdAt: new Date().toISOString(),
        }
      ]
    };
    setTickets(prev => [newTicket, ...prev]);

    addNotification({
      type: 'system',
      title: 'Support Ticket Raised 🎫',
      message: `Your ticket "${subject}" has been successfully created.`,
      read: false,
      icon: '🎫'
    });
  }, [user, addNotification]);

  const updateTicketStatus = useCallback((id: string, status: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;

      if (user && t.userId === user.id) {
        addNotification({
          type: 'system',
          title: 'Ticket Status Updated 🎫',
          message: `Your ticket "${t.subject}" status is now ${status.replace('_', ' ')}.`,
          read: false,
          icon: '🎫'
        });
      }

      return { ...t, status };
    }));
  }, [user, addNotification]);

  const addTicketMessage = useCallback((ticketId: string, message: string) => {
    if (!user) return;
    const newMessage: TicketMessage = {
      id: 'msg-' + generateId(),
      sender: user.role === 'admin' ? 'admin' : 'user',
      senderName: user.name || (user.role === 'admin' ? 'Admin' : 'User'),
      message,
      createdAt: new Date().toISOString(),
    };

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;

      if (user.role === 'admin' && t.userId !== user.id) {
        addNotification({
          type: 'system',
          title: 'New Response on Ticket 💬',
          message: `Admin replied to your ticket: "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`,
          read: false,
          icon: '💬'
        });
      }

      return {
        ...t,
        messages: [...t.messages, newMessage],
        status: (user.role === 'admin' && t.status === 'open') ? 'in_progress' : t.status
      };
    }));
  }, [user, addNotification]);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isAdmin: user?.role === 'admin',
      isGuest: !!user?.id?.startsWith('guest-'),
      login, guestLogin, signup, logout, updateProfile,
      addPoints, spendPoints, addLiters, addBadge,
      pickups, addPickup, updatePickupStatus,
      scanResults: scanResults.filter(s => s.userId === user?.id),
      addScanResult, approveScan, rejectScan, allScans: scanResults,
      redemptions, addRedemption,
      notifications, markNotificationRead, deleteNotification, clearAllNotifications, addNotification, unreadCount,
      authFetch,
      tickets, addTicket, updateTicketStatus, addTicketMessage,
      registeredUsers, updateUserPoints
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

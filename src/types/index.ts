// ── User & Auth ──
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'user' | 'admin';
  ecoLevel: EcoLevel;
  totalPoints: number;
  availablePoints: number;
  totalLitersRecycled: number;
  badges: Badge[];
  referralCode: string;
  referralCount: number;
  joinedAt: string;
  streak: number;
}

export interface EcoLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  locked: boolean;
  requirement: string;
}

// ── Pickup ──
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  operatingHours: string;
  distance?: string;
  availableSlots: TimeSlot[];
  image: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface Pickup {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'confirmed' | 'picked_up' | 'processed' | 'completed';
  estimatedVolume: number;
  oilType: string;
  containers: number;
  pointsAwarded?: number;
  createdAt: string;
}

// ── Scan ──
export interface ScanResult {
  id: string;
  userId: string;
  brand: string;
  oilType: string;
  volume: number;
  confidence: number;
  pointsAwarded: number;
  status: 'pending' | 'approved' | 'rejected';
  scannedAt: string;
  imageUrl?: string;
}

export interface OilBrand {
  name: string;
  types: string[];
  volumes: number[];
  pointsMultiplier: number;
}

// ── Rewards ──
export interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'groceries' | 'personal_care' | 'home' | 'eco';
  pointsCost: number;
  image: string;
  available: boolean;
  featured: boolean;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'pending' | 'delivered' | 'used';
}

// ── Impact ──
export interface ImpactData {
  totalLiters: number;
  co2Saved: number;
  biodieselGenerated: number;
  totalPoints: number;
  monthlyData: MonthlyImpact[];
}

export interface MonthlyImpact {
  month: string;
  liters: number;
  co2: number;
  biodiesel: number;
  points: number;
}

// ── Notifications ──
export interface Notification {
  id: string;
  userId?: string;
  type: 'pickup_reminder' | 'reward_alert' | 'badge_unlock' | 'system' | 'referral';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  icon: string;
}

// ── Admin ──
export interface AdminStats {
  totalUsers: number;
  totalLiters: number;
  activePickups: number;
  totalRedemptions: number;
  userGrowth: { date: string; users: number }[];
  dailyCollection: { date: string; liters: number }[];
  ordersByLocation: { location: string; orders: number; liters: number }[];
}

// ── Leaderboard ──
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  points: number;
  liters: number;
  level: EcoLevel;
  isCurrentUser?: boolean;
}

// ── Support Tickets ──
export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  messages: TicketMessage[];
}


import type { Location, Reward, Badge, Notification, LeaderboardEntry } from '../types';
import { ECO_LEVELS } from '../lib/constants';

export const mockLocations: Location[] = [
  {
    id: 'loc1',
    name: 'GreenDrop Hub — Jubilee Hills',
    address: '42, Road No. 10, Jubilee Hills',
    city: 'Hyderabad',
    lat: 17.4326,
    lng: 78.4071,
    operatingHours: '8:00 AM – 6:00 PM',
    distance: '1.2 km',
    image: '',
    availableSlots: [
      { id: 's1', date: '2026-06-10', time: '09:00 AM', available: true },
      { id: 's2', date: '2026-06-10', time: '11:00 AM', available: true },
      { id: 's3', date: '2026-06-10', time: '02:00 PM', available: false },
      { id: 's4', date: '2026-06-11', time: '09:00 AM', available: true },
      { id: 's5', date: '2026-06-11', time: '11:00 AM', available: true },
      { id: 's6', date: '2026-06-12', time: '10:00 AM', available: true },
    ],
  },
  {
    id: 'loc2',
    name: 'EcoCollect Center — Banjara Hills',
    address: '15, Road No. 3, Banjara Hills',
    city: 'Hyderabad',
    lat: 17.4156,
    lng: 78.4347,
    operatingHours: '9:00 AM – 5:00 PM',
    distance: '2.8 km',
    image: '',
    availableSlots: [
      { id: 's7', date: '2026-06-10', time: '10:00 AM', available: true },
      { id: 's8', date: '2026-06-10', time: '01:00 PM', available: true },
      { id: 's9', date: '2026-06-11', time: '10:00 AM', available: true },
      { id: 's10', date: '2026-06-12', time: '09:00 AM', available: true },
    ],
  },
  {
    id: 'loc3',
    name: 'BioCycle Point — Madhapur',
    address: '78, Ayyappa Society, Madhapur',
    city: 'Hyderabad',
    lat: 17.4486,
    lng: 78.3908,
    operatingHours: '7:00 AM – 7:00 PM',
    distance: '3.5 km',
    image: '',
    availableSlots: [
      { id: 's11', date: '2026-06-10', time: '08:00 AM', available: true },
      { id: 's12', date: '2026-06-10', time: '12:00 PM', available: true },
      { id: 's13', date: '2026-06-11', time: '03:00 PM', available: true },
      { id: 's14', date: '2026-06-12', time: '11:00 AM', available: true },
    ],
  },
  {
    id: 'loc4',
    name: 'OilReclaim Depot — Gachibowli',
    address: '23, Biodiversity Junction, Gachibowli',
    city: 'Hyderabad',
    lat: 17.4401,
    lng: 78.3489,
    operatingHours: '8:00 AM – 8:00 PM',
    distance: '5.1 km',
    image: '',
    availableSlots: [
      { id: 's15', date: '2026-06-10', time: '09:00 AM', available: true },
      { id: 's16', date: '2026-06-11', time: '02:00 PM', available: true },
      { id: 's17', date: '2026-06-12', time: '10:00 AM', available: true },
    ],
  },
  {
    id: 'loc5',
    name: 'GreenLoop Station — Kondapur',
    address: '56, Botanical Garden Rd, Kondapur',
    city: 'Hyderabad',
    lat: 17.4633,
    lng: 78.3525,
    operatingHours: '9:00 AM – 6:00 PM',
    distance: '4.3 km',
    image: '',
    availableSlots: [
      { id: 's18', date: '2026-06-10', time: '10:00 AM', available: true },
      { id: 's19', date: '2026-06-11', time: '11:00 AM', available: true },
      { id: 's20', date: '2026-06-12', time: '09:00 AM', available: true },
    ],
  },
];

export const mockRewards: Reward[] = [
  { id: 'r1', name: 'Organic Rice (1 kg)', description: 'Premium organic basmati rice', category: 'groceries', pointsCost: 200, image: '🍚', available: true, featured: true },
  { id: 'r2', name: 'Natural Soap Set', description: 'Handcrafted herbal soap collection', category: 'personal_care', pointsCost: 150, image: '🧼', available: true, featured: true },
  { id: 'r3', name: 'Bamboo Toothbrush Pack', description: 'Eco-friendly bamboo toothbrushes (3 pack)', category: 'eco', pointsCost: 100, image: '🪥', available: true, featured: false },
  { id: 'r4', name: 'Reusable Shopping Bag', description: 'Premium jute carry bag', category: 'eco', pointsCost: 75, image: '👜', available: true, featured: true },
  { id: 'r5', name: 'Green Tea Collection', description: 'Assorted green tea flavors (25 bags)', category: 'groceries', pointsCost: 180, image: '🍵', available: true, featured: false },
  { id: 'r6', name: 'Plant Seed Kit', description: 'Herb garden starter kit with 5 seed varieties', category: 'home', pointsCost: 120, image: '🌱', available: true, featured: false },
  { id: 'r7', name: 'Organic Honey (500g)', description: 'Pure raw forest honey', category: 'groceries', pointsCost: 250, image: '🍯', available: true, featured: true },
  { id: 'r8', name: 'Coconut Oil (500ml)', description: 'Cold-pressed virgin coconut oil', category: 'personal_care', pointsCost: 160, image: '🥥', available: true, featured: false },
  { id: 'r9', name: 'Biodegradable Plates (25)', description: 'Areca leaf disposable plates', category: 'home', pointsCost: 90, image: '🍽️', available: true, featured: false },
  { id: 'r10', name: 'Steel Water Bottle', description: 'Insulated stainless steel 750ml bottle', category: 'eco', pointsCost: 300, image: '🫗', available: true, featured: true },
  { id: 'r11', name: 'Aloe Vera Moisturizer', description: 'Natural aloe vera face cream', category: 'personal_care', pointsCost: 130, image: '🧴', available: true, featured: false },
  { id: 'r12', name: 'Compost Bin (Mini)', description: 'Desktop composting kit for kitchen waste', category: 'home', pointsCost: 350, image: '🪴', available: true, featured: false },
];

export const mockBadges: Badge[] = [
  { id: 'b1', name: 'First Drop', description: 'Complete your first oil scan', icon: '💧', locked: false, unlockedAt: '2026-05-15', requirement: 'Scan 1 oil packet' },
  { id: 'b2', name: 'Weekly Warrior', description: 'Maintain a 7-day recycling streak', icon: '⚔️', locked: false, unlockedAt: '2026-05-22', requirement: '7-day streak' },
  { id: 'b3', name: 'Liter Legend', description: 'Recycle 10 liters of cooking oil', icon: '🏆', locked: false, unlockedAt: '2026-06-01', requirement: '10L recycled' },
  { id: 'b4', name: 'Community Champion', description: 'Refer 5 friends to OilLoop', icon: '👑', locked: true, requirement: '5 referrals' },
  { id: 'b5', name: 'Century Club', description: 'Complete 100 oil scans', icon: '💯', locked: true, requirement: '100 scans' },
  { id: 'b6', name: 'Eco Ambassador', description: 'Share your impact on social media', icon: '🌟', locked: true, requirement: 'Share on social' },
  { id: 'b7', name: 'Green Streak', description: 'Maintain a 30-day recycling streak', icon: '🔥', locked: true, requirement: '30-day streak' },
  { id: 'b8', name: 'Half-Ton Hero', description: 'Save 500 kg of CO₂', icon: '🦸', locked: true, requirement: '500 kg CO₂ saved' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'badge_unlock', title: 'Badge Unlocked! 🏆', message: 'You earned the "Liter Legend" badge for recycling 10L of oil!', read: false, createdAt: '2026-06-08T10:30:00', icon: '🏆' },
  { id: 'n2', type: 'pickup_reminder', title: 'Pickup Tomorrow', message: 'Your scheduled pickup at GreenDrop Hub is tomorrow at 09:00 AM.', read: false, createdAt: '2026-06-08T08:00:00', icon: '📅' },
  { id: 'n3', type: 'reward_alert', title: 'New Reward Available!', message: 'Steel Water Bottle is now available for 300 points. Redeem before stock runs out!', read: true, createdAt: '2026-06-07T14:00:00', icon: '🎁' },
  { id: 'n4', type: 'system', title: 'Welcome to Level 3! 🌳', message: "You've reached Tree level. Keep going to unlock Forest level at 2001 points!", read: true, createdAt: '2026-06-06T12:00:00', icon: '🌳' },
  { id: 'n5', type: 'referral', title: 'Referral Bonus!', message: 'Your friend Priya joined OilLoop using your code. You earned 100 bonus points!', read: true, createdAt: '2026-06-05T09:30:00', icon: '🎉' },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u10', name: 'Aditi Sharma', avatar: '🌍', points: 8750, liters: 175, level: ECO_LEVELS[4] },
  { rank: 2, userId: 'u11', name: 'Rahul Verma', avatar: '🌳', points: 6200, liters: 124, level: ECO_LEVELS[4] },
  { rank: 3, userId: 'u12', name: 'Priya Nair', avatar: '🦋', points: 5100, liters: 102, level: ECO_LEVELS[4] },
  { rank: 4, userId: 'u1', name: 'You', avatar: '🌿', points: 2450, liters: 49, level: ECO_LEVELS[3], isCurrentUser: true },
  { rank: 5, userId: 'u13', name: 'Vikram Reddy', avatar: '♻️', points: 2100, liters: 42, level: ECO_LEVELS[3] },
  { rank: 6, userId: 'u14', name: 'Sneha Patel', avatar: '🌻', points: 1800, liters: 36, level: ECO_LEVELS[2] },
  { rank: 7, userId: 'u15', name: 'Arjun Das', avatar: '💧', points: 1500, liters: 30, level: ECO_LEVELS[2] },
  { rank: 8, userId: 'u16', name: 'Meera Iyer', avatar: '🐝', points: 1200, liters: 24, level: ECO_LEVELS[2] },
  { rank: 9, userId: 'u17', name: 'Karthik M', avatar: '⚡', points: 900, liters: 18, level: ECO_LEVELS[2] },
  { rank: 10, userId: 'u18', name: 'Divya S', avatar: '🍃', points: 650, liters: 13, level: ECO_LEVELS[2] },
];

export const mockMonthlyData = [
  { month: 'Jan', liters: 5, co2: 12.5, biodiesel: 4.25, points: 250 },
  { month: 'Feb', liters: 7, co2: 17.5, biodiesel: 5.95, points: 350 },
  { month: 'Mar', liters: 4, co2: 10, biodiesel: 3.4, points: 200 },
  { month: 'Apr', liters: 9, co2: 22.5, biodiesel: 7.65, points: 450 },
  { month: 'May', liters: 12, co2: 30, biodiesel: 10.2, points: 600 },
  { month: 'Jun', liters: 12, co2: 30, biodiesel: 10.2, points: 600 },
];

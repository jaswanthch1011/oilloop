import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.db');

let db;

export async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      role TEXT,
      ecoLevel TEXT,
      totalPoints INTEGER,
      availablePoints INTEGER,
      totalLitersRecycled REAL,
      badges TEXT,
      referralCode TEXT UNIQUE,
      referralCount INTEGER,
      joinedAt TEXT,
      streak INTEGER
    );

    CREATE TABLE IF NOT EXISTS pickups (
      id TEXT PRIMARY KEY,
      userId TEXT,
      locationId TEXT,
      locationName TEXT,
      address TEXT,
      scheduledDate TEXT,
      scheduledTime TEXT,
      oilType TEXT,
      estimatedVolume REAL,
      containers INTEGER,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      userId TEXT,
      brand TEXT,
      oilType TEXT,
      volume REAL,
      points INTEGER,
      scannedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      rewardId TEXT,
      rewardName TEXT,
      pointsSpent INTEGER,
      status TEXT,
      redeemedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      read INTEGER,
      createdAt TEXT,
      icon TEXT
    );
  `);

  // Check if we need to seed the database
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    // Seed initial users
    await db.run(
      `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'admin1',
        'Admin',
        'admin@oilloop.in',
        '+91 99999 88888',
        'admin',
        '🛡️',
        'admin',
        JSON.stringify({ level: 5, name: 'Planet Saver', icon: '🌍', minPoints: 5001 }),
        10000,
        10000,
        250.0,
        JSON.stringify([]),
        'OILLOOP-ADMIN',
        0,
        '2026-01-01',
        0
      ]
    );

    await db.run(
      `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'u1',
        'Eco User',
        'user@oilloop.in',
        '9876543210',
        'password',
        '🌿',
        'user',
        JSON.stringify({ level: 3, name: 'Tree', icon: '🌳', minPoints: 501 }),
        2450,
        1850,
        49.0,
        JSON.stringify([
          { id: 'b1', name: 'First Drop', description: 'Complete your first oil scan', icon: '💧', locked: false, unlockedAt: '2026-05-15', requirement: 'Scan 1 oil packet' },
          { id: 'b2', name: 'Weekly Warrior', description: 'Maintain a 7-day recycling streak', icon: '⚔️', locked: false, unlockedAt: '2026-05-22', requirement: '7-day streak' },
          { id: 'b3', name: 'Liter Legend', description: 'Recycle 10 liters of cooking oil', icon: '🏆', locked: false, unlockedAt: '2026-06-01', requirement: '10L recycled' }
        ]),
        'OILLOOP-ECO42',
        3,
        '2026-01-15',
        12
      ]
    );

    // Seed initial pickups
    await db.run(
      `INSERT INTO pickups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'pk1',
        'u1',
        'loc1',
        'GreenDrop Hub — Jubilee Hills',
        '42, Road No. 10, Jubilee Hills',
        '2026-06-10',
        '09:00 AM',
        'sunflower',
        3.5,
        2,
        'scheduled',
        '2026-06-08T10:00:00.000Z'
      ]
    );

    await db.run(
      `INSERT INTO pickups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'pk2',
        'u1',
        'loc2',
        'EcoCollect Center — Banjara Hills',
        '15, Road No. 3, Banjara Hills',
        '2026-05-20',
        '10:00 AM',
        'mustard',
        5.0,
        1,
        'completed',
        '2026-05-18T10:00:00.000Z'
      ]
    );

    // Seed initial scans
    await db.run(
      `INSERT INTO scans VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'sc1',
        'u1',
        'Fortune',
        'sunflower',
        1.0,
        60,
        '2026-06-07T11:30:00.000Z'
      ]
    );

    // Seed initial redemptions
    await db.run(
      `INSERT INTO redemptions VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'rd1',
        'u1',
        'r1',
        'Organic Rice (1 kg)',
        200,
        'delivered',
        '2026-05-25T14:20:00.000Z'
      ]
    );

    // Seed initial notifications
    const initialNotifications = [
      { id: 'n1', userId: 'u1', type: 'badge_unlock', title: 'Badge Unlocked! 🏆', message: 'You earned the "Liter Legend" badge for recycling 10L of oil!', read: 0, createdAt: '2026-06-08T10:30:00.000Z', icon: '🏆' },
      { id: 'n2', userId: 'u1', type: 'pickup_reminder', title: 'Pickup Tomorrow', message: 'Your scheduled pickup at GreenDrop Hub is tomorrow at 09:00 AM.', read: 0, createdAt: '2026-06-08T08:00:00.000Z', icon: '📅' },
      { id: 'n3', userId: 'u1', type: 'reward_alert', title: 'New Reward Available!', message: 'Steel Water Bottle is now available for 300 points. Redeem before stock runs out!', read: 1, createdAt: '2026-06-07T14:00:00.000Z', icon: '🎁' },
      { id: 'n4', userId: 'u1', type: 'system', title: 'Welcome to Level 3! 🌳', message: "You've reached Tree level. Keep going to unlock Forest level at 2001 points!", read: 1, createdAt: '2026-06-06T12:00:00.000Z', icon: '🌳' },
      { id: 'n5', userId: 'u1', type: 'referral', title: 'Referral Bonus!', message: 'Your friend Priya joined OilLoop using your code. You earned 100 bonus points!', read: 1, createdAt: '2026-06-05T09:30:00.000Z', icon: '🎉' }
    ];

    for (const n of initialNotifications) {
      await db.run(
        `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.userId, n.type, n.title, n.message, n.read, n.createdAt, n.icon]
      );
    }
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

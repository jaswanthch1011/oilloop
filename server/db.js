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
        'frytofly',
        '🛡️',
        'admin',
        JSON.stringify({ level: 1, name: 'Seedling', icon: '🌱', minPoints: 0 }),
        0,
        0,
        0.0,
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
        JSON.stringify({ level: 1, name: 'Seedling', icon: '🌱', minPoints: 0 }),
        0,
        0,
        0.0,
        JSON.stringify([]),
        'OILLOOP-ECO42',
        0,
        '2026-01-15',
        0
      ]
    );

    // Seed initial notifications
    const initialNotifications = [
      { id: 'n1', userId: 'u1', type: 'system', title: 'Welcome to OilLoop! 🌱', message: 'Start your recycling journey by scanning your first oil container.', read: 0, createdAt: new Date().toISOString(), icon: '🌱' },
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

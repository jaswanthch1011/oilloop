import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json());

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Eco Levels constants matching the frontend
const ECO_LEVELS = [
  { level: 1, name: 'Seedling', icon: '🌱', minPoints: 0 },
  { level: 2, name: 'Sprout', icon: '🌿', minPoints: 101 },
  { level: 3, name: 'Tree', icon: '🌳', minPoints: 501 },
  { level: 4, name: 'Forest', icon: '🏔️', minPoints: 2001 },
  { level: 5, name: 'Planet Saver', icon: '🌍', minPoints: 5001 }
];

const updateEcoLevel = (points) => {
  for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVELS[i].minPoints) return ECO_LEVELS[i];
  }
  return ECO_LEVELS[0];
};

// ─── AUTH ENDPOINTS ───

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const db = getDb();
    const exists = await db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (exists) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    const referralCode = `OILLOOP-${name.substring(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    const id = generateId();
    const ecoLevel = JSON.stringify(ECO_LEVELS[0]);
    const badges = JSON.stringify([]);

    await db.run(
      `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0.0, ?, ?, 0, ?, 0)`,
      [id, name, email, phone, password, '🌿', 'user', ecoLevel, badges, referralCode, new Date().toISOString().split('T')[0]]
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    user.ecoLevel = JSON.parse(user.ecoLevel);
    user.badges = JSON.parse(user.badges);
    delete user.password;

    res.status(201).json({ user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const db = getDb();
    let user;
    if (role === 'admin' || email === 'admin@oilloop.in') {
      user = await db.get('SELECT * FROM users WHERE email = "admin@oilloop.in" AND role = "admin"');
    } else {
      user = await db.get('SELECT * FROM users WHERE email = ? AND role = "user"', [email]);
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.ecoLevel = JSON.parse(user.ecoLevel);
    user.badges = JSON.parse(user.badges);
    delete user.password;

    res.json({ user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/auth/login-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp !== '123456') {
    return res.status(400).json({ error: 'Invalid OTP. Use 123456 for demo' });
  }

  try {
    const db = getDb();
    let user = await db.get('SELECT * FROM users WHERE phone = ? AND role = "user"', [phone]);
    
    if (!user) {
      const referralCode = `OILLOOP-PHONE${Math.floor(10 + Math.random() * 90)}`;
      const id = generateId();
      await db.run(
        `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0.0, ?, ?, 0, ?, 1)`,
        [id, 'Phone User', `${phone}@oilloop.in`, phone, 'password', '🌿', 'user', JSON.stringify(ECO_LEVELS[0]), JSON.stringify([]), referralCode, new Date().toISOString().split('T')[0]]
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    user.ecoLevel = JSON.parse(user.ecoLevel);
    user.badges = JSON.parse(user.badges);
    delete user.password;

    res.json({ user });
  } catch (err) {
    console.error('OTP login error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── USER PROFILE ENDPOINTS ───

app.put('/api/user/profile', async (req, res) => {
  const { userId, name, email, phone, avatar } = req.body;

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) await db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    if (email !== undefined) await db.run('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    if (phone !== undefined) await db.run('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
    if (avatar !== undefined) await db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    updatedUser.ecoLevel = JSON.parse(updatedUser.ecoLevel);
    updatedUser.badges = JSON.parse(updatedUser.badges);
    delete updatedUser.password;

    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── PICKUP ENDPOINTS ───

app.get('/api/pickups', async (req, res) => {
  const { userId, role } = req.query;

  try {
    const db = getDb();
    let pickups;
    if (role === 'admin') {
      pickups = await db.all('SELECT * FROM pickups ORDER BY createdAt DESC');
    } else {
      pickups = await db.all('SELECT * FROM pickups WHERE userId = ? ORDER BY createdAt DESC', [userId]);
    }
    res.json({ pickups });
  } catch (err) {
    console.error('Get pickups error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/pickups', async (req, res) => {
  // Extract correct keys sent by SchedulePickupPage
  const { userId, locationId, locationName, scheduledDate, scheduledTime, oilType, estimatedVolume, containers } = req.body;
  
  if (!userId || !locationId || !locationName || !scheduledDate || !scheduledTime || !oilType || estimatedVolume === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Address lookup helper matching data locations
  const locations = {
    loc1: '42, Road No. 10, Jubilee Hills',
    loc2: '15, Road No. 3, Banjara Hills',
    loc3: '78, Ayyappa Society, Madhapur',
    loc4: '23, Biodiversity Junction, Gachibowli',
    loc5: '56, Botanical Garden Rd, Kondapur',
  };
  const address = locations[locationId] || 'Jubilee Hills Hub, Hyderabad';

  try {
    const db = getDb();
    const id = 'pk-' + generateId();
    await db.run(
      `INSERT INTO pickups VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        locationId,
        locationName,
        address,
        scheduledDate,
        scheduledTime,
        oilType,
        parseFloat(estimatedVolume),
        parseInt(containers) || 1,
        'scheduled',
        new Date().toISOString()
      ]
    );

    // Send notification
    const nId = 'n-' + generateId();
    await db.run(
      `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nId, userId, 'pickup_reminder', 'Pickup Scheduled 📅', `Your pickup is scheduled at ${locationName} on ${scheduledDate} at ${scheduledTime}.`, 0, new Date().toISOString(), '📅']
    );

    const newPickup = await db.get('SELECT * FROM pickups WHERE id = ?', [id]);
    res.status(201).json({ pickup: newPickup });
  } catch (err) {
    console.error('Schedule pickup error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.put('/api/pickups/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const db = getDb();
    const pickup = await db.get('SELECT * FROM pickups WHERE id = ?', [id]);
    if (!pickup) {
      return res.status(404).json({ error: 'Pickup not found' });
    }

    await db.run('UPDATE pickups SET status = ? WHERE id = ?', [status, id]);

    if (status === 'completed') {
      const user = await db.get('SELECT * FROM users WHERE id = ?', [pickup.userId]);
      if (user) {
        const basePoints = Math.round(pickup.estimatedVolume * 50);
        const pointsAwarded = Math.round(basePoints * 1.2);
        
        const newTotal = user.totalPoints + pointsAwarded;
        const newAvailable = user.availablePoints + pointsAwarded;
        const newLiters = user.totalLitersRecycled + pickup.estimatedVolume;
        const newEcoLevel = updateEcoLevel(newTotal);

        const currentBadges = JSON.parse(user.badges);
        if (newLiters >= 10 && !currentBadges.some(b => b.id === 'b3')) {
          currentBadges.push({ id: 'b3', name: 'Liter Legend', description: 'Recycle 10 liters of cooking oil', icon: '🏆', locked: false, unlockedAt: new Date().toISOString(), requirement: '10L recycled' });
          await db.run(
            `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['n-' + generateId(), user.id, 'badge_unlock', 'Badge Unlocked! 🏆', 'You earned the "Liter Legend" badge for recycling 10L of oil!', 0, new Date().toISOString(), '🏆']
          );
        }

        await db.run(
          'UPDATE users SET totalPoints = ?, availablePoints = ?, totalLitersRecycled = ?, ecoLevel = ?, badges = ? WHERE id = ?',
          [newTotal, newAvailable, newLiters, JSON.stringify(newEcoLevel), JSON.stringify(currentBadges), user.id]
        );

        // Notification
        await db.run(
          `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['n-' + generateId(), user.id, 'reward_alert', 'Points Awarded! ⭐', `You received ${pointsAwarded} points for recycling ${pickup.estimatedVolume}L UCO!`, 0, new Date().toISOString(), '⭐']
        );
      }
    }

    const updatedPickup = await db.get('SELECT * FROM pickups WHERE id = ?', [id]);
    res.json({ pickup: updatedPickup });
  } catch (err) {
    console.error('Update pickup status error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── SCAN ENDPOINTS ───

app.get('/api/scans', async (req, res) => {
  const { userId } = req.query;

  try {
    const db = getDb();
    const scans = await db.all('SELECT * FROM scans WHERE userId = ? ORDER BY scannedAt DESC', [userId]);
    res.json({ scans });
  } catch (err) {
    console.error('Get scans error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/scans', async (req, res) => {
  const { userId, brand, oilType, volume, points } = req.body;
  if (!userId || !brand || !oilType || !volume || points === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();
    const id = 'sc-' + generateId();
    await db.run(
      `INSERT INTO scans VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, brand, oilType, parseFloat(volume), parseInt(points), new Date().toISOString()]
    );
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    let updatedUser = null;
    if (user) {
      const newTotal = user.totalPoints + parseInt(points);
      const newAvailable = user.availablePoints + parseInt(points);
      const newLiters = user.totalLitersRecycled + parseFloat(volume);
      const newStreak = user.streak + 1;
      const newEcoLevel = updateEcoLevel(newTotal);

      const currentBadges = JSON.parse(user.badges);
      // First Drop
      if (!currentBadges.some(b => b.id === 'b1')) {
        currentBadges.push({ id: 'b1', name: 'First Drop', description: 'Complete your first oil scan', icon: '💧', locked: false, unlockedAt: new Date().toISOString(), requirement: 'Scan 1 oil packet' });
        await db.run(
          `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['n-' + generateId(), user.id, 'badge_unlock', 'Badge Unlocked! 💧', 'You earned the "First Drop" badge for your first oil scan!', 0, new Date().toISOString(), '💧']
        );
      }
      // Weekly Warrior
      if (newStreak >= 7 && !currentBadges.some(b => b.id === 'b2')) {
        currentBadges.push({ id: 'b2', name: 'Weekly Warrior', description: 'Maintain a 7-day recycling streak', icon: '⚔️', locked: false, unlockedAt: new Date().toISOString(), requirement: '7-day streak' });
        await db.run(
          `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['n-' + generateId(), user.id, 'badge_unlock', 'Badge Unlocked! ⚔️', 'You earned the "Weekly Warrior" badge for a 7-day streak!', 0, new Date().toISOString(), '⚔️']
        );
      }
      // Liter Legend
      if (newLiters >= 10 && !currentBadges.some(b => b.id === 'b3')) {
        currentBadges.push({ id: 'b3', name: 'Liter Legend', description: 'Recycle 10 liters of cooking oil', icon: '🏆', locked: false, unlockedAt: new Date().toISOString(), requirement: '10L recycled' });
        await db.run(
          `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['n-' + generateId(), user.id, 'badge_unlock', 'Badge Unlocked! 🏆', 'You earned the "Liter Legend" badge for recycling 10L of oil!', 0, new Date().toISOString(), '🏆']
        );
      }

      await db.run(
        'UPDATE users SET totalPoints = ?, availablePoints = ?, totalLitersRecycled = ?, ecoLevel = ?, badges = ?, streak = ? WHERE id = ?',
        [newTotal, newAvailable, newLiters, JSON.stringify(newEcoLevel), JSON.stringify(currentBadges), newStreak, user.id]
      );

      // Notification
      await db.run(
        `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['n-' + generateId(), user.id, 'reward_alert', 'Scanned Successfully! 📷', `You earned ${points} points for scanning ${brand} ${oilType} (${volume}L).`, 0, new Date().toISOString(), '📷']
      );

      updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      updatedUser.ecoLevel = JSON.parse(updatedUser.ecoLevel);
      updatedUser.badges = JSON.parse(updatedUser.badges);
      delete updatedUser.password;
    }
    const newScan = await db.get('SELECT * FROM scans WHERE id = ?', [id]);
    res.status(201).json({ scan: newScan, user: updatedUser });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── REDEMPTIONS ENDPOINTS ───

app.get('/api/redemptions', async (req, res) => {
  const { userId } = req.query;

  try {
    const db = getDb();
    const redemptions = await db.all('SELECT * FROM redemptions WHERE userId = ? ORDER BY redeemedAt DESC', [userId]);
    res.json({ redemptions });
  } catch (err) {
    console.error('Get redemptions error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/redemptions', async (req, res) => {
  const { userId, rewardId, rewardName, pointsSpent } = req.body;
  if (!userId || !rewardId || !rewardName || !pointsSpent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || user.availablePoints < pointsSpent) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const newAvailable = user.availablePoints - pointsSpent;
    await db.run('UPDATE users SET availablePoints = ? WHERE id = ?', [newAvailable, userId]);

    const id = 'rd-' + generateId();
    await db.run(
      `INSERT INTO redemptions VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, rewardId, rewardName, parseInt(pointsSpent), 'processing', new Date().toISOString()]
    );

    // Notification
    await db.run(
      `INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['n-' + generateId(), userId, 'reward_alert', 'Reward Redeemed! 🎁', `You redeemed "${rewardName}" for ${pointsSpent} points. It is now processing!`, 0, new Date().toISOString(), '🎁']
    );

    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    updatedUser.ecoLevel = JSON.parse(updatedUser.ecoLevel);
    updatedUser.badges = JSON.parse(updatedUser.badges);
    delete updatedUser.password;

    const newRedemption = await db.get('SELECT * FROM redemptions WHERE id = ?', [id]);
    res.status(201).json({ redemption: newRedemption, user: updatedUser });
  } catch (err) {
    console.error('Redeem error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── NOTIFICATIONS ENDPOINTS ───

app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;

  try {
    const db = getDb();
    const notifications = await db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', [userId]);
    const mapped = notifications.map(n => ({ ...n, read: !!n.read }));
    res.json({ notifications: mapped });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDb();
    await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    const notification = await db.get('SELECT * FROM notifications WHERE id = ?', [id]);
    if (notification) notification.read = !!notification.read;
    res.json({ notification });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDb();
    await db.run('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── CHATBOT API ENDPOINT ───

const knowledgeBase = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy', 'greetings'],
  pickup: ['pickup', 'pick up', 'schedule', 'collect', 'collection', 'drop off', 'dropoff', 'when', 'time slot'],
  scan: ['scan', 'camera', 'detect', 'recognize', 'ai', 'image', 'packet', 'bottle', 'brand'],
  points: ['point', 'earn', 'score', 'balance', 'how many points', 'reward point'],
  rewards: ['reward', 'redeem', 'gift', 'marketplace', 'product', 'buy', 'shop'],
  impact: ['impact', 'co2', 'carbon', 'biodiesel', 'environment', 'eco', 'green', 'save', 'planet', 'recycle'],
  badges: ['badge', 'achievement', 'level', 'tier', 'eco-level', 'ecolevel', 'seedling', 'sprout', 'forest'],
  referral: ['refer', 'invite', 'friend', 'code', 'share', 'referral'],
  account: ['account', 'profile', 'password', 'email', 'phone', 'settings', 'avatar', 'name', 'login'],
  help: ['help', 'support', 'contact', 'problem', 'issue', 'bug', 'error', 'complaint'],
  oil: ['oil', 'cooking oil', 'used oil', 'uco', 'sunflower', 'mustard', 'coconut', 'quantity', 'liter', 'volume'],
  leaderboard: ['leaderboard', 'rank', 'ranking', 'top', 'competition', 'compete', 'leader'],
  admin: ['admin', 'dashboard', 'manage', 'analytics', 'statistics', 'admin dashboard'],
};

const responses = {
  greeting: [
    "Hello! 🌿 Welcome to OilLoop! I'm your eco-assistant. How can I help you today?",
    "Hey there! ♻️ I'm here to help you with anything about recycling cooking oil. What would you like to know?",
    "Hi! 🌱 Great to see you! Ask me anything about pickups, scanning, rewards, or your eco impact!",
  ],
  pickup: [
    "📅 **Scheduling a Pickup is easy!**\n\n1. Go to the **Pickup** tab\n2. Choose a collection location near you\n3. Select an available date & time slot\n4. Enter your oil details (type, volume, containers)\n5. Confirm and you're done!\n\nWe have 5 collection points across Hyderabad with slots from 7 AM to 8 PM. Need help finding the nearest one?",
    "🚛 **Pickup Info:**\n\n• **Minimum quantity:** 0.5 liters\n• **Reschedule:** Up to 2 hours before\n• **Status tracking:** Real-time in History tab\n• **Containers:** Any clean, sealed container works\n\nYour oil goes through: Collection → Filtration → Quality Testing → Biodiesel Production!",
  ],
  scan: [
    "📸 **AI Oil Scan Feature:**\n\nOur smart scanner uses image recognition to identify:\n• **Brand** (Fortune, Saffola, Dhara, etc.)\n• **Oil Type** (Sunflower, Mustard, Coconut, etc.)\n• **Volume** (0.5L to 15L)\n\nJust point your camera at the oil packet and tap scan! If auto-detection doesn't work, you can always enter details manually.\n\n💡 **Tip:** Good lighting helps the AI scan faster!",
  ],
  points: [
    "⭐ **How Points Work:**\n\n• **Base rate:** 50 points per liter of UCO\n• **Brand multipliers:** Up to 1.5x boost!\n• **Referral bonus:** 100 pts per friend who joins\n• **Streak bonus:** Extra points for consecutive days\n\n**Quick calculation:**\n1L of Fortune Sunflower Oil = 50 × 1.2 = **60 points**\n5L of Saffola Rice Bran = 250 × 1.3 = **325 points**\n\nPoints are valid for 12 months from earning date.",
  ],
  rewards: [
    "🎁 **Rewards Marketplace:**\n\nRedeem your points for real products!\n\n**Categories:**\n• 🛒 **Groceries** — Organic rice, honey, green tea\n• 🧴 **Personal Care** — Natural soaps, moisturizers\n• 🏠 **Home** — Plant kits, compost bins, biodegradable plates\n• 🌿 **Eco Products** — Bamboo brushes, steel bottles, jute bags\n\nNew items added every week! Deliveries take 3-5 business days.",
  ],
  impact: [
    "🌍 **Your Eco Impact Matters!**\n\nHere's what happens with every liter:\n• **2.5 kg CO₂** saved vs fossil diesel\n• **0.85 liters biodiesel** produced\n• **50+ points** earned\n\nCheck your personal impact dashboard for real-time stats including liters recycled, CO₂ saved, and biodiesel generated. Every drop counts! 💧",
  ],
  badges: [
    "🏆 **Badges & Eco-Levels:**\n\n**Eco-Levels (5 tiers):**\n🌱 Seedling (0-100 pts)\n🌿 Sprout (101-500 pts)\n🌳 Tree (501-2000 pts)\n🏔️ Forest (2001-5000 pts)\n🌍 Planet Saver (5001+ pts)\n\n**Badges to unlock:**\n💧 First Drop — First scan\n⚔️ Weekly Warrior — 7-day streak\n🏆 Liter Legend — 10L recycled\n👑 Community Champion — 5 referrals\n💯 Century Club — 100 scans\n🌟 Eco Ambassador — Share on social",
  ],
  referral: [
    "🤝 **Referral Program:**\n\n1. Find your unique code in Profile\n2. Share it with friends via link or social media\n3. When they sign up & complete first scan:\n   • **You** get 100 bonus points\n   • **They** get 100 bonus points\n\nNo limit on referrals! Top referrers can unlock the **Community Champion** badge at 5 referrals. 🎉",
  ],
  account: [
    "👤 **Account Management:**\n\n• **Edit profile:** Profile tab → tap any field to edit\n• **Change avatar:** Tap your avatar → choose from eco icons\n• **Theme:** Toggle dark/light mode in Settings\n• **Notifications:** Customize in Profile → Settings\n• **Delete account:** Profile → Settings → Delete Account\n\nYour data is encrypted and never shared with third parties. 🔒",
  ],
  help: [
    "📞 **Need More Help?**\n\nI'm here to assist! Here are your support options:\n\n• **This chatbot** — Ask me anything!\n• **FAQ section** — Detailed answers to common questions\n• **Email:** support@oilloop.in\n• **Phone:** +91 1800-OIL-LOOP\n• **Response time:** Within 24 hours\n\nWhat specific issue are you facing? I'll try my best to help! 🌿",
  ],
  oil: [
    "🫙 **About Used Cooking Oil:**\n\n**Accepted types:**\nSunflower, Mustard, Coconut, Groundnut, Soybean, Palm, Olive, Rice Bran, Sesame, Canola\n\n**Tips for collection:**\n• Let oil cool completely before storing\n• Use any clean, sealed container\n• Don't mix with water or food waste\n• Strain out food particles if possible\n\n**Minimum quantity:** 0.5 liters\n**No maximum limit!** The more you recycle, the bigger your impact! 🌍",
  ],
  leaderboard: [
    "📊 **Leaderboard:**\n\nCompete with fellow eco-warriors!\n\n• **Weekly, Monthly, All-time** rankings\n• Top 3 get a special podium display 🥇🥈🥉\n• Your rank is always highlighted\n• Rankings based on total points earned\n\nClimb the leaderboard by scanning more oil, maintaining streaks, and referring friends!",
  ],
  admin: [
    "🛡️ **Admin Dashboard:**\n\nAdmin access includes:\n• **Overview metrics** — Total users, liters, active pickups\n• **Analytics charts** — Orders by location, daily collection, user growth\n• **Order management** — Search, sort, update pickup statuses\n• **Location management** — Add/edit collection points\n\nTo access admin features, log in with the Admin role from the login page.",
  ],
};

function classifyMessage(message) {
  const lower = message.toLowerCase().trim();
  let bestMatch = '';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(knowledgeBase)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch || 'unknown';
}

function getChatbotResponse(category) {
  if (category === 'unknown' || !responses[category]) {
    return defaultResponse[Math.floor(Math.random() * defaultResponse.length)];
  }
  const options = responses[category];
  return options[Math.floor(Math.random() * options.length)];
}

app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const category = classifyMessage(message);
  const response = getChatbotResponse(category);

  res.json({ response });
});

// Start server after connecting to database
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`OilLoop Express API server running with SQLite database on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize SQLite database', err);
});

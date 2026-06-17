import express from 'express';
import cors from 'cors';
import { initDb, User, Pickup, Scan, Redemption, Notification } from './db.js';

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

// ── CONSTANTS ──

const ECO_LEVELS = [
  { level: 1, name: 'Seedling', icon: '🌱', minPoints: 0, maxPoints: 100 },
  { level: 2, name: 'Sprout', icon: '🌿', minPoints: 101, maxPoints: 500 },
  { level: 3, name: 'Tree', icon: '🌳', minPoints: 501, maxPoints: 2000 },
  { level: 4, name: 'Forest', icon: '🏔️', minPoints: 2001, maxPoints: 5000 },
  { level: 5, name: 'Planet Saver', icon: '🌍', minPoints: 5001, maxPoints: 99999 }
];

const MASTER_BADGES = [
  { id: 'b1', name: 'First Drop', description: 'Complete your first oil scan', icon: '💧', requirement: 'Scan 1 oil packet' },
  { id: 'b2', name: 'Weekly Warrior', description: 'Maintain a 7-day recycling streak', icon: '⚔️', requirement: '7-day streak' },
  { id: 'b3', name: 'Liter Legend', description: 'Recycle 10 liters of cooking oil', icon: '🏆', requirement: '10L recycled' },
  { id: 'b4', name: 'Community Champion', description: 'Refer 5 friends to OilLoop', icon: '👑', requirement: '5 referrals' },
  { id: 'b5', name: 'Century Club', description: 'Complete 100 oil scans', icon: '💯', requirement: '100 scans' },
  { id: 'b6', name: 'Eco Ambassador', description: 'Share your impact on social media', icon: '🌟', requirement: 'Share on social' },
  { id: 'b7', name: 'Green Streak', description: 'Maintain a 30-day recycling streak', icon: '🔥', requirement: '30-day streak' },
  { id: 'b8', name: 'Half-Ton Hero', description: 'Save 500 kg of CO₂', icon: '🦸', requirement: '500 kg CO₂ saved' },
];

const OIL_GRADES = {
  GRADE_1: { points: 150, types: ['Canola Oil', 'Sunflower Oil', 'Canola-dominant Generic Vegetable Oil'] },
  GRADE_2: { points: 125, types: ['Soybean Oil', 'Soy-dominant Generic Vegetable Oil', 'Refined Rice Bran Oil'] },
  GRADE_3: { points: 100, types: ['Palm Oil', 'Coconut Oil'] },
  GRADE_4: { points: 75, types: ['Crude Rice Bran Oil', 'Animal Fats (Tallow, Lard)', 'Heavily Degraded Restaurant Grease'] },
};

// ── HELPERS ──

const generateId = () => Math.random().toString(36).substring(2, 9);

const getPointsPerLiter = (oilType) => {
  if (OIL_GRADES.GRADE_1.types.includes(oilType)) return OIL_GRADES.GRADE_1.points;
  if (OIL_GRADES.GRADE_2.types.includes(oilType)) return OIL_GRADES.GRADE_2.points;
  if (OIL_GRADES.GRADE_3.types.includes(oilType)) return OIL_GRADES.GRADE_3.points;
  if (OIL_GRADES.GRADE_4.types.includes(oilType)) return OIL_GRADES.GRADE_4.points;
  return 100;
};

const updateEcoLevel = (points) => {
  for (let i = ECO_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVELS[i].minPoints) return ECO_LEVELS[i];
  }
  return ECO_LEVELS[0];
};

const mapUserResponse = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  delete user.__v;
  delete user._id;

  // Map badge IDs to full objects
  user.badges = (user.badges || []).map(badgeId => {
    const master = MASTER_BADGES.find(b => b.id === badgeId);
    if (!master) return { id: badgeId, name: 'Unknown', icon: '❔', locked: false };
    return {
      ...master,
      locked: false,
      unlockedAt: user.joinedAt instanceof Date ? user.joinedAt.toISOString() : new Date().toISOString()
    };
  });

  return user;
};

// ─── AUTH ENDPOINTS ───

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    const referralCode = `OILLOOP-${name.substring(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    const id = generateId();

    const user = await User.create({
      id,
      name,
      email,
      phone,
      password,
      avatar: '🌿',
      role: 'user',
      ecoLevel: ECO_LEVELS[0],
      badges: [],
      referralCode,
      joinedAt: new Date()
    });

    res.status(201).json({
      user: mapUserResponse(user),
      token: 'mock-jwt-token-' + id
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;
    if (role === 'admin' || email === 'admin@frytofly.in') {
      user = await User.findOne({ email: 'admin@frytofly.in', role: 'admin' });
    } else {
      user = await User.findOne({ email, role: 'user' });

      // If user doesn't exist, create a guest user automatically (Removing Authentication)
      if (!user) {
        const name = email ? email.split('@')[0] : 'user';
        const id = generateId();
        const referralCode = `GUEST-${name.toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

        user = await User.create({
          id,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email: email || `${id}@guest.in`,
          phone: '99999' + Math.floor(10000 + Math.random() * 90000),
          password: password || 'nopassword',
          avatar: '🌿',
          role: 'user',
          ecoLevel: ECO_LEVELS[0],
          badges: [],
          referralCode,
          joinedAt: new Date()
        });
      }
    }

    // Bypass password check for demo/open access
    res.json({
      user: mapUserResponse(user),
      token: 'mock-jwt-token-' + user.id
    });
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
    let user = await User.findOne({ phone, role: 'user' });
    
    if (!user) {
      const referralCode = `OILLOOP-PHONE${Math.floor(10 + Math.random() * 90)}`;
      const id = generateId();
      user = await User.create({
        id,
        name: 'Phone User',
        email: `${phone}@oilloop.in`,
        phone,
        password: 'password',
        avatar: '🌿',
        role: 'user',
        ecoLevel: ECO_LEVELS[0],
        badges: [],
        referralCode,
        joinedAt: new Date(),
        streak: 1
      });
    }

    res.json({ user: mapUserResponse(user) });
  } catch (err) {
    console.error('OTP login error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── USER PROFILE ENDPOINTS ───

app.put('/api/user/profile', async (req, res) => {
  const { userId, name, email, phone, avatar } = req.body;

  try {
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({ user: mapUserResponse(user) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── PICKUP ENDPOINTS ───

app.get('/api/pickups', async (req, res) => {
  const { userId, role } = req.query;

  try {
    let pickups;
    if (role === 'admin') {
      pickups = await Pickup.find().sort({ createdAt: -1 });
    } else {
      pickups = await Pickup.find({ userId }).sort({ createdAt: -1 });
    }
    res.json({ pickups });
  } catch (err) {
    console.error('Get pickups error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.post('/api/pickups', async (req, res) => {
  const { userId, locationId, locationName, scheduledDate, scheduledTime, oilType, estimatedVolume, containers } = req.body;
  
  if (!userId || !locationId || !locationName || !scheduledDate || !scheduledTime || !oilType || estimatedVolume === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const locations = {
    loc1: '42, Road No. 10, Jubilee Hills',
    loc2: '15, Road No. 3, Banjara Hills',
    loc3: '78, Ayyappa Society, Madhapur',
    loc4: '23, Biodiversity Junction, Gachibowli',
    loc5: '56, Botanical Garden Rd, Kondapur',
  };
  const address = locations[locationId] || 'Jubilee Hills Hub, Hyderabad';

  try {
    const id = 'pk-' + generateId();
    const newPickup = await Pickup.create({
      id,
      userId,
      locationId,
      locationName,
      address,
      scheduledDate,
      scheduledTime,
      oilType,
      estimatedVolume: parseFloat(estimatedVolume),
      containers: parseInt(containers) || 1,
      status: 'scheduled',
      createdAt: new Date()
    });

    // Send notification
    const nId = 'n-' + generateId();
    await Notification.create({
      id: nId,
      userId,
      type: 'pickup_reminder',
      title: 'Pickup Scheduled 📅',
      message: `Your pickup is scheduled at ${locationName} on ${scheduledDate} at ${scheduledTime}.`,
      read: false,
      createdAt: new Date(),
      icon: '📅'
    });

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
    const pickup = await Pickup.findOne({ id });
    if (!pickup) {
      return res.status(404).json({ error: 'Pickup not found' });
    }

    pickup.status = status;
    await pickup.save();

    // Send status update notification to user
    const statusInfo = {
      confirmed: { title: 'Pickup Confirmed! 📅', msg: `Your pickup ${id} has been confirmed. A collector will arrive at your slot.`, icon: '📅' },
      picked_up: { title: 'Oil Picked Up! 🚚', msg: `Your oil container for order ${id} was picked up and is headed to processing.`, icon: '🚚' },
      processed: { title: 'Oil Processed! ⛽', msg: `Success! Your recycled oil has been processed into high-quality biodiesel.`, icon: '⚡' },
      completed: { title: 'Order Completed! 🎉', msg: `Recycling order ${id} is officially complete. Thank you!`, icon: '🎉' }
    };

    if (statusInfo[status]) {
      const { title, msg, icon } = statusInfo[status];
      await Notification.create({
        id: 'n-' + generateId(),
        userId: pickup.userId,
        type: 'system',
        title,
        message: msg,
        read: false,
        createdAt: new Date(),
        icon
      });
    }

    if (status === 'completed') {
      const user = await User.findOne({ id: pickup.userId });
      if (user) {
        const basePoints = getPointsPerLiter(pickup.oilType);
        const pointsAwarded = Math.round(basePoints * pickup.estimatedVolume * 1.2); // 1.2x multiplier for confirmed pickups
        
        user.totalPoints += pointsAwarded;
        user.availablePoints += pointsAwarded;
        user.totalLitersRecycled += pickup.estimatedVolume;
        user.ecoLevel = updateEcoLevel(user.totalPoints);

        if (user.totalLitersRecycled >= 10 && !user.badges.includes('b3')) {
          user.badges.push('b3');
          await Notification.create({
            id: 'n-' + generateId(),
            userId: user.id,
            type: 'badge_unlock',
            title: 'Badge Unlocked! 🏆',
            message: 'You earned the "Liter Legend" badge for recycling 10L of oil!',
            read: false,
            createdAt: new Date(),
            icon: '🏆'
          });
        }

        await user.save();

        await Notification.create({
          id: 'n-' + generateId(),
          userId: user.id,
          type: 'reward_alert',
          title: 'Points Awarded! ⭐',
          message: `You received ${pointsAwarded} points for recycling ${pickup.estimatedVolume}L UCO!`,
          read: false,
          createdAt: new Date(),
          icon: '⭐'
        });
      }
    }

    res.json({ pickup });
  } catch (err) {
    console.error('Update pickup status error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── SCAN ENDPOINTS ───

app.get('/api/scans', async (req, res) => {
  const { userId } = req.query;

  try {
    const scans = await Scan.find({ userId }).sort({ scannedAt: -1 });
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
    const id = 'sc-' + generateId();
    const newScan = await Scan.create({
      id,
      userId,
      brand,
      oilType,
      volume: parseFloat(volume),
      points: parseInt(points),
      scannedAt: new Date()
    });
    
    const user = await User.findOne({ id: userId });
    let updatedUser = null;
    if (user) {
      user.totalPoints += parseInt(points);
      user.availablePoints += parseInt(points);
      user.totalLitersRecycled += parseFloat(volume);
      user.streak += 1;
      user.ecoLevel = updateEcoLevel(user.totalPoints);

      if (!user.badges.includes('b1')) {
        user.badges.push('b1');
        await Notification.create({
          id: 'n-' + generateId(),
          userId: user.id,
          type: 'badge_unlock',
          title: 'Badge Unlocked! 💧',
          message: 'You earned the "First Drop" badge for your first oil scan!',
          read: false,
          createdAt: new Date(),
          icon: '💧'
        });
      }

      if (user.streak >= 7 && !user.badges.includes('b2')) {
        user.badges.push('b2');
        await Notification.create({
          id: 'n-' + generateId(),
          userId: user.id,
          type: 'badge_unlock',
          title: 'Badge Unlocked! ⚔️',
          message: 'You earned the "Weekly Warrior" badge for a 7-day streak!',
          read: false,
          createdAt: new Date(),
          icon: '⚔️'
        });
      }

      if (user.totalLitersRecycled >= 10 && !user.badges.includes('b3')) {
        user.badges.push('b3');
        await Notification.create({
          id: 'n-' + generateId(),
          userId: user.id,
          type: 'badge_unlock',
          title: 'Badge Unlocked! 🏆',
          message: 'You earned the "Liter Legend" badge for recycling 10L of oil!',
          read: false,
          createdAt: new Date(),
          icon: '🏆'
        });
      }

      await user.save();

      await Notification.create({
        id: 'n-' + generateId(),
        userId: user.id,
        type: 'reward_alert',
        title: 'Scanned Successfully! 📷',
        message: `You earned ${points} points for scanning ${brand} ${oilType} (${volume}L).`,
        read: false,
        createdAt: new Date(),
        icon: '📷'
      });

      updatedUser = mapUserResponse(user);
    }
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
    const redemptions = await Redemption.find({ userId }).sort({ redeemedAt: -1 });
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
    const user = await User.findOne({ id: userId });
    if (!user || user.availablePoints < pointsSpent) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    user.availablePoints -= pointsSpent;
    await user.save();

    const id = 'rd-' + generateId();
    const newRedemption = await Redemption.create({
      id,
      userId,
      rewardId,
      rewardName,
      pointsSpent: parseInt(pointsSpent),
      status: 'processing',
      redeemedAt: new Date()
    });

    await Notification.create({
      id: 'n-' + generateId(),
      userId,
      type: 'reward_alert',
      title: 'Reward Redeemed! 🎁',
      message: `You redeemed "${rewardName}" for ${pointsSpent} points. It is now processing!`,
      read: false,
      createdAt: new Date(),
      icon: '🎁'
    });

    res.status(201).json({ redemption: newRedemption, user: mapUserResponse(user) });
  } catch (err) {
    console.error('Redeem error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ─── NOTIFICATIONS ENDPOINTS ───

app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate({ id }, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Notification.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.delete('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'UserId required' });

  try {
    await Notification.deleteMany({ userId });
    res.json({ success: true });
  } catch (err) {
    console.error('Clear notifications error:', err);
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

const defaultResponse = [
  "🤔 I'm not sure I understand that. Let me help you with what I know about!\n\nTry asking about:\n• 📅 Scheduling pickups\n• 📸 Oil scanning\n• ⭐ Earning points\n• 🎁 Rewards & redemptions\n• 🌍 Environmental impact\n• 🏆 Badges & levels\n• 👤 Account settings\n\nOr you can visit our **FAQ section** for detailed answers!",
  "Hmm, I didn't quite catch that. 🤖\n\nHere are some things I can help with:\n• How to schedule a pickup\n• How the AI scan works\n• Points and rewards system\n• Your eco impact\n• Account & profile settings\n\nFeel free to ask in your own words!",
];

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

// ─── LEADERBOARD & ADMIN STATS ENDPOINTS ───

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      name: u.name,
      avatar: u.avatar || '👤',
      points: u.totalPoints,
      liters: u.totalLitersRecycled,
      level: u.ecoLevel,
    }));
    res.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });

    const litersResult = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: null, sum: { $sum: '$totalLitersRecycled' } } }
    ]);
    const totalLiters = litersResult[0]?.sum || 0;

    const activePickups = await Pickup.countDocuments({ status: { $in: ['scheduled', 'confirmed', 'picked_up'] } });
    const completedPickups = await Pickup.countDocuments({ status: 'completed' });
    const totalRedemptions = await Redemption.countDocuments();

    // Daily Collection Chart data (last 7 days)
    const dailyCollectionRaw = await Pickup.aggregate([
      { $match: { status: { $in: ['completed', 'processed', 'picked_up'] } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          liters: { $sum: "$estimatedVolume" }
      } },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    
    const dailyCollection = dailyCollectionRaw.reverse().map(row => ({
      date: new Date(row._id).toLocaleDateString('en', { day: '2-digit', month: 'short' }),
      liters: row.liters
    }));

    if (dailyCollection.length === 0) {
      const today = new Date().toLocaleDateString('en', { day: '2-digit', month: 'short' });
      dailyCollection.push({ date: today, liters: 0 });
    }

    // Orders by location
    const locationStats = await Pickup.aggregate([
      { $group: {
          _id: { locationId: "$locationId", locationName: "$locationName" },
          orders: { $sum: 1 },
          liters: { $sum: "$estimatedVolume" }
      } }
    ]);

    const ordersByLocation = locationStats.map(loc => ({
      location: loc._id.locationName.split('—')[1]?.trim() || loc._id.locationName.slice(0, 12),
      orders: loc.orders,
      liters: loc.liters || 0
    }));

    // User growth
    const userGrowthRaw = await User.aggregate([
      { $match: { role: "user" } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$joinedAt" } },
          count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);

    let runningTotal = 0;
    const userGrowth = userGrowthRaw.map(row => {
      runningTotal += row.count;
      return {
        date: new Date(row._id).toLocaleDateString('en', { day: '2-digit', month: 'short' }),
        users: runningTotal
      };
    });

    if (userGrowth.length === 0) {
      const today = new Date().toLocaleDateString('en', { day: '2-digit', month: 'short' });
      userGrowth.push({ date: today, users: 0 });
    }

    res.json({
      totalUsers,
      totalLiters,
      activePickups,
      completedPickups,
      totalRedemptions,
      userGrowth,
      dailyCollection,
      ordersByLocation
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// Start server after connecting to database
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`FrytoFly Express API server running with MongoDB database on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize MongoDB database', err);
});

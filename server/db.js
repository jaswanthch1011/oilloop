import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oilloop';

// ── SCHEMAS ──

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '🌿' },
  role: { type: String, default: 'user' },
  ecoLevel: {
    level: { type: Number, default: 1 },
    name: { type: String, default: 'Seedling' },
    icon: { type: String, default: '🌱' },
    minPoints: { type: Number, default: 0 }
  },
  totalPoints: { type: Number, default: 0 },
  availablePoints: { type: Number, default: 0 },
  totalLitersRecycled: { type: Number, default: 0 },
  badges: [String],
  referralCode: { type: String, unique: true },
  referralCount: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  streak: { type: Number, default: 0 }
});

const PickupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  locationId: String,
  locationName: String,
  address: String,
  scheduledDate: String,
  scheduledTime: String,
  oilType: String,
  estimatedVolume: Number,
  containers: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const ScanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  brand: String,
  oilType: String,
  volume: Number,
  points: Number,
  scannedAt: { type: Date, default: Date.now }
});

const RedemptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  rewardId: String,
  rewardName: String,
  pointsSpent: Number,
  status: { type: String, default: 'completed' },
  redeemedAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  type: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  icon: String
});

// ── MODELS ──

export const User = mongoose.model('User', UserSchema);
export const Pickup = mongoose.model('Pickup', PickupSchema);
export const Scan = mongoose.model('Scan', ScanSchema);
export const Redemption = mongoose.model('Redemption', RedemptionSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);

// ── CONNECTION ──

export async function initDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed initial data if needed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial data...');

      await User.create({
        id: 'admin1',
        name: 'Admin',
        email: 'admin@oilloop.in',
        phone: '+91 99999 88888',
        password: 'frytofly',
        avatar: '🛡️',
        role: 'admin',
        ecoLevel: { level: 1, name: 'Seedling', icon: '🌱', minPoints: 0 },
        referralCode: 'OILLOOP-ADMIN'
      });

      await User.create({
        id: 'u1',
        name: 'Eco User',
        email: 'user@oilloop.in',
        phone: '9876543210',
        password: 'password',
        avatar: '🌿',
        role: 'user',
        ecoLevel: { level: 1, name: 'Seedling', icon: '🌱', minPoints: 0 },
        referralCode: 'OILLOOP-ECO42'
      });

      await Notification.create({
        id: 'n1',
        userId: 'u1',
        type: 'system',
        title: 'Welcome to OilLoop! 🌱',
        message: 'Start your recycling journey by scanning your first oil container.',
        read: false,
        icon: '🌱'
      });

      console.log('✅ Seeding complete');
    }
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
}

// Helper to keep similar API as before (though Mongoose models are used directly now)
export function getDb() {
  return mongoose.connection;
}

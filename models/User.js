const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profileImageUrl: { type: String },
  address: { type: String },
  role: { type: String, enum: ['user', 'admin', 'collector'], default: 'user' },
  rewardPoints: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  totalOilContributed: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for fast look‑ups
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ referralCode: 1 });

module.exports = mongoose.model('User', userSchema);

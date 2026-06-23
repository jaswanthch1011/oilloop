// models/Reward.js
const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  transactions: [{
    points: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now }
  }],
  redeemedRewards: [{
    rewardId: { type: String },
    pointsSpent: { type: Number },
    redemptionDate: { type: Date }
  }]
}, { timestamps: true });

// Indexes
RewardSchema.index({ userId: 1 });

module.exports = mongoose.model('Reward', RewardSchema);

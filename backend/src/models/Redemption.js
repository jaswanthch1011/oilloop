const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  pointsSpent: {
    type: Number,
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'used'],
    default: 'pending'
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Redemption', redemptionSchema);

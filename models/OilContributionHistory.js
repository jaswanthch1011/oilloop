// models/OilContributionHistory.js
const mongoose = require('mongoose');

const OilContributionHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest', required: true },
  quantityCollected: { type: Number, required: true }, // litres
  qualityGrade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  pointsEarned: { type: Number, required: true },
  collectionDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for fast look‑ups
OilContributionHistorySchema.index({ userId: 1 });
OilContributionHistorySchema.index({ pickupId: 1 });

module.exports = mongoose.model('OilContributionHistory', OilContributionHistorySchema);

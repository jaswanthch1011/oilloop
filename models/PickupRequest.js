const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oilQuantityLitres: { type: Number, required: true },
  oilType: { type: String, enum: ['vegetable', 'olive', 'other'], required: true },
  pickupAddress: { type: String, required: true },
  preferredPickupDateTime: { type: Date, required: true },
  status: { type: String, enum: ['Pending','Assigned','Picked Up','Completed','Cancelled'], default: 'Pending' },
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes for common queries
pickupRequestSchema.index({ userId: 1 });
pickupRequestSchema.index({ status: 1 });
pickupRequestSchema.index({ collectorId: 1 });

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);

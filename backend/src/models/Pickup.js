const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  locationId: {
    type: String,
    required: true
  },
  locationName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  oilType: {
    type: String,
    required: true
  },
  estimatedVolume: {
    type: Number,
    required: true
  },
  actualVolume: {
    type: Number
  },
  containers: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Approved',
      'Assigned',
      'En Route',
      'Picked Up',
      'Delivered',
      'Completed',
      'Cancelled'
    ],
    default: 'Pending'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pointsAwarded: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pickup', pickupSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['pickup_reminder', 'reward_alert', 'badge_unlock', 'system', 'referral', 'pickup_assigned', 'pickup_completed'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);

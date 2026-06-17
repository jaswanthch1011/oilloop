const mongoose = require('mongoose');

const oilScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  oilType: {
    type: String,
    required: true,
    enum: [
      'Sunflower Oil',
      'Coconut Oil',
      'Palm Oil',
      'Rice Bran Oil',
      'Soybean Oil',
      'Canola Oil',
      'Restaurant Grease'
    ]
  },
  imageUrl: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    enum: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OilScan', oilScanSchema);

const OilScan = require('../models/OilScan');
const GamificationService = require('../services/GamificationService');

const GRADE_POINTS = {
  'Grade 1': 15,
  'Grade 2': 10,
  'Grade 3': 5,
  'Grade 4': 2
};

exports.createScan = async (req, res) => {
  const { oilType, grade, quantity, imageUrl } = req.body;
  const userId = req.user._id;

  const pointsEarned = (GRADE_POINTS[grade] || 5) * quantity;

  try {
    const scan = await OilScan.create({
      userId,
      oilType,
      grade,
      quantity,
      imageUrl,
      pointsEarned,
      status: 'pending'
    });

    // We don't award points immediately anymore as per the latest requirements
    // Points are awarded on admin approval

    res.status(201).json({ success: true, scan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getScans = async (req, res) => {
  try {
    const scans = await OilScan.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, scans });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

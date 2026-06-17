const OilScan = require('../models/OilScan');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const GamificationService = require('../services/GamificationService');
const Notification = require('../models/Notification');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLiters = await User.aggregate([{ $group: { _id: null, total: { $sum: "$totalOilRecycled" } } }]);
    const activePickups = await Pickup.countDocuments({ status: { $ne: 'Completed' } });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalLiters: totalLiters[0]?.total || 0,
        activePickups
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.approveScan = async (req, res) => {
  const { id } = req.params;
  const { adjustedPoints } = req.body;

  try {
    const scan = await OilScan.findById(id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    if (scan.status !== 'pending') return res.status(400).json({ error: 'Scan already processed' });

    const finalPoints = adjustedPoints !== undefined ? adjustedPoints : scan.pointsEarned;

    scan.status = 'approved';
    scan.pointsEarned = finalPoints;
    await scan.save();

    // Award points to user
    await GamificationService.updatePoints(scan.userId, finalPoints, scan.quantity);

    // Notify user
    await Notification.create({
      userId: scan.userId,
      type: 'reward_alert',
      title: 'Scan Approved! 🎉',
      message: `Your scan has been approved. ${finalPoints} points added to your account.`,
      icon: '✅'
    });

    res.status(200).json({ success: true, scan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPendingScans = async (req, res) => {
  try {
    const scans = await OilScan.find({ status: 'pending' }).populate('userId', 'name email');
    res.status(200).json({ success: true, scans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

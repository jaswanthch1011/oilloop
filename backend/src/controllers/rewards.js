const Reward = require('../models/Reward');
const Redemption = require('../models/Redemption');
const User = require('../models/User');

exports.getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ available: true });
    res.status(200).json({ success: true, rewards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.redeemReward = async (req, res) => {
  const { rewardId } = req.body;
  const userId = req.user._id;

  try {
    const reward = await Reward.findById(rewardId);
    if (!reward || reward.stock <= 0) {
      return res.status(400).json({ error: 'Reward not available' });
    }

    const user = await User.findById(userId);
    if (user.availablePoints < reward.pointsRequired) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Process redemption
    user.availablePoints -= reward.pointsRequired;
    reward.stock -= 1;

    await user.save();
    await reward.save();

    const ticketNumber = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const redemption = await Redemption.create({
      userId,
      rewardId,
      rewardName: reward.title,
      pointsSpent: reward.pointsRequired,
      ticketNumber,
      status: 'pending'
    });

    res.status(201).json({ success: true, redemption });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

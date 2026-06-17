const User = require('../models/User');

exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'user' })
      .select('name avatar totalPoints totalOilRecycled level')
      .sort({ totalPoints: -1 })
      .limit(100);

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

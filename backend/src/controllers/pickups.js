const Pickup = require('../models/Pickup');
const Notification = require('../models/Notification');

exports.createPickup = async (req, res) => {
  try {
    const pickup = await Pickup.create({
      ...req.body,
      userId: req.user._id,
      status: 'Pending'
    });

    await Notification.create({
      userId: req.user._id,
      type: 'system',
      title: 'Pickup Requested ⏳',
      message: `Your pickup request for ${pickup.estimatedVolume}L has been received.`,
      icon: '⏳'
    });

    res.status(201).json({ success: true, pickup });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, pickups });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const pickup = await Pickup.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

    // Notification logic...

    res.status(200).json({ success: true, pickup });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

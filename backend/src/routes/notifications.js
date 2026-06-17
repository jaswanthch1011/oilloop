const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, notifications });
});

router.put('/:id/read', async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

module.exports = router;

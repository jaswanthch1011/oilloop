const express = require('express');
const { createPickup, getPickups, updateStatus } = require('../controllers/pickups');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPickups)
  .post(createPickup);

router.put('/:id/status', authorize('admin', 'pickup_agent'), updateStatus);

module.exports = router;

const express = require('express');
const { redeemReward } = require('../controllers/rewards');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, redeemReward);

module.exports = router;

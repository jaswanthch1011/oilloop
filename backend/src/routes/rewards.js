const express = require('express');
const { getRewards } = require('../controllers/rewards');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getRewards);

module.exports = router;

const express = require('express');
const { getGlobalLeaderboard } = require('../controllers/leaderboard');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getGlobalLeaderboard);

module.exports = router;

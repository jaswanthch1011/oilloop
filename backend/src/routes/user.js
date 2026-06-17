const express = require('express');
const { getMe } = require('../controllers/auth');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/profile', protect, getMe);

module.exports = router;

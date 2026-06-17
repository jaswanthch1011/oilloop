const express = require('express');
const { createScan, getScans } = require('../controllers/scans');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getScans)
  .post(createScan);

module.exports = router;

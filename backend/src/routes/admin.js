const express = require('express');
const { getStats, approveScan, getPendingScans } = require('../controllers/admin');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/scans', getPendingScans);
router.put('/scans/:id/approve', approveScan);

module.exports = router;

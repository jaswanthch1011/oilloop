const express = require('express');
const multer = require('multer');
const { predictOil } = require('../controllers/ai');
const { protect } = require('../middlewares/auth');

const router = express.Router();
const upload = multer();

router.post('/predict-oil', protect, upload.single('image'), predictOil);

module.exports = router;

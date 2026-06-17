const express = require('express');
const { getChatResponse } = require('../controllers/chatbot');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, getChatResponse);

module.exports = router;

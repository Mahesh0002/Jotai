const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { aiLimiter } = require('../middlewares/rateLimiter');

// Apply rate limiting to AI routes to prevent abuse
router.use(aiLimiter);

router.post('/chat', aiController.chat);
router.post('/tts', aiController.tts);

module.exports = router;

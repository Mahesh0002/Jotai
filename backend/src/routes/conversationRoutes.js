const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.get('/:sessionId', conversationController.getConversation);
router.post('/:sessionId/messages', conversationController.addMessage);
router.delete('/:sessionId', conversationController.deleteConversation);

module.exports = router;
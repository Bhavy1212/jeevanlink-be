const express = require('express');
const {
  startConversation,
  listConversations,
  getConversation,
  sendMessage,
  getMessages,
} = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(auth);

router.post('/start', startConversation);
router.get('/', listConversations);
router.get('/:conversationId', getConversation);
router.post('/message', sendMessage);
router.get('/messages/:conversationId', getMessages);

module.exports = router;

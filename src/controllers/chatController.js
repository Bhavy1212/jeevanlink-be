const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * POST /api/chat/start
 * Create or return an existing conversation between two users.
 * Body: { otherUserId, requestId? }
 */
const startConversation = async (req, res) => {
  try {
    const myId = req.user._id;
    const { otherUserId, requestId } = req.body;

    if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required.' });

    // Check other user exists
    const other = await User.findById(otherUserId);
    if (!other) return res.status(404).json({ error: 'User not found.' });

    // Find existing conversation
    let conv = await Conversation.findOne({
      participants: { $all: [myId, otherUserId], $size: 2 },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [myId, otherUserId],
        requestId: requestId || null,
      });
    }

    await conv.populate('participants', 'name mobile bloodGroup profilePhoto role');
    res.json({ conversation: conv });
  } catch (err) {
    console.error('startConversation error:', err);
    res.status(500).json({ error: 'Could not start conversation.' });
  }
};

/**
 * GET /api/chat
 * All conversations for the current user, sorted by latest message.
 */
const listConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name mobile bloodGroup profilePhoto role')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations: convs });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch conversations.' });
  }
};

/**
 * GET /api/chat/:conversationId
 * Single conversation with populated participants.
 */
const getConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    }).populate('participants', 'name mobile bloodGroup profilePhoto role city state');

    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch conversation.' });
  }
};

/**
 * POST /api/chat/message
 * Send a message. Also emits via Socket.IO (handled in socketManager).
 * Body: { conversationId, message }
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!conversationId || !message?.trim()) {
      return res.status(400).json({ error: 'conversationId and message are required.' });
    }

    // Verify user is participant
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conv) return res.status(403).json({ error: 'Not a participant in this conversation.' });

    const receiverId = conv.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    const msg = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId,
      message: message.trim(),
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message.trim(),
      lastMessageAt: new Date(),
    });

    // Populate sender for response
    await msg.populate('senderId', 'name mobile profilePhoto role');

    // Emit via Socket.IO (the socket instance is attached to app in server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', msg);
      io.to(conversationId).emit('conversation_updated', {
        conversationId,
        lastMessage: message.trim(),
        lastMessageAt: new Date(),
      });
    }

    res.status(201).json({ message: msg });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Could not send message.' });
  }
};

/**
 * GET /api/chat/messages/:conversationId
 * Paginated message history. Also marks messages as read.
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify participant
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conv) return res.status(403).json({ error: 'Not a participant.' });

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name profilePhoto role')
      .sort({ createdAt: 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    // Mark incoming messages as read
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages.' });
  }
};

module.exports = { startConversation, listConversations, getConversation, sendMessage, getMessages };

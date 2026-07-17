const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Attach Socket.IO event handlers to a connected socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const handleSocket = (socket, io) => {
  // ─── Authenticate socket on connect ────────────────────────────────────────
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect(true);
    return;
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    socket.disconnect(true);
    return;
  }

  // Track the user's socket
  socket.userId = userId;
  console.log(`[Socket] User ${userId} connected (${socket.id})`);

  // ─── Join conversation room ─────────────────────────────────────────────────
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`[Socket] User ${userId} joined room ${conversationId}`);
  });

  // ─── Leave conversation room ────────────────────────────────────────────────
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // ─── Typing indicator ───────────────────────────────────────────────────────
  socket.on('typing', ({ conversationId, userName }) => {
    socket.to(conversationId).emit('user_typing', { userId, userName });
  });

  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing', { userId });
  });

  // ─── Mark messages as read ──────────────────────────────────────────────────
  socket.on('mark_read', ({ conversationId }) => {
    socket.to(conversationId).emit('messages_read', { conversationId, byUserId: userId });
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] User ${userId} disconnected`);
  });
};

module.exports = { handleSocket };

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  requestId: { type: String, default: null },  // links to Supabase request id
}, { timestamps: true });

// Ensure the pair of participants is unique (one conversation per pair)
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { handleSocket } = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);   // expose io to controllers via req.app.get('io')

io.on('connection', (socket) => handleSocket(socket, io));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

// Rate limit message endpoint
const msgLimit = rateLimit({ windowMs: 60_000, max: 60, message: 'Too many messages.' });
app.use('/api/chat/message', msgLimit);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jeevanlink';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI);
    server.listen(PORT, () => {
      console.log(`🚀 JeevanLink backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

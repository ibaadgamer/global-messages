// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(cors());

// ==================== MONGODB CONNECTION ====================
const MONGO_URL = 'mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/globalbroadcast?retryWrites=true&w=majority';

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Check Atlas IP whitelist and network.');
});

// ==================== SCHEMAS ====================
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// ==================== ONLINE COUNT ====================
// Basic online tracking for demo purposes
let onlineCount = 0;
const clients = new Set();

// Increment online count on new connection (simple simulation)
app.use((req, res, next) => {
  const id = Symbol();
  clients.add(id);
  onlineCount = clients.size;
  res.on('finish', () => {
    clients.delete(id);
    onlineCount = clients.size;
  });
  next();
});

// ==================== ROUTES ====================

// Send a message
app.post('/messages', async (req, res) => {
  const { name, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const newMessage = await Message.create({ name, message });
    console.log(`📨 New message: ${name}: ${message}`);
    res.json(newMessage);
  } catch (err) {
    console.error('❌ Error saving message:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get recent messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Online count endpoint
app.get('/online-count', (req, res) => {
  res.json({ count: onlineCount });
});

// Ping endpoint for testing
app.get('/ping', (req, res) => res.send('pong'));

// ==================== ERROR HANDLING ====================

// Catch-all for unknown routes
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('ℹ️ Make sure your MongoDB Atlas cluster allows your current IP!');
});

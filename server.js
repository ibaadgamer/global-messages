// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// CONFIG
// ======================
const MONGO_URL = 'mongodb+srv://admin:Global123!@cluster0.lxlpnkw.mongodb.net/globalbroadcast?retryWrites=true&w=majority';

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// MONGOOSE MODELS
// ======================
const messageSchema = new mongoose.Schema({
  name: { type: String, default: 'Admin' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// ======================
// ROUTES
// ======================

// GET all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST new message
app.post('/messages', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const newMessage = await Message.create({ name, message });
    res.json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET online count (mocked for now)
let onlineCount = 0;
app.get('/online-count', (req, res) => {
  res.json({ count: onlineCount });
});

// ======================
// CONNECT TO MONGO & START SERVER
// ======================
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

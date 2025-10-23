const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ====== MongoDB ======
const MONGO_URL = 'mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/?appName=globalbroadcast';

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ====== In-memory online count ======
let onlineCount = 0;

// ====== Endpoints ======

// Send message
app.post('/messages', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const msg = new Message({ name, message });
    await msg.save();
    console.log(`📨 Message saved: ${name}: ${message}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error saving message:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get messages
app.get('/messages', async (req, res) => {
  try {
    const msgs = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(msgs);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Online count
app.get('/online-count', (req, res) => {
  res.json({ online: onlineCount });
});

// Simple increment/decrement endpoints for testing
app.post('/online/increment', (req, res) => {
  onlineCount++;
  console.log(`🟢 Online incremented: ${onlineCount}`);
  res.json({ online: onlineCount });
});
app.post('/online/decrement', (req, res) => {
  onlineCount = Math.max(0, onlineCount - 1);
  console.log(`🔴 Online decremented: ${onlineCount}`);
  res.json({ online: onlineCount });
});

// ====== Start server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// =================== CONFIG ===================
const PORT = process.env.PORT || 3000;
const MONGO_URL = 'mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/globalbroadcast?retryWrites=true&w=majority';

// =================== INIT ===================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// =================== MONGOOSE MODELS ===================
mongoose.set('strictQuery', true);

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  lastSeen: { type: Date, default: Date.now },
  displayName: String
});
const Device = mongoose.model('Device', deviceSchema);

// =================== ROUTES ===================

// Get all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Post a new message
app.post('/messages', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const msg = new Message({ name: name || 'Admin', message });
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Online count
app.get('/online-count', async (req, res) => {
  try {
    const onlineCount = await Device.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 60000) } });
    res.json({ count: onlineCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ count: 0 });
  }
});

// Update or register device
app.post('/device', async (req, res) => {
  try {
    const { deviceId, displayName } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { lastSeen: new Date(), displayName: displayName || deviceId },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Get all devices
app.get('/devices', async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// =================== START SERVER ===================
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIG ===
const MONGO_URI = 'mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/?retryWrites=true&w=majority';

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());

// === DATABASE ===
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  name: { type: String, default: 'Admin' },
  message: { type: String, required: true },
  color: { type: String, default: '#ff4040' },
  ts: { type: Date, default: Date.now },
});

const deviceSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  lastActive: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);
const Device = mongoose.model('Device', deviceSchema);

// === ROUTES ===

// Get all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ ts: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error('❌ GET /messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post a message
app.post('/messages', async (req, res) => {
  const { name, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const msg = new Message({ name, message, color });
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ POST /messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Device ping
app.post('/ping', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Device ID required' });

  try {
    const device = await Device.findOneAndUpdate(
      { id },
      { lastActive: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ POST /ping error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get online devices
app.get('/online-count', async (req, res) => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 1000); // last 30 seconds
    const onlineDevices = await Device.find({ lastActive: { $gte: cutoff } });
    res.json({ count: onlineDevices.length, devices: onlineDevices.map(d => d.id) });
  } catch (err) {
    console.error('❌ GET /online-count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/', (req, res) => res.send('Global Broadcast API running'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

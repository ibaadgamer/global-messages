const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ====== EXISTING ONLINE SYSTEM (leave as-is) ======
let onlineDevices = new Map();
app.post('/online', (req, res) => {
  const { deviceId } = req.body;
  if (deviceId) {
    onlineDevices.set(deviceId, Date.now());
  }
  res.json({ ok: true });
});
app.get('/online-count', (req, res) => {
  const now = Date.now();
  for (const [id, last] of onlineDevices) {
    if (now - last > 20000) onlineDevices.delete(id);
  }
  res.json({ online: onlineDevices.size });
});
// =================================================

// ====== FIXED MESSAGING SYSTEM ======
let messages = [];

// Get all messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// Post (send) a message from admin
app.post('/send', (req, res) => {
  const { name, message, duration, type } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const newMessage = {
    id: uuidv4(),
    name: name || 'Admin',
    message: message.trim(),
    duration: duration || 7000,
    type: type || 'default',
    timestamp: Date.now()
  };

  messages.push(newMessage);

  // Keep only the latest 100 messages to prevent memory bloat
  if (messages.length > 100) messages.shift();

  console.log(`[Message] ${newMessage.name}: ${newMessage.message}`);
  res.json({ success: true, message: newMessage });
});

// Optional clear endpoint for debugging
app.post('/clear-messages', (req, res) => {
  messages = [];
  res.json({ success: true });
});

// =================================================

// Simple homepage to keep Render alive
app.get('/', (req, res) => {
  res.send('<h1>Global Messages Server</h1><p>Server is running fine.</p>');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

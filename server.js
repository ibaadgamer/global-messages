const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ===== STATE =====
let messages = []; // stores { id, name, message, color, timestamp }
let onlineUsers = new Map(); // userId -> lastSeen timestamp

// ===== MIDDLEWARE TO TRACK ONLINE USERS =====
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  onlineUsers.set(ip, Date.now());
  next();
});

// ===== CLEANUP STALE ONLINE USERS =====
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of onlineUsers.entries()) {
    if (now - ts > 30000) onlineUsers.delete(key); // 30 sec timeout
  }
}, 5000);

// ===== ROUTES =====

// GET messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// POST new message
app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  if (!message || !name) return res.status(400).json({ error: 'Name and message required' });

  const msg = {
    id: uuidv4(),
    name,
    message,
    color: color || '#ff4040',
    timestamp: Date.now()
  };
  messages.push(msg);
  if (messages.length > 500) messages.shift(); // keep last 500 messages
  res.json({ success: true, message: msg });
});

// GET online count
app.get('/online-count', (req, res) => {
  res.json({ count: onlineUsers.size });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Global Broadcast backend running on port ${PORT}`);
});

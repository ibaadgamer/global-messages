const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ========== STATE ========== */
let messages = []; // { id, name, message, color, timestamp }
let onlineUsers = new Map(); // ip -> lastSeen timestamp

/* ========== HELPERS ========== */
function cleanOnline() {
  const now = Date.now();
  // Remove users inactive for >30s
  for (const [ip, ts] of onlineUsers.entries()) {
    if (now - ts > 30000) onlineUsers.delete(ip);
  }
}

/* ========== ROUTES ========== */

// Homepage for uptime checks
app.get('/', (req, res) => {
  res.send('<h2>Global Messages API Running ✅</h2><p>Use /messages and /online-count endpoints.</p>');
});

// Get messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// Post a message
app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const newMessage = {
    id: uuidv4(),
    name: name || 'Admin',
    message,
    color: color || '#ff4040',
    timestamp: Date.now()
  };
  messages.push(newMessage);
  if (messages.length > 200) messages.shift(); // keep last 200
  res.json({ success: true, message: newMessage });
});

// Track online users (ping from snippet)
app.post('/ping', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  onlineUsers.set(ip, Date.now());
  cleanOnline();
  res.json({ success: true });
});

// Get online count
app.get('/online-count', (req, res) => {
  cleanOnline();
  res.json({ count: onlineUsers.size });
});

/* ========== START SERVER ========== */
app.listen(PORT, () => {
  console.log(`Global Messages API running on port ${PORT}`);
});

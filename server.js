const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

/* ---------- State ---------- */
let messages = []; // { id, name, message, color, ts }
let onlineUsers = new Map(); // uid -> lastSeen timestamp

/* ---------- Helpers ---------- */
function cleanupOnlineUsers() {
  const now = Date.now();
  for (const [uid, ts] of onlineUsers.entries()) {
    if (now - ts > 30000) { // 30 seconds timeout
      onlineUsers.delete(uid);
    }
  }
}

/* ---------- Endpoints ---------- */

// Receive messages
app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const msg = {
    id: uuidv4(),
    name: name || 'Admin',
    message,
    color: color || '#ff4040',
    ts: Date.now()
  };
  messages.push(msg);

  // Keep max 200 messages
  if (messages.length > 200) messages.shift();

  res.json(msg);
});

// Fetch messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// Track online users
app.post('/online', (req, res) => {
  let { uid } = req.body;
  if (!uid) uid = uuidv4();
  onlineUsers.set(uid, Date.now());
  cleanupOnlineUsers();
  res.json({ uid, online: onlineUsers.size });
});

// Get online count
app.get('/online-count', (req, res) => {
  cleanupOnlineUsers();
  res.json({ count: onlineUsers.size });
});

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`Global Broadcast backend running on port ${PORT}`);
});

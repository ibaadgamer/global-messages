// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'messages.json');

// Helper to load messages from JSON
function loadMessages() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to save messages to JSON
function saveMessages(messages) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

// Generate a unique ID using crypto
function uuidv4() {
  return crypto.randomUUID();
}

// In-memory online users tracking
const onlineUsers = new Set();

// API endpoints
app.get('/messages', (req, res) => {
  const messages = loadMessages();
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const messages = loadMessages();
  const msgObj = {
    _id: uuidv4(),
    name: name || 'Admin',
    message,
    color: color || '#ff4040',
    timestamp: Date.now()
  };

  messages.push(msgObj);
  saveMessages(messages);

  res.json({ success: true, message: msgObj });
});

app.get('/online-count', (req, res) => {
  // Optionally, you can pass a query ?add=name to track users
  const add = req.query.add;
  if (add) onlineUsers.add(add);
  res.json({ online: onlineUsers.size, count: onlineUsers.size });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

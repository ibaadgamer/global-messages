const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ========== STATE ========== */
let messages = []; // { id, name, message, color, timestamp }
let onlineCount = 0;

/* ========== ENDPOINTS ========== */

// Root page for Uptime Robot / friendly homepage
app.get('/', (req, res) => {
  res.send('<h2>Global Messages API is running ✅</h2><p>Use /messages and /online-count endpoints.</p>');
});

// Get all messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// Post a new message
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

  // Keep last 200 messages to avoid memory overflow
  if (messages.length > 200) messages.shift();

  res.json({ success: true, message: newMessage });
});

// Get online count
app.get('/online-count', (req, res) => {
  res.json({ count: onlineCount });
});

// For simulation: you can update onlineCount periodically or track via snippet pings
// Here we just increment it every request for testing
app.post('/online-count', (req, res) => {
  const { count } = req.body;
  if (typeof count === 'number') onlineCount = count;
  res.json({ success: true, count: onlineCount });
});

/* ========== START SERVER ========== */
app.listen(PORT, () => {
  console.log(`Global Messages API running on port ${PORT}`);
});

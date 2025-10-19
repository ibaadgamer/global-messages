// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve homepage and snippet

// -------------------- STATE --------------------
let messages = []; // { id, name, message, duration, ts }
let onlineClients = new Map(); // sessionId -> lastSeen

// -------------------- ROUTES --------------------

// Basic homepage so uptime monitors keep app alive
app.get('/', (req, res) => {
  res.send('<h1>Global Broadcast Backend Online</h1><p>Use /messages and /broadcast endpoints.</p>');
});

// Get broadcast messages
app.get('/messages', (req, res) => {
  res.json(messages.slice(-50)); // return last 50 messages
});

// Send a broadcast (from admin panel)
app.post('/broadcast', (req, res) => {
  const { name, message, duration } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const msg = {
    id: uuidv4(),
    name: name || 'Admin',
    message,
    duration: parseInt(duration) || 7,
    ts: Date.now()
  };
  messages.push(msg);
  res.json({ success: true });
});

// Track online clients
app.get('/online', (req, res) => {
  const sessionId = req.query.sid || uuidv4();
  onlineClients.set(sessionId, Date.now());
  // Remove clients inactive for more than 60 seconds
  const now = Date.now();
  for (const [sid, lastSeen] of onlineClients.entries()) {
    if (now - lastSeen > 60000) onlineClients.delete(sid);
  }
  res.json({ online: onlineClients.size, devices: Array.from(onlineClients.keys()).map(sid => ({ sid })) });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

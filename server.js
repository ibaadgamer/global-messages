const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory storage
let messages = []; // { name, message, color, timestamp }
let heartbeats = {}; // { visitorId: lastSeenTimestamp }

// ----------- Messages API -----------
app.get('/messages', (req, res) => {
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const msgObj = {
    name: name || 'Admin',
    message,
    color: color || '#ff4040',
    timestamp: Date.now(),
  };
  messages.push(msgObj);
  res.json(msgObj);
});

// ----------- Heartbeat API -----------
app.post('/heartbeat', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  heartbeats[id] = Date.now();
  res.json({ success: true });
});

app.get('/online-count', (req, res) => {
  const now = Date.now();
  // Consider active if heartbeat within last 15 seconds
  const count = Object.values(heartbeats).filter(ts => now - ts < 15000).length;
  res.json({ count });
});

// Optional: cleanup old heartbeats every minute
setInterval(() => {
  const now = Date.now();
  for (const id in heartbeats) {
    if (now - heartbeats[id] > 60000) delete heartbeats[id];
  }
}, 60000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

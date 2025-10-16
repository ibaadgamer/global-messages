const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

/* ---------------- Messages ---------------- */
let messages = [];

app.get('/messages', (req, res) => {
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { name, message, color } = req.body;
  const msg = {
    _id: uuidv4(),
    name: name || 'Admin',
    message: message || '',
    color: color || '#ff4040',
    timestamp: Date.now()
  };
  messages.push(msg);
  res.json(msg);
});

/* ---------------- Online users ---------------- */
let sessions = new Map(); // sessionId -> lastSeen timestamp
const ONLINE_TIMEOUT = 10000; // consider offline if not seen for 10s

// Endpoint for snippet to ping every few seconds
app.post('/online', (req, res) => {
  let { sessionId } = req.body;
  if(!sessionId) sessionId = uuidv4();

  sessions.set(sessionId, Date.now());

  // Clean up expired sessions
  for(const [id, ts] of sessions) {
    if(Date.now() - ts > ONLINE_TIMEOUT) sessions.delete(id);
  }

  res.json({ sessionId, online: sessions.size });
});

// Admin panel endpoint
app.get('/online-count', (req, res) => {
  // Clean up expired sessions
  for(const [id, ts] of sessions) {
    if(Date.now() - ts > ONLINE_TIMEOUT) sessions.delete(id);
  }
  res.json({ count: sessions.size });
});

/* ---------------- Start server ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

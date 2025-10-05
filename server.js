const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let messages = []; // In-memory store, resets if server restarts

// Get all messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// Post a new message
app.post('/messages', (req, res) => {
  const { name, message } = req.body;
  if(!message) return res.status(400).json({ error: 'Message required' });
  messages.push({ name: name || 'Admin', message, timestamp: Date.now() });
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Broadcast server running on port ${port}`);
});

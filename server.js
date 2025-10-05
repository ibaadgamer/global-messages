const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// In-memory messages array (or use DB if needed)
let messages = [];

// Serve the front-end
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.get('/messages', (req, res) => {
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { name, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  messages.push({ name: name || 'Admin', message, timestamp: Date.now() });
  res.json({ success: true });
});

// Render provides PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

/* ---------- In-memory storage ---------- */
let messages = []; // { id, name, message, color, duration, timestamp }
let onlineDevices = new Map(); // UID => lastPing (ms)

/* ---------- Helpers ---------- */
function cleanupOnline(){
  const now = Date.now();
  for(const [uid,lastPing] of onlineDevices.entries()){
    if(now - lastPing > 15000) onlineDevices.delete(uid); // remove if no ping for 15s
  }
}

/* ---------- Routes ---------- */

// GET all messages
app.get('/messages', (req,res)=>{
  const last100 = messages.slice(-100);
  // send JSON fields the snippet expects
  const out = last100.map(m=>({
    name: m.name,
    message: m.message,
    color: m.color || '#ff4040',
    timestamp: m.timestamp
  }));
  res.json(out);
});

// POST new message
app.post('/messages', (req,res)=>{
  const { name, message, color, duration } = req.body;
  if(!message) return res.status(400).json({error:'Message required'});
  const id = Date.now() + '-' + Math.random().toString(36).substr(2,5);
  const timestamp = Date.now();
  messages.push({ id, name: name||'Admin', message, color: color||'#ff4040', duration: duration||7, timestamp });
  res.json({success:true});
});

// GET online count + device list
app.get('/online-count', (req,res)=>{
  const addUID = req.query.add;
  if(addUID) onlineDevices.set(addUID, Date.now());

  cleanupOnline();

  const devices = Array.from(onlineDevices.entries()).map(([id,lastPing])=>({ id, lastPing }));
  res.json({ count: onlineDevices.size, devices });
});

/* ---------- Start server ---------- */
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));

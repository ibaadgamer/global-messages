// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- CONFIG ----------
const PORT = process.env.PORT || 3000;
const MONGO_URL = "mongodb+srv://admin:Global123!@cluster0.lxlpnkw.mongodb.net/global-broadcast?retryWrites=true&w=majority";

// ---------- CONNECT TO MONGO ----------
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------- SCHEMAS ----------
const messageSchema = new mongoose.Schema({
  name: { type: String, default: "Admin" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// ---------- IN-MEMORY ONLINE DEVICES ----------
let onlineDevices = new Map();

// ---------- ROUTES ----------

// Get all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Post a new message
app.post("/messages", async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const msg = new Message({ name: name || "Admin", message });
    await msg.save();
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Online count (heartbeat from snippet)
app.get("/online-count", (req, res) => {
  res.json({ count: onlineDevices.size });
});

// Snippet sends heartbeat
app.post("/heartbeat", (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: "deviceId required" });
  onlineDevices.set(deviceId, Date.now());
  res.json({ status: "ok" });
});

// Optional: periodically clean old devices
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of onlineDevices.entries()) {
    if (now - ts > 30000) onlineDevices.delete(id); // 30 seconds timeout
  }
}, 5000);

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

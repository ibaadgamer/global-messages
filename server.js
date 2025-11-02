// server.js
// CommonJS version for Render
// To run: node server.js
// Make sure to install: npm install express mongoose cors body-parser nanoid

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { nanoid } = require("nanoid");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// --- CONFIG ---
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/?appName=globalbroadcast";
const PORT = process.env.PORT || 3000;
const ONLINE_TTL_MS = 30 * 1000; // how long users stay "online" after last ping

// --- DATABASE SETUP ---
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// --- SCHEMAS ---
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  name: String,
  message: String,
  color: { type: String, default: "#ff4040" },
  createdAt: { type: Date, default: Date.now },
});

const deviceSchema = new Schema({
  id: { type: String, default: nanoid },
  name: String,
  lastSeen: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
const Device = mongoose.model("Device", deviceSchema);

// --- ROUTES ---

// Get all messages (or only new ones since ?after=timestamp)
app.get("/messages", async (req, res) => {
  try {
    const after = req.query.after ? new Date(Number(req.query.after)) : null;
    const query = after ? { createdAt: { $gt: after } } : {};
    const msgs = await Message.find(query).sort({ createdAt: 1 }).limit(100);
    res.json(msgs);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

// Post a new message
app.post("/messages", async (req, res) => {
  try {
    const { name, message, color } = req.body;
    if (!message) return res.status(400).json({ error: "Empty message" });
    const msg = await Message.create({ name, message, color });
    console.log(`💬 Message from ${name}: ${message}`);
    res.json(msg);
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).json({ error: "Error posting message" });
  }
});

// Register or refresh a device online
app.post("/online", async (req, res) => {
  try {
    const { id, name } = req.body;
    const now = new Date();
    if (id) {
      await Device.findOneAndUpdate({ id }, { lastSeen: now, name });
      return res.json({ id });
    } else {
      const dev = await Device.create({ name });
      return res.json({ id: dev.id });
    }
  } catch (err) {
    console.error("Error updating online:", err);
    res.status(500).json({ error: "Error updating online" });
  }
});

// Manually increment online count (fallback)
app.post("/online/increment", (req, res) => {
  console.log("Increment called — no effect, handled by /online system");
  res.json({ ok: true });
});
app.post("/online/decrement", (req, res) => {
  console.log("Decrement called — no effect, handled by /online system");
  res.json({ ok: true });
});

// Remove a device (logout)
app.delete("/online/:id", async (req, res) => {
  try {
    await Device.deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error removing device" });
  }
});

// Get count of online users
app.get("/online-count", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - ONLINE_TTL_MS);
    const count = await Device.countDocuments({ lastSeen: { $gt: cutoff } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Error getting count" });
  }
});

// Get list of online devices
app.get("/devices", async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - ONLINE_TTL_MS);
    const list = await Device.find({ lastSeen: { $gt: cutoff } }).select("id name lastSeen");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error getting device list" });
  }
});

// --- CLEANUP TASK ---
setInterval(async () => {
  const cutoff = new Date(Date.now() - ONLINE_TTL_MS * 2);
  const res = await Device.deleteMany({ lastSeen: { $lt: cutoff } });
  if (res.deletedCount > 0) console.log(`🧹 Cleaned ${res.deletedCount} stale devices`);
}, 60 * 1000);

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

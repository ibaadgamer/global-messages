// ===== Global Messages Server (CJS version) =====
// Works with: https://global-messages.onrender.com
// Database: MongoDB Atlas (your provided URL)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== MongoDB Connection =====
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://admin:Global123!@cluster0.lxlpnkw.mongodb.net/?appName=Cluster0";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ===== Schemas =====
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// For tracking online devices
let onlineDevices = new Map(); // key: deviceId, value: timestamp

// ===== Routes =====

// 🟢 GET all messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 🟢 POST a message
app.post("/messages", async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const newMessage = new Message({ name, message });
    await newMessage.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 🟢 Online tracking (ping)
app.post("/ping", (req, res) => {
  const { deviceId } = req.body;
  if (deviceId) onlineDevices.set(deviceId, Date.now());
  res.json({ success: true });
});

// 🟢 Online count endpoint
app.get("/online-count", (req, res) => {
  const now = Date.now();
  // Remove inactive devices (no ping in last 20s)
  for (const [id, ts] of onlineDevices.entries()) {
    if (now - ts > 20000) onlineDevices.delete(id);
  }
  res.json({ count: onlineDevices.size });
});

// 🟢 Health check
app.get("/", (req, res) => {
  res.send("🌐 Global Messages API is running");
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

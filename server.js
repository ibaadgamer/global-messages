import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 10000;

// === MONGODB SETUP ===
// You can use your own MongoDB connection string here
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<YOUR_MONGO_URI>";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());

// === SCHEMAS ===
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// In-memory online tracking
let onlineDevices = new Map(); // key: deviceId, value: timestamp

// === ROUTES ===

// Root check
app.get("/", (req, res) => {
  res.send("🌍 Global Broadcast Server is running!");
});

// POST new message
app.post("/messages", async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message || !name)
      return res.status(400).json({ error: "Missing name or message" });

    const msg = new Message({ name, message });
    await msg.save();
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// GET all messages (latest 100)
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Online device ping route
app.post("/ping", (req, res) => {
  const { deviceId } = req.body;
  if (deviceId) {
    onlineDevices.set(deviceId, Date.now());
  }
  res.json({ success: true });
});

// Online count
app.get("/online-count", (req, res) => {
  const now = Date.now();
  // Remove devices inactive for 20 seconds
  for (const [id, ts] of onlineDevices.entries()) {
    if (now - ts > 20000) onlineDevices.delete(id);
  }
  res.json({ count: onlineDevices.size });
});

// Optional: Get list of online devices
app.get("/devices", (req, res) => {
  const now = Date.now();
  const list = [];
  for (const [id, ts] of onlineDevices.entries()) {
    if (now - ts <= 20000) {
      list.push({ id, lastSeen: ts });
    }
  }
  res.json(list);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

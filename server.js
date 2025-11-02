// server.js (CommonJS)
// Node 16+ / 18+ compatible
// Dependencies: express, mongoose, cors, body-parser
// Install: npm install express mongoose cors body-parser

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid'); // small id generator; install with npm i nanoid (optional). If not installed, fallback to random.

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// --- Config ---
// Use ENV if available; otherwise fallback to the URI you gave previously.
// IMPORTANT: for production, set MONGO_URI in environment variables
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://admin:Global123!@globalbroadcast.pmtltpk.mongodb.net/?appName=globalbroadcast';

const PORT = process.env.PORT || 3000;
const ONLINE_TTL_MS = 30 * 1000; // consider device "online" if lastSeen within 30s

// --- Mongoose setup ---
// Avoid buffering surprises: disable buffering of model functions if mongoose not connected
mongoose.set('bufferCommands', false);

mongoose
  .connect(MONGO_URI, {
    // recommended options
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // don't use deprecated findAndModify style
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message || err);
    // Optionally exit or continue; keep server running but DB calls will fail
  });

// --- Schemas ---
const { Schema }

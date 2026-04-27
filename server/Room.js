const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- הגדרת המודל (Schema) ---
const roomSchema = new mongoose.Schema({
  wing: { type: String, required: true },
  floor: { type: Number, required: true },
  size: { type: Number, required: true },
  hasProjector: { type: Boolean, default: false },
  
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  cancellations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancellation'
  }]
});

const Room = mongoose.model('Room', roomSchema);

// --- נתיבים (Routes) ---

// נתיב לבדיקת סטטוס (המשימה שלך בשלב 1)
app.get('/api/status', (req, res) => {
  res.json({ 
    message: "Success from Server",
    status: "connected",
    task: "End-to-End connection proven"
  });
});

// דוגמה לנתיב עתידי ששולף את החדרים (שלב 2)
app.get('/api/rooms', async (req, res) => {
  try {
    // כאן בעתיד תשלפי חדרים אמיתיים מהמסד
    res.json([{ wing: "A", floor: 1, size: 30 }]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- הרצת השרת ---
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`✅ API Status: http://localhost:${PORT}/api/status`);
  console.log(`=========================================`);
});

// ייצוא המודל (במידה ותרצי להשתמש בו בקבצים אחרים)
module.exports = Room;
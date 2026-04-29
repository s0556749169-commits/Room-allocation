const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

// --- חיבור למסד נתונים (מקומי לצורך בדיקות) ---
// ברגע שבת 3 תשלח את הקישור, תחליפי את המחרוזת הזו
mongoose.connect('mongodb://127.0.0.1:27017/room_project')
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));
// 1. ייבוא המודלים
const Allocation = require('./models/Allocation'); 

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
    ref: 'Allocation' 
  }],
  cancellations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancellation'
  }]
});

const Room = mongoose.model('Room', roomSchema);

// --- נתיבים (Routes) ---

// בדיקת סטטוס
app.get('/api/status', (req, res) => {
  res.json({ message: "Success from Server", task: "Working Locally" });
});

/**
 * משימה של בת 5 - שלב 2:
 * הוספת שיבוץ קבוע ובדיקת התנגשויות
 */
app.post('/api/rooms/:id/assignments', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { type, startTime, endTime, dayOfWeek, notes } = req.body;

    // א. לוגיקה לבדיקת חפיפת זמנים
    const conflict = await Allocation.findOne({
      roomId: roomId,
      type: 'permanent',
      dayOfWeek: dayOfWeek,
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ 
        message: `קיימת התנגשות! החדר תפוס בין ${conflict.startTime} ל-${conflict.endTime}` 
      });
    }

    // ב. יצירת השיבוץ החדש
    const newAllocation = new Allocation({
      roomId,
      type,
      startTime,
      endTime,
      dayOfWeek,
      notes
    });
    await newAllocation.save();

    // ג. עדכון מערך השיבוצים בתוך מסמך החדר
    await Room.findByIdAndUpdate(roomId, {
      $push: { assignments: newAllocation._id }
    });

    res.status(201).json({ message: "השיבוץ נוסף בהצלחה", data: newAllocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// שליפת חדרים
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().populate('assignments');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * נתיב עזר זמני - יצירת חדר ראשון כדי שיהיה לך ID לבדיקה
 * שלחי בקשת POST לכתובת: http://localhost:5000/api/test/seed
 */
app.post('/api/test/seed', async (req, res) => {
  try {
    const newRoom = new Room({
      wing: "A",
      floor: 1,
      size: 20,
      hasProjector: true
    });
    const savedRoom = await newRoom.save();
    res.json({ 
      message: "חדר בדיקה נוצר בהצלחה!", 
      roomId: savedRoom._id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = Room;
require('dotenv').config(); // חובה כדי לקרוא את קובץ ה-.env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ייבוא המודלים מהקבצים שלהם
const Room = require('./models/Room');
const Allocation = require('./models/Allocation'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- חיבור למסד נתונים (באמצעות משתנה סביבה לאבטחה) ---
const dbURI = process.env.MONGO_URI || 'mongodb+srv://Yehudit-Arieli:1700707050@seminarrooms.spiiw1i.mongodb.net/?appName=seminarRooms';

mongoose.connect(dbURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

// --- פונקציות עזר ---
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isValidTimeFormat = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
const normalizeDate = (dateValue) => {
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

// --- נתיבים (Routes) ---

// בדיקת סטטוס
app.get('/api/status', (req, res) => {
  res.json({ message: "Success from Server", status: "Running" });
});

// הוספת שיבוץ קבוע (המשימה שלך)
app.post('/api/rooms/:id/assignments', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { type, startTime, endTime, dayOfWeek, notes } = req.body;

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

    const newAllocation = new Allocation({ roomId, type, startTime, endTime, dayOfWeek, notes });
    await newAllocation.save();

    await Room.findByIdAndUpdate(roomId, { $push: { assignments: newAllocation._id } });

    res.status(201).json({ message: "השיבוץ נוסף בהצלחה", data: newAllocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// הוספת שיבוץ זמני
app.post('/api/rooms/:roomId/temporary-allocations', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { date, startTime, endTime, notes } = req.body;
  
      if (!isValidObjectId(roomId)) return res.status(400).json({ message: 'מזהה חדר אינו תקין' });
      if (!date || !startTime || !endTime) return res.status(400).json({ message: 'חובה להזין נתונים מלאים' });
  
      const selectedDate = normalizeDate(date);
      if (!selectedDate) return res.status(400).json({ message: 'תאריך אינו תקין' });
  
      // בדיקת התנגשויות (זמני וקבוע)
      const dayOfWeek = selectedDate.getDay();
      const conflict = await Allocation.findOne({
        roomId,
        $or: [
          { type: 'temporary', date: selectedDate },
          { type: 'permanent', dayOfWeek: dayOfWeek }
        ],
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      });
  
      if (conflict) return res.status(409).json({ message: 'קיימת התנגשות במועד זה' });
  
      const newAllocation = new Allocation({ roomId, type: 'temporary', date: selectedDate, startTime, endTime, notes });
      await newAllocation.save();
  
      res.status(201).json({ message: 'השיבוץ הזמני נוסף בהצלחה', allocation: newAllocation });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// נתיב עזר ליצירת חדר (Seed)
app.post('/api/test/seed', async (req, res) => {
  try {
    const newRoom = new Room({ wing: "A", floor: 1, size: 20, hasProjector: true });
    const savedRoom = await newRoom.save();
    res.json({ message: "חדר בדיקה נוצר!", roomId: savedRoom._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
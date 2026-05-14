const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

// --- חיבור למסד נתונים (מקומי לצורך בדיקות) ---
// ברגע שבת 3 תשלח את הקישור, תחליפי את המחרוזת הזו
mongoose.connect('mongodb+srv://Yehudit-Arieli:1700707050@seminarrooms.spiiw1i.mongodb.net/?appName=seminarRooms')
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
// ===== Temporary Allocations Helpers =====

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isValidTimeFormat(time) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function getDayOfWeek(date) {
  // JS: Sunday = 0, Monday = 1...
  return date.getDay();
}

function normalizeDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getNextDate(date) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}


// ===== Add Temporary Allocation =====

app.post('/api/rooms/:roomId/temporary-allocations', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { date, startTime, endTime, notes } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        message: 'מזהה חדר אינו תקין'
      });
    }

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'חובה להזין תאריך, שעת התחלה ושעת סיום'
      });
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        message: 'פורמט השעה חייב להיות HH:mm, לדוגמה 09:30'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: 'שעת ההתחלה חייבת להיות לפני שעת הסיום'
      });
    }

    const selectedDate = normalizeDate(date);

    if (!selectedDate) {
      return res.status(400).json({
        message: 'תאריך אינו תקין'
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: 'החדר לא נמצא במערכת'
      });
    }

    const nextDate = getNextDate(selectedDate);
    const dayOfWeek = getDayOfWeek(selectedDate);

    // בדיקת התנגשות מול שיבוץ זמני באותו חדר ובאותו תאריך
    const temporaryConflict = await Allocation.findOne({
      roomId,
      type: 'temporary',
      date: {
        $gte: selectedDate,
        $lt: nextDate
      },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (temporaryConflict) {
      return res.status(409).json({
        message: 'לא ניתן להוסיף שיבוץ זמני — קיימת התנגשות עם שיבוץ זמני אחר',
        conflict: temporaryConflict
      });
    }

    // בדיקת התנגשות מול שיבוץ קבוע באותו יום בשבוע
    const permanentConflict = await Allocation.findOne({
      roomId,
      type: 'permanent',
      dayOfWeek,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (permanentConflict) {
      return res.status(409).json({
        message: 'לא ניתן להוסיף שיבוץ זמני — קיימת התנגשות עם המערכת הקבועה של החדר',
        conflict: permanentConflict
      });
    }

    const newAllocation = new Allocation({
      roomId,
      type: 'temporary',
      date: selectedDate,
      startTime,
      endTime,
      notes: notes || ''
    });

    await newAllocation.save();

    res.status(201).json({
      message: 'השיבוץ הזמני נוסף בהצלחה',
      allocation: newAllocation
    });

  } catch (err) {
    res.status(500).json({
      message: 'שגיאה בהוספת שיבוץ זמני',
      error: err.message
    });
  }
});


// ===== Delete Temporary Allocation =====

app.delete('/api/temporary-allocations/:allocationId', async (req, res) => {
  try {
    const { allocationId } = req.params;

    if (!isValidObjectId(allocationId)) {
      return res.status(400).json({
        message: 'מזהה שיבוץ אינו תקין'
      });
    }

    const deletedAllocation = await Allocation.findOneAndDelete({
      _id: allocationId,
      type: 'temporary'
    });

    if (!deletedAllocation) {
      return res.status(404).json({
        message: 'שיבוץ זמני לא נמצא או שאינו שיבוץ זמני'
      });
    }

    res.json({
      message: 'השיבוץ הזמני נמחק בהצלחה',
      allocation: deletedAllocation
    });

  } catch (err) {
    res.status(500).json({
      message: 'שגיאה במחיקת שיבוץ זמני',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = Room;
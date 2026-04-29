const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
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

// --- הרצת השרת ---
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`✅ API Status: http://localhost:${PORT}/api/status`);
  console.log(`=========================================`);
});

// ייצוא המודל (במידה ותרצי להשתמש בו בקבצים אחרים)
module.exports = Room;
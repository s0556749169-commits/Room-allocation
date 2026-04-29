const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const Allocation = require('./models/Allocation');

const app = express();
const PORT = 5000;

mongoose.connect('mongodb://127.0.0.1:27017/room_project')
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

app.use(cors());
app.use(express.json());

const roomSchema = new mongoose.Schema({
  wing: { type: String, required: true, trim: true },
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

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isValidTimeFormat(time) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
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

function getDayOfWeek(date) {
  return date.getDay();
}

app.get('/api/status', (req, res) => {
  res.json({
    message: 'Success from Server',
    task: 'Working Locally'
  });
});

// ===== Room CRUD =====

// Create room
app.post('/api/rooms', async (req, res) => {
  try {
    const { wing, floor, size, hasProjector } = req.body;

    if (!wing || floor === undefined || size === undefined) {
      return res.status(400).json({
        message: 'חובה להזין אגף, קומה וגודל חדר'
      });
    }

    if (Number(size) <= 0) {
      return res.status(400).json({
        message: 'גודל החדר חייב להיות מספר חיובי'
      });
    }

    const newRoom = new Room({
      wing,
      floor: Number(floor),
      size: Number(size),
      hasProjector: Boolean(hasProjector)
    });

    await newRoom.save();

    res.status(201).json({
      message: 'החדר נוצר בהצלחה',
      room: newRoom
    });
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה ביצירת חדר',
      error: err.message
    });
  }
});

// Read all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('assignments')
      .sort({ wing: 1, floor: 1, size: 1 });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה בשליפת חדרים',
      error: err.message
    });
  }
});

// Read room by id
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        message: 'מזהה חדר אינו תקין'
      });
    }

    const room = await Room.findById(roomId).populate('assignments');

    if (!room) {
      return res.status(404).json({
        message: 'החדר לא נמצא'
      });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה בשליפת חדר',
      error: err.message
    });
  }
});

// Update room
app.put('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { wing, floor, size, hasProjector } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        message: 'מזהה חדר אינו תקין'
      });
    }

    if (!wing || floor === undefined || size === undefined) {
      return res.status(400).json({
        message: 'חובה להזין אגף, קומה וגודל חדר'
      });
    }

    if (Number(size) <= 0) {
      return res.status(400).json({
        message: 'גודל החדר חייב להיות מספר חיובי'
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        wing,
        floor: Number(floor),
        size: Number(size),
        hasProjector: Boolean(hasProjector)
      },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({
        message: 'החדר לא נמצא'
      });
    }

    res.json({
      message: 'החדר עודכן בהצלחה',
      room: updatedRoom
    });
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה בעדכון חדר',
      error: err.message
    });
  }
});

// Delete room
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        message: 'מזהה חדר אינו תקין'
      });
    }

    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).json({
        message: 'החדר לא נמצא'
      });
    }

    await Allocation.deleteMany({ roomId });

    res.json({
      message: 'החדר והשיבוצים שלו נמחקו בהצלחה',
      room: deletedRoom
    });
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה במחיקת חדר',
      error: err.message
    });
  }
});

// ===== Permanent Allocation =====

app.post('/api/rooms/:id/assignments', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { type, startTime, endTime, dayOfWeek, notes } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        message: 'מזהה חדר אינו תקין'
      });
    }

    if (!type || !startTime || !endTime || dayOfWeek === undefined) {
      return res.status(400).json({
        message: 'חובה להזין סוג שיבוץ, שעות ויום בשבוע'
      });
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        message: 'פורמט השעה חייב להיות HH:mm'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: 'שעת ההתחלה חייבת להיות לפני שעת הסיום'
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        message: 'החדר לא נמצא'
      });
    }

    const conflict = await Allocation.findOne({
      roomId,
      type: 'permanent',
      dayOfWeek,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflict) {
      return res.status(409).json({
        message: `קיימת התנגשות! החדר תפוס בין ${conflict.startTime} ל-${conflict.endTime}`,
        conflict
      });
    }

    const newAllocation = new Allocation({
      roomId,
      type,
      startTime,
      endTime,
      dayOfWeek,
      notes: notes || ''
    });

    await newAllocation.save();

    await Room.findByIdAndUpdate(roomId, {
      $push: { assignments: newAllocation._id }
    });

    res.status(201).json({
      message: 'השיבוץ נוסף בהצלחה',
      data: newAllocation
    });
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה בהוספת שיבוץ קבוע',
      error: err.message
    });
  }
});

// ===== Temporary Allocation =====

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

    await Room.findByIdAndUpdate(roomId, {
      $push: { assignments: newAllocation._id }
    });

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

    await Room.findByIdAndUpdate(deletedAllocation.roomId, {
      $pull: { assignments: deletedAllocation._id }
    });

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

// ===== Test Seed =====

app.post('/api/test/seed', async (req, res) => {
  try {
    const newRoom = new Room({
      wing: 'A',
      floor: 1,
      size: 20,
      hasProjector: true
    });

    const savedRoom = await newRoom.save();

    res.json({
      message: 'חדר בדיקה נוצר בהצלחה!',
      roomId: savedRoom._id
    });
  } catch (err) {
    res.status(500).json({
      message: 'שגיאה ביצירת חדר בדיקה',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = Room;
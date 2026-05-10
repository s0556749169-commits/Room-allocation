const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- ייבוא המודלים (נתיב מקוצר כי אנחנו כבר בתוך server) ---
const Room = require('./models/Room');
const Allocation = require('./models/Allocation');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- חיבור למסד הנתונים אטלס ---
const mongoURI = 'mongodb://Yehudit-Arieli:j1hbJBHCX1gWolLa@ac-spiiwli-shard-00-00.spiiwli.mongodb.net:27017,ac-spiiwli-shard-00-01.spiiwli.mongodb.net:27017,ac-spiiwli-shard-00-02.spiiwli.mongodb.net:27017/?ssl=true&replicaSet=atlas-spiiwli-shard-0&authSource=admin&retryWrites=true&w=majority&appName=seminarRooms';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- פונקציית עזר לנירמול תאריכים ---
function normalizeDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

// --- נתיבים (Routes) ---

app.get('/', (req, res) => {
  res.send('Server for Seminar Room Placement is up and running!');
});

// 1. הוספת שיבוץ קבוע ובדיקת התנגשויות
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

    await Room.findByIdAndUpdate(roomId, {
      $push: { assignments: newAllocation._id }
    });

    res.status(201).json({ message: "השיבוץ נוסף בהצלחה", data: newAllocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. הוספת שיבוץ זמני עם בדיקה כפולה
app.post('/api/rooms/:roomId/temporary-allocations', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { date, startTime, endTime, notes } = req.body;
    
    const selectedDate = normalizeDate(date);
    if (!selectedDate) return res.status(400).json({ message: 'תאריך אינו תקין' });
    
    const dayOfWeek = selectedDate.getDay();

    const tempConflict = await Allocation.findOne({
      roomId,
      type: 'temporary',
      date: { $gte: selectedDate, $lt: new Date(selectedDate.getTime() + 86400000) },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (tempConflict) return res.status(409).json({ message: 'התנגשות עם שיבוץ זמני אחר' });

    const permConflict = await Allocation.findOne({
      roomId,
      type: 'permanent',
      dayOfWeek,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (permConflict) return res.status(409).json({ message: 'התנגשות עם המערכת הקבועה' });

    const newAllocation = new Allocation({
      roomId, type: 'temporary', date: selectedDate, startTime, endTime, notes: notes || ''
    });

    await newAllocation.save();
    res.status(201).json({ message: 'השיבוץ הזמני נוסף בהצלחה', allocation: newAllocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// חיבור לראוטים הנוספים
app.use('/api/rooms', require('./routes/roomRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
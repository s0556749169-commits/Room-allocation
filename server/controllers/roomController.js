const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Cancellation = require('../models/cancellation');

// ─── Helper ──────────────────────────────────────────────────────────────────

function normalizeDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

// ─── GET all rooms ────────────────────────────────────────────────────────────

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('assignments').populate('cancellations');
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בשליפת החדרים', error: error.message });
  }
};

// ─── GET single room ──────────────────────────────────────────────────────────

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('assignments')
      .populate('cancellations');

    if (!room) {
      return res.status(404).json({ success: false, message: 'חדר לא נמצא' });
    }

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בשליפת החדר', error: error.message });
  }
};

// ─── POST create room ─────────────────────────────────────────────────────────

exports.createRoom = async (req, res) => {
  try {
    const { wing, floor, size, hasProjector } = req.body;

    if (!wing || floor === undefined || !size) {
      return res.status(400).json({
        success: false,
        message: 'שדות חובה חסרים: אגף, קומה, גודל',
      });
    }

    const existing = await Room.findOne({ wing, floor, size });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `חדר עם אגף ${wing}, קומה ${floor}, גודל ${size} כבר קיים`,
      });
    }

    const room = await Room.create({ wing, floor, size, hasProjector: hasProjector ?? false });

    res.status(201).json({ success: true, message: 'החדר נוצר בהצלחה', data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה ביצירת החדר', error: error.message });
  }
};

// ─── PUT update room ──────────────────────────────────────────────────────────

exports.updateRoom = async (req, res) => {
  try {
    const { wing, floor, size, hasProjector } = req.body;
    const allowedUpdates = {};

    if (wing !== undefined) allowedUpdates.wing = wing;
    if (floor !== undefined) allowedUpdates.floor = floor;
    if (size !== undefined) allowedUpdates.size = size;
    if (hasProjector !== undefined) allowedUpdates.hasProjector = hasProjector;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ success: false, message: 'לא הועברו שדות לעדכון' });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'חדר לא נמצא' });
    }

    res.status(200).json({ success: true, message: 'החדר עודכן בהצלחה', data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בעדכון החדר', error: error.message });
  }
};

// ─── DELETE room ──────────────────────────────────────────────────────────────

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'חדר לא נמצא' });
    }

    // מחיקת כל השיבוצים והביטולים המשויכים לפני מחיקת החדר
    await Allocation.deleteMany({ roomId: req.params.id });
    await Cancellation.deleteMany({ room: req.params.id });
    await room.deleteOne();

    res.status(200).json({ success: true, message: 'החדר וכל השיבוצים הקשורים נמחקו בהצלחה' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה במחיקת החדר', error: error.message });
  }
};

// ─── Search available rooms ───────────────────────────────────────────────────

exports.searchAvailableRooms = async (req, res) => {
  try {
    const { wing, floor, size, hasProjector, date } = req.query;

    const query = {};
    if (wing) query.wing = wing;
    if (floor !== undefined) query.floor = Number(floor);
    if (size !== undefined) query.size = { $gte: Number(size) };
    if (hasProjector !== undefined) query.hasProjector = hasProjector === 'true';

    let rooms = await Room.find(query).populate('cancellations');

    if (date) {
      const searchDate = normalizeDate(date);
      if (!searchDate) {
        return res.status(400).json({ success: false, message: 'תאריך לא תקין' });
      }
      const searchMs = searchDate.getTime();
      rooms = rooms.filter(room =>
        !room.cancellations.some(c => normalizeDate(c.date)?.getTime() === searchMs)
      );
    }

    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בחיפוש חדרים פנויים', error: error.message });
  }
};

// ─── Add permanent allocation ─────────────────────────────────────────────────

exports.addPermanentAllocation = async (req, res) => {
  try {
    const { startTime, endTime, dayOfWeek, notes } = req.body;
    const roomId = req.params.id;

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'שעת התחלה חייבת להיות לפני שעת סיום' });
    }

    const conflict = await Allocation.findOne({
      roomId,
      type: 'permanent',
      dayOfWeek,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `קיימת התנגשות: החדר תפוס בין ${conflict.startTime} ל-${conflict.endTime}`,
      });
    }

    const allocation = await Allocation.create({ roomId, type: 'permanent', startTime, endTime, dayOfWeek, notes });
    await Room.findByIdAndUpdate(roomId, { $push: { assignments: allocation._id } });

    res.status(201).json({ success: true, message: 'השיבוץ הקבוע נוסף בהצלחה', data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בהוספת שיבוץ קבוע', error: error.message });
  }
};

// ─── Add temporary allocation ─────────────────────────────────────────────────

exports.addTemporaryAllocation = async (req, res) => {
  try {
    const { date, startTime, endTime, notes } = req.body;
    const roomId = req.params.id;

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'שעת התחלה חייבת להיות לפני שעת סיום' });
    }

    const selectedDate = normalizeDate(date);
    if (!selectedDate) {
      return res.status(400).json({ success: false, message: 'תאריך לא תקין' });
    }

    const nextDay = new Date(selectedDate.getTime() + 86_400_000);
    const dayOfWeek = selectedDate.getDay();

    const [tempConflict, permConflict] = await Promise.all([
      Allocation.findOne({
        roomId,
        type: 'temporary',
        date: { $gte: selectedDate, $lt: nextDay },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      }),
      Allocation.findOne({
        roomId,
        type: 'permanent',
        dayOfWeek,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      }),
    ]);

    if (tempConflict) {
      return res.status(409).json({ success: false, message: 'התנגשות עם שיבוץ זמני קיים' });
    }
    if (permConflict) {
      return res.status(409).json({ success: false, message: 'התנגשות עם המערכת הקבועה' });
    }

    const allocation = await Allocation.create({
      roomId,
      type: 'temporary',
      date: selectedDate,
      startTime,
      endTime,
      notes: notes ?? '',
    });

    await Room.findByIdAndUpdate(roomId, { $push: { assignments: allocation._id } });

    res.status(201).json({ success: true, message: 'השיבוץ הזמני נוסף בהצלחה', data: allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'שגיאה בהוספת שיבוץ זמני', error: error.message });
  }
};
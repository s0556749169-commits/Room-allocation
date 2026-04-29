const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Cancellation = require('../models/Cancellation');

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function getNextDate(date) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}

function isValidTime(time) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  return value === 'true' || value === true;
}

exports.searchAvailableRooms = async (req, res) => {
  try {
    const { wing, floor, minSize, size, hasProjector, date, startTime, endTime } = req.query;

    const roomFilter = {};

    if (wing) roomFilter.wing = wing;
    if (floor) roomFilter.floor = Number(floor);

    const requestedSize = minSize || size;
    if (requestedSize) roomFilter.size = { $gte: Number(requestedSize) };

    const projectorValue = parseBoolean(hasProjector);
    if (projectorValue !== undefined) roomFilter.hasProjector = projectorValue;

    const rooms = await Room.find(roomFilter).sort({
      size: 1,
      floor: 1,
      wing: 1
    });

    if (!date && !startTime && !endTime) {
      return res.json({
        success: true,
        count: rooms.length,
        data: rooms
      });
    }

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'לחיפוש זמינות חובה לשלוח date, startTime, endTime'
      });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'שעות לא תקינות. יש לשלוח בפורמט HH:mm'
      });
    }

    const selectedDate = normalizeDate(date);
    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: 'תאריך לא תקין'
      });
    }

    const nextDate = getNextDate(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const roomIds = rooms.map(room => room._id);

    const cancellations = await Cancellation.find({
      roomId: { $in: roomIds },
      date: { $gte: selectedDate, $lt: nextDate }
    });

    const cancelledRoomIds = new Set(
      cancellations.map(item => item.roomId.toString())
    );

    const conflicts = await Allocation.find({
      roomId: { $in: roomIds },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      $or: [
        {
          type: 'temporary',
          date: { $gte: selectedDate, $lt: nextDate }
        },
        {
          type: 'permanent',
          dayOfWeek
        }
      ]
    });

    const busyRoomIds = new Set();

    conflicts.forEach(item => {
      const roomId = item.roomId.toString();

      if (item.type === 'permanent' && cancelledRoomIds.has(roomId)) {
        return;
      }

      busyRoomIds.add(roomId);
    });

    const availableRooms = rooms.filter(
      room => !busyRoomIds.has(room._id.toString())
    );

    res.json({
      success: true,
      count: availableRooms.length,
      data: availableRooms
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאה בחיפוש חדרים פנויים',
      error: error.message
    });
  }
};

exports.createCancellation = async (req, res) => {
  try {
    const { roomId, date, note } = req.body;

    if (!roomId || !date) {
      return res.status(400).json({
        success: false,
        message: 'חובה לשלוח roomId ו-date'
      });
    }

    const selectedDate = normalizeDate(date);
    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: 'תאריך לא תקין'
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    const cancellation = await Cancellation.create({
      roomId,
      date: selectedDate,
      note: note || ''
    });

    await Room.findByIdAndUpdate(roomId, {
      $addToSet: { cancellations: cancellation._id }
    });

    res.status(201).json({
      success: true,
      message: 'ביטול חד פעמי נוצר בהצלחה',
      data: cancellation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת ביטול חד פעמי',
      error: error.message
    });
  }
};
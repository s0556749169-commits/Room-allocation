const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema({
  // התאריך שבו החדר מבוטל
  date: { 
    type: Date, 
    required: [true, 'חובה להזין תאריך ביטול'] 
  },
  // קישור לחדר הספציפי (מבוסס על ה-ID של מודל Room)
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: [true, 'חובה לקשר את הביטול לחדר'] 
  },
  // הערה המסבירה למה החדר בוטל
  note: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true }); // מוסיף אוטומטית שדות של זמן יצירה ועדכון

module.exports = mongoose.model('Cancellation', cancellationSchema);
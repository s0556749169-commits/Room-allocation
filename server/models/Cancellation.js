const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema({
    // קשר לחדר - חובה לפי האפיון
    roomId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    date: { type: Date, required: true }, // תאריך הביטול
    startTime: { type: String, required: true }, // שעת התחלה
    endTime: { type: String, required: true },   // שעת סיום
    reason: String // סיבה לביטול (אופציונלי)
});

module.exports = mongoose.model('Cancellation', cancellationSchema);
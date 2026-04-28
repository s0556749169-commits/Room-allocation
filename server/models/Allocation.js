const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
    // קשר לחדר (לפי דרישות המשימה)
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    // האם השיבוץ קבוע (permanent) או זמני (temporary)
    type: {
        type: String,
        enum: ['permanent', 'temporary'],
        required: true
    },
    // שעות (לפי דרישות המשימה)
    startTime: { type: String, required: true }, // למשל "08:00"
    endTime: { type: String, required: true },   // למשל "09:30"
    
    // יום בשבוע (לשיבוץ קבוע - שח"ת)
    dayOfWeek: {
        type: Number, // 0=ראשון, 1=שני...
        required: function() { return this.type === 'permanent'; }
    },
    // תאריך ספציפי (לשיבוץ זמני)
    date: {
        type: Date,
        required: function() { return this.type === 'temporary'; }
    },
    notes: String
});

module.exports = mongoose.model('Allocation', allocationSchema);
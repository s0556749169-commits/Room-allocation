const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // שדות (אגף, קומה, גודל, מקרן)
  wing: { type: String, required: true },
  floor: { type: Number, required: true },
  size: { type: Number, required: true },
  hasProjector: { type: Boolean, default: false },

  // מערכים (שיבוצים, ביטולים) - זה מה שמשלים את המשימה!
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  cancellations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancellation'
  }]
});

module.exports = mongoose.model('Room', roomSchema);
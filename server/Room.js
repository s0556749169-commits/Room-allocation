const mongoose = require('mongoose');

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

// ייצוא המודל בלבד
const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
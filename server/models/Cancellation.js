const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  note: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Cancellation', cancellationSchema);
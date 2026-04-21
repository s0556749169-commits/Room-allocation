const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  wing: { type: String, required: true },
  floor: { type: Number, required: true },
  size: { type: Number, required: true },
  hasProjector: { type: Boolean, default: false }
});

module.exports = mongoose.model('Room', roomSchema);
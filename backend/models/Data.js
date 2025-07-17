// models/Data.js
const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  sensor: { type: String, required: true },
  timestamp: { type: Date, required: true },
  data: { type: mongoose.Schema.Types.Mixed }  // Stores flexible sensor fields
});

module.exports = mongoose.model('Data', DataSchema);

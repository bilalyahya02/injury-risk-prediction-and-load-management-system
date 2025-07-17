const mongoose = require("mongoose");

const riskLogSchema = new mongoose.Schema({
  username: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  baseRisk: Number,
  liveRisk: Number,
  finalRisk: Number,
  stats: {
    type: mongoose.Schema.Types.Mixed
  }
});

module.exports = mongoose.model("RiskLog", riskLogSchema);

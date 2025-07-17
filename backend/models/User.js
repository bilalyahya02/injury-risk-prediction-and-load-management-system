// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  devices: [String], 
  isAdmin: { type: Boolean, default: false },

  // Injury Risk Profile
  height_cm: { type: Number },
  weight_kg: { type: Number },
  age: { type: Number },
  gender: { type: String, enum: ["male", "female"] },
  sport: { type: String },
  fitness_level: { type: String, enum: ["low", "medium", "high"] },
  previous_injuries: [
    {
      body_part: { type: String },
      weeks_ago: { type: Number }
    }
  ]
});

module.exports = mongoose.model('User', UserSchema);
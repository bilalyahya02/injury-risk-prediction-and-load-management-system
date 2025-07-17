// routes/data.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Data = require('../models/Data');
const { jwtSecret } = require('../config');

// ✅ Auth middleware
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Missing token' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// 📦 GET /api/data/:device_id
router.get('/:device_id', auth, async (req, res) => {
  const { device_id } = req.params;

  const user = await User.findById(req.userId);
  if (!user || !user.devices.includes(device_id)) {
    return res.status(403).json({ msg: 'Access denied to this device' });
  }

  const data = await Data.find({ device_id })
    .sort({ timestamp: -1 })
    .limit(100); // last 100 messages

  res.json(data);
});

module.exports = router;
